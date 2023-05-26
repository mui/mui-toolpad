import { ExecFetchResult } from '@mui/toolpad-core';
import type { Message as MessageToChildProcess } from '@mui/toolpad-core/localRuntime';
import { SerializedError, errorFrom, serializeError } from '@mui/toolpad-utils/errors';
import * as child_process from 'child_process';
import * as esbuild from 'esbuild';
import * as path from 'path';
import invariant from 'invariant';
import { indent } from '@mui/toolpad-utils/strings';
import * as chokidar from 'chokidar';
import chalk from 'chalk';
import { glob } from 'glob';
import config from '../../config';
import { ServerDataSource } from '../../types';
import { LocalPrivateQuery, LocalQuery, LocalConnectionParams } from './types';
import { Maybe } from '../../utils/types';
import {
  getUserProjectRoot,
  openQueryEditor,
  getOutputFolder,
  getResourcesFolder,
  createFunctionFile,
} from '../../server/localMode';
import { waitForInit, getProject } from '../../server/liveProject';

type MessageFromChildProcess = {
  kind: 'result';
  id: number;
  data: unknown;
  error: SerializedError;
};

declare module globalThis {
  let builder: Promise<ReturnType<typeof createBuilder>>;
}

let nextMsgId = 1;

function getNextId() {
  const id = nextMsgId;
  nextMsgId += 1;
  return id;
}

interface Execution {
  id: number;
  reject: (err: Error) => void;
  resolve: (result: any) => void;
  timeout: NodeJS.Timeout;
}

const pendingExecutions = new Map<number, Execution>();

let setInitialized: () => void;
const initPromise = new Promise<void>((resolve) => {
  setInitialized = resolve;
});

function formatCodeFrame(location: esbuild.Location): string {
  const lineNumberCharacters = Math.ceil(Math.log10(location.line));
  return [
    `${location.file}:${location.line}:${location.column}:`,
    `  ${location.line} │ ${location.lineText}`,
    `  ${' '.repeat(lineNumberCharacters)} ╵ ${' '.repeat(
      Math.max(location.lineText.length - 1, 0),
    )}^`,
  ].join('\n');
}

function pathToNodeImportSpecifier(importPath: string): string {
  const normalized = path.normalize(importPath).split(path.sep).join('/');
  return normalized.startsWith('/') ? normalized : `./${normalized}`;
}

function getFunctionResourcesPattern(root: string): string {
  return path.join(getResourcesFolder(root), 'functions.ts');
}

async function createMain(root: string): Promise<string> {
  const resourcesFolder = getResourcesFolder(root);
  const functionFiles = await glob(getFunctionResourcesPattern(root));

  const functionImports = functionFiles.map((file) => {
    const fileName = path.relative(resourcesFolder, file);
    const importSpec = pathToNodeImportSpecifier(
      ['.', getResourcesFolder('.'), fileName].join(path.sep),
    );
    const name = path.basename(fileName).replace(/\..*$/, '');
    return `[${JSON.stringify(name)}, () => import(${JSON.stringify(importSpec)})]`;
  });

  return `
    import fetch, { Headers, Request, Response } from 'node-fetch'
    import { setup } from '@mui/toolpad-core/localRuntime';

    // Polyfill fetch() in the Node.js environment
    if (!global.fetch) {
      global.fetch = fetch
      global.Headers = Headers
      global.Request = Request
      global.Response = Response
    }

    setup({
      functions: new Map([${functionImports.join(', ')}]),
    })
  `;
}

