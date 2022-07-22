import ivm from 'isolated-vm';
import * as esbuild from 'esbuild';
import type * as harFormat from 'har-format';
import { withHar, createHarLog } from 'node-fetch-har';
import * as fs from 'fs/promises';
import fetch from 'node-fetch';
import * as path from 'path';
import { FunctionResult } from './types';
import { LogEntry } from '../../components/Console';
import { FetchOptions } from './runtime/types';
import projectRoot from '../../server/projectRoot';

async function fetchRuntimeModule() {
  const filePath = path.resolve(projectRoot, './src/toolpadDataSources/function/dist/index.js');
  return fs.readFile(filePath, {
    encoding: 'utf-8',
  });
}

let cachedRuntimeModule: Promise<string> | undefined;
async function getRuntimeModule() {
  if (!cachedRuntimeModule || process.env.NODE_ENV !== 'production') {
    cachedRuntimeModule = fetchRuntimeModule();
  }
  return cachedRuntimeModule;
}

const isolate = new ivm.Isolate({ memoryLimit: 128 });

export interface ExecFunctionOptions {
  params?: Record<string, unknown>;
  secrets?: Record<string, string>;
}

export default async function execFunction(
  code: string,
  { params = {}, secrets = {} }: ExecFunctionOptions = {},
): Promise<FunctionResult> {
  const context = isolate.createContextSync();
  const jail = context.global;
  jail.setSync('global', jail.derefInto());
  const logs: LogEntry[] = [];
  const har: harFormat.Har = createHarLog();

  const instrumentedFetch: typeof fetch = withHar(fetch, { har });

  const fetchStub = new ivm.Reference((url: string, rawOptions: FetchOptions) => {
    const options = {
      ...rawOptions,
      // node-fetch-har doesn't deal well with arrays here
      headers: Object.fromEntries(rawOptions.headers || []),
    };

    return instrumentedFetch(url, options).then(
      (res) => {
        const resHeadersInit = Array.from(res.headers.entries());

        return {
          url: res.url,
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
          headers: new ivm.ExternalCopy(resHeadersInit),
          json: new ivm.Reference(() => res.json()),
          text: new ivm.Reference(() => res.text()),
        };
      },
      (err) => {
        logs.push({
          timestamp: Date.now(),
          level: 'error',
          args: [{ name: err.name, message: err.message, stack: err.stack }],
        });

        throw err;
      },
    );
  });

  let nextTimeoutId = 1;
  const timeouts = new Map<number, NodeJS.Timeout>();

  const setTimeoutStub = new ivm.Reference(
    (cb: ivm.Reference<() => void>, ms: ivm.Reference<number>) => {
      const id = nextTimeoutId;
      nextTimeoutId += 1;

      const timeout = setTimeout(() => {
        timeouts.delete(id);
        cb.applyIgnored(null, []);
      }, ms.copySync());

      timeouts.set(id, timeout);

      return id;
    },
  );

  const clearTimeoutStub = new ivm.Reference((id: number) => {
    const timeout = timeouts.get(id);
    timeouts.delete(id);
    clearTimeout(timeout);
  });

  const consoleStub = new ivm.Reference((level: string, serializedArgs: string) => {
    logs.push({
      timestamp: Date.now(),
      level,
      args: JSON.parse(serializedArgs),
    });
  });

  await jail.set('TOOLPAD_BRIDGE', new ivm.ExternalCopy({}).copyInto());
  const bridge = await jail.get('TOOLPAD_BRIDGE');
  await bridge.set('fetch', fetchStub);
  await bridge.set('console', consoleStub);
  await bridge.set('setTimeout', setTimeoutStub);
  await bridge.set('clearTimeout', clearTimeoutStub);

  const runtime = await getRuntimeModule();
  await context.evalClosure(runtime, []);

  await jail.delete('TOOLPAD_BRIDGE');

  let data;
  let error: Error | undefined;

  try {
    const { code: userModuleJs } = await esbuild.transform(code, {
      loader: 'ts',
    });

    const userModule = await isolate.compileModule(userModuleJs);

    await userModule.instantiate(context, (specifier) => {
      throw new Error(`Not found "${specifier}"`);
    });

    userModule.evaluateSync({ timeout: 30000 });

    const defaultExport = await userModule.namespace.get('default', { reference: true });
    data = await defaultExport.apply(null, [{ params, secrets }], {
      arguments: { copy: true },
      result: { copy: true, promise: true },
      timeout: 30000,
    });
  } catch (userError) {
    error = userError instanceof Error ? userError : new Error(String(userError));
  }

  return { data, logs, error, har };
}