async function createBuilder(root: string) {
  await waitForInit();
  const project = await getProject();

  const userProjectRoot = getUserProjectRoot();

  let currentRuntimeProcess: child_process.ChildProcess | undefined;
  let controller: AbortController | undefined;
  let buildErrors: Error[] = [];
  let runtimeError: Error | undefined;

  let outputFile: string | undefined;
  let metafile: esbuild.Metafile | undefined;
  let env: Record<string, string> = await project.envManager.getValues();

  const restartRuntimeProcess = () => {
    if (controller) {
      controller.abort();
      controller = undefined;

      // clean up handlers
      for (const [id, execution] of pendingExecutions) {
        execution.reject(new Error(`Aborted`));
        clearTimeout(execution.timeout);
        pendingExecutions.delete(id);
      }
    }

    if (!outputFile) {
      return;
    }

    controller = new AbortController();

    const runtimeProcess = child_process.fork(`./${outputFile}`, {
      cwd: userProjectRoot,
      silent: true,
      signal: controller.signal,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: config.cmd === 'start' ? 'production' : 'development',
        ...env,
      },
    });

    runtimeError = undefined;

    runtimeProcess.on('error', (error) => {
      if (error.name === 'AbortError') {
        return;
      }
      runtimeError = error;
      console.error(`cp ${runtimeProcess.pid} error`, error);
    });

    runtimeProcess.on('exit', (code) => {
      if (currentRuntimeProcess === runtimeProcess) {
        currentRuntimeProcess = undefined;
        if (code !== 0) {
          runtimeError = new Error(`The runtime process exited with code ${code}`);
          if (config.cmd === 'start') {
            console.error(`The runtime process exited with code ${code}`);
            process.exit(1);
          }
        }
      }
    });

    runtimeProcess.on('message', (msg: MessageFromChildProcess) => {
      switch (msg.kind) {
        case 'result': {
          const execution = pendingExecutions.get(msg.id);
          if (execution) {
            pendingExecutions.delete(msg.id);
            clearTimeout(execution.timeout);
            if (msg.error) {
              execution.reject(new Error(msg.error.message || 'Unknown error'));
            } else {
              execution.resolve(msg.data);
            }
          }
          break;
        }
        default:
          console.error(`Unknown message received "${msg.kind}"`);
      }
    });

    currentRuntimeProcess = runtimeProcess;
  };

  const toolpadPlugin: esbuild.Plugin = {
    name: 'toolpad',
    setup(build) {
      build.onResolve({ filter: /^toolpad:/ }, (args) => ({
        path: args.path.slice('toolpad:'.length),
        namespace: 'toolpad',
      }));

      build.onLoad({ filter: /.*/, namespace: 'toolpad' }, async (args) => {
        if (args.path === 'main.ts') {
          return {
            loader: 'tsx',
            contents: await createMain(root),
            resolveDir: userProjectRoot,
          };
        }

        throw new Error(`Can't resolve "${args.path}" for toolpad namespace`);
      });

      build.onEnd((args) => {
        // TODO: use for hot reloading
        // eslint-disable-next-line no-console
        console.log(
          `${chalk.green('ready')} - built functions.ts: ${args.errors.length} error(s), ${
            args.warnings.length
          } warning(s)`,
        );

        buildErrors = args.errors.map((message) => {
          let messageText = message.text;
          if (message.location) {
            const formattedLocation = indent(formatCodeFrame(message.location), 2);
            messageText = [messageText, formattedLocation].join('\n');
          }
          return new Error(messageText);
        });

        if (buildErrors.length <= 0) {
          metafile = args.metafile;
          invariant(metafile, 'esbuild settings should enable metafile');
          const mainEntry = Object.entries(metafile.outputs).find(
            ([, entry]) => entry.entryPoint === 'toolpad:main.ts',
          );
          invariant(mainEntry, 'No output found for main entry point');
          outputFile = mainEntry[0];

          restartRuntimeProcess();
        }

        project.events.emit('functionsBuildEnd', {});

        setInitialized();
      });
    },
  };

  const ctx = await esbuild.context({
    absWorkingDir: userProjectRoot,
    entryPoints: ['toolpad:main.ts'],
    plugins: [toolpadPlugin],
    write: true,
    bundle: true,
    metafile: true,
    outdir: path.resolve(getOutputFolder(userProjectRoot), 'functions'),
    platform: 'node',
    packages: 'external',
    target: 'es2022',
  });

  async function sendRequest(msg: MessageToChildProcess) {
    await initPromise;
    return new Promise((resolve, reject) => {
      if (buildErrors.length > 0) {
        const firstError = buildErrors[0];
        reject(firstError);
      } else if (runtimeError) {
        reject(runtimeError);
      } else if (currentRuntimeProcess) {
        const timeout = setTimeout(() => {
          pendingExecutions.delete(msg.id);
          reject(new Error(`Timeout`));
        }, 60000);
        pendingExecutions.set(msg.id, {
          id: msg.id,
          resolve,
          reject,
          timeout,
        });
        currentRuntimeProcess.send(msg);
      } else {
        reject(new Error(`Toolpad local runtime is not running`));
      }
    });
  }

  async function execute(name: string, parameters: Record<string, unknown>) {
    return sendRequest({
      kind: 'exec',
      id: getNextId(),
      name,
      parameters,
    });
  }

  async function introspect() {
    return sendRequest({
      kind: 'introspect',
      id: getNextId(),
    });
  }

  let resourcesWatcher: chokidar.FSWatcher | undefined;

  const unsubscribers: (() => void)[] = [];

  return {
    watch() {
      ctx.watch();

      const unsubscribeEnv = project.events.subscribe('envChanged', async () => {
        env = await project.envManager.getValues();
        restartRuntimeProcess();
      });

      unsubscribers.push(unsubscribeEnv);

      // Make sure we pick up added/removed function files
      (async () => {
        try {
          if (resourcesWatcher) {
            await resourcesWatcher.close();
          }
          const pattern = getFunctionResourcesPattern(root);

          const calculateFingerPrint = async () => {
            const functionFiles = await glob(pattern);
            return functionFiles.join('|');
          };

          let fingerprint = await calculateFingerPrint();

          const globalResourcesFolder = path.resolve(pattern);
          resourcesWatcher = chokidar.watch([globalResourcesFolder]);
          resourcesWatcher.on('all', async () => {
            const newFingerprint = await calculateFingerPrint();
            if (fingerprint !== newFingerprint) {
              fingerprint = newFingerprint;
              ctx.rebuild();
            }
          });
        } catch (err: unknown) {
          if (errorFrom(err).name === 'AbortError') {
            return;
          }
          throw err;
        }
      })();
    },
    introspect,
    execute,
    async dispose() {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      await Promise.all([ctx.dispose(), controller?.abort()]);
    },
  };
}

async function execBase(
  connection: Maybe<LocalConnectionParams>,
  localQuery: LocalQuery,
  params: Record<string, string>,
) {
  if (!localQuery.function) {
    throw new Error(`No function name chosen`);
  }
  try {
    const builder = await globalThis.builder;
    const data = await builder.execute(localQuery.function, params);
    return { data };
  } catch (rawError) {
    return { error: serializeError(errorFrom(rawError)) };
  }
}

async function execPrivate(connection: Maybe<LocalConnectionParams>, query: LocalPrivateQuery) {
  switch (query.kind) {
    case 'introspection': {
      const builder = await globalThis.builder;
      const introspectionResult = await builder.introspect();
      return introspectionResult;
    }
    case 'debugExec':
      return execBase(connection, query.query, query.params);
    case 'openEditor':
      return openQueryEditor();
    default:
      throw new Error(`Unknown private query "${(query as LocalPrivateQuery).kind}"`);
  }
}

async function exec(
  connection: Maybe<LocalConnectionParams>,
  fetchQuery: LocalQuery,
  params: Record<string, string>,
): Promise<ExecFetchResult<any>> {
  const { data, error } = await execBase(connection, fetchQuery, params);
  return { data, error };
}

const dataSource: ServerDataSource<{}, LocalQuery, any> = {
  exec,
  execPrivate,
};

export default dataSource;

async function startDev() {
  const builder = await createBuilder(getUserProjectRoot());
  await builder.watch();
  return builder;
}

globalThis.builder = globalThis.builder || startDev();
