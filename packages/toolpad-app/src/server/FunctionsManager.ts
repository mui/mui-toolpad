import * as path from 'path';
import * as fs from 'fs/promises';
import { Emitter } from '@mui/toolpad-utils/events';
import * as esbuild from 'esbuild';
import { ensureSuffix, indent } from '@mui/toolpad-utils/strings';
import * as chokidar from 'chokidar';
import chalk from 'chalk';
import { glob } from 'glob';
import { writeFileRecursive, fileExists, readJsonFile } from '@mui/toolpad-utils/fs';
import { replaceRecursive, getCircularReplacer } from '@mui/toolpad-utils/json';
import invariant from 'invariant';
import Piscina from 'piscina';
import { ExecFetchResult } from '@mui/toolpad-core';
import { errorFrom } from '@mui/toolpad-utils/errors';
import { createRequire } from 'node:module';
import * as vm from 'vm';
import * as url from 'url';
import fetch, { Headers, Request, Response } from 'node-fetch';
import EnvManager from './EnvManager';
import { ProjectEvents, ToolpadProjectOptions } from '../types';
import type { ExtractTypesParams, IntrospectionResult } from './functionsTypesWorker';
import { Awaitable } from '../utils/types';
import { format } from '../utils/prettier';
import { compilerOptions } from './functionsShared';

function removeCircularReferences(obj: any): any {
  return replaceRecursive(obj, getCircularReplacer());
}

interface ModuleObject {
  exports: Record<string, unknown>;
}

function createDefaultFunction(): string {
  return format(`
    /**
     * Toolpad handlers file.
     */

    export default async function handler (message: string) {
      return \`Hello \${message}\`;
    }
  `);
}

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

function formatError(esbuildError: esbuild.Message): Error {
  let messageText = esbuildError.text;
  if (esbuildError.location) {
    const formattedLocation = indent(formatCodeFrame(esbuildError.location), 2);
    messageText = [messageText, formattedLocation].join('\n');
  }
  return new Error(messageText);
}

interface IToolpadProject {
  options: ToolpadProjectOptions;
  events: Emitter<ProjectEvents>;
  getRoot(): string;
  getToolpadFolder(): string;
  getOutputFolder(): string;
  envManager: EnvManager;
  invalidateQueries(): void;
}

function createContext() {
  return vm.createContext({ process, console, fetch, Headers, Request, Response }, {});
}

export default class FunctionsManager {
  private project: IToolpadProject;

  private buildErrors: esbuild.Message[] = [];

  private extractedTypes: Awaitable<IntrospectionResult> | undefined;

  private extractTypesWorker: Piscina | undefined;

  private buildCtx: esbuild.BuildContext | undefined;

  private fileContents = new Map<string, string>();

  private moduleCache = new Map<string, ModuleObject>();

  private fnContext = createContext();

  constructor(project: IToolpadProject) {
    this.project = project;
    if (this.shouldExtractTypes()) {
      this.extractTypesWorker = new Piscina({
        filename: path.join(__dirname, 'functionsTypesWorker.js'),
      });
    }
  }

  shouldExtractTypes(): boolean {
    return this.project.options.cmd !== 'start';
  }

  private getResourcesFolder(): string {
    return path.join(this.project.getToolpadFolder(), './resources');
  }

  private getFunctionsFile(): string {
    return path.join(this.getResourcesFolder(), './functions.ts');
  }

  async getFunctionFilePath(fileName: string): Promise<string> {
    const resourcesFolder = this.getResourcesFolder();
    return path.join(resourcesFolder, fileName);
  }

  private getFunctionResourcesPattern(): string {
    return path.join(this.getResourcesFolder(), '*.ts');
  }

  private async migrateLegacy() {
    const legacyQueriesFile = path.resolve(this.project.getToolpadFolder(), 'queries.ts');
    if (await fileExists(legacyQueriesFile)) {
      const functionsFile = this.getFunctionsFile();
      await fs.mkdir(path.dirname(functionsFile), { recursive: true });
      await fs.rename(legacyQueriesFile, functionsFile);
    }
  }

  private async getFunctionFiles(): Promise<string[]> {
    const paths = await glob(this.getFunctionResourcesPattern(), { windowsPathsNoEscape: true });
    return paths.map((fullPath) => path.relative(this.project.getRoot(), fullPath));
  }

  private getBuildErrorsForFile(entryPoint: string) {
    return this.buildErrors.filter((error) => error.location?.file === entryPoint);
  }

  private getOutputFile(fileName: string): string | undefined {
    return path.resolve(this.getFunctionsOutputFolder(), `${path.basename(fileName, '.ts')}.js`);
  }

  private getFunctionsOutputFolder(): string {
    return path.resolve(this.project.getOutputFolder(), 'functions');
  }

  private getIntrospectJsonPath(): string {
    return path.resolve(this.getFunctionsOutputFolder(), 'introspect.json');
  }

  loadModule(fullPath: string, content: string) {
    const moduleRequire = createRequire(url.pathToFileURL(fullPath));
    const moduleObject: ModuleObject = { exports: {} };

    vm.runInContext(`((require, exports, module) => {\n${content}\n})`, this.fnContext)(
      moduleRequire,
      moduleObject.exports,
      moduleObject,
    );

    return moduleObject;
  }

  async resolveFunctions(filePath: string): Promise<Record<string, Function>> {
    const fullPath = path.resolve(filePath);
    const content = await fs.readFile(fullPath, 'utf-8');

    if (content !== this.fileContents.get(fullPath)) {
      this.moduleCache.delete(fullPath);
      this.fileContents.set(fullPath, content);
    }

    let cachedModule = this.moduleCache.get(fullPath);

    if (!cachedModule) {
      cachedModule = this.loadModule(fullPath, content);
      this.moduleCache.set(fullPath, cachedModule);
    }

    return Object.fromEntries(
      Object.entries(cachedModule.exports).flatMap(([key, value]) =>
        typeof value === 'function' ? [[key, value]] : [],
      ),
    );
  }

  async executeFn(filePath: string, name: string, parameters: any) {
    const fns = await this.resolveFunctions(filePath);

    const fn = fns[name];
    if (typeof fn !== 'function') {
      throw new Error(`Function "${name}" not found`);
    }

    return fn(...parameters);
  }

  private async extractTypes() {
    invariant(this.shouldExtractTypes(), 'extractTypes() can not be used in prod mode');
    invariant(this.extractTypesWorker, 'this.extractTypesWorker should have been initialized');
    const extractedTypes: Promise<IntrospectionResult> = this.extractTypesWorker
      .run({ resourcesFolder: this.getResourcesFolder() } satisfies ExtractTypesParams, {})
      .catch((error: unknown) => ({
        error,
        files: [],
      }));
    return extractedTypes;
  }

  private async createEsbuildContext() {
    const root = this.project.getRoot();

    const onFunctionBuildStart = async () => {
      this.extractedTypes = undefined;
    };

    const onFunctionsBuildEnd = async (args: esbuild.BuildResult<esbuild.BuildOptions>) => {
      // TODO: use for hot reloading
      // eslint-disable-next-line no-console
      console.log(
        `${chalk.green('ready')} - built functions.ts: ${args.errors.length} error(s), ${
          args.warnings.length
        } warning(s)`,
      );

      this.buildErrors = args.errors;

      this.project.invalidateQueries();

      // Reset context
      this.fnContext = createContext();
    };

    const toolpadPlugin: esbuild.Plugin = {
      name: 'toolpad',
      setup(build) {
        build.onStart(onFunctionBuildStart);
        build.onEnd(onFunctionsBuildEnd);
      },
    };

    const entryPoints = await this.getFunctionFiles();
    return esbuild.context({
      absWorkingDir: root,
      entryPoints,
      plugins: [toolpadPlugin],
      write: true,
      bundle: true,
      metafile: true,
      outdir: this.getFunctionsOutputFolder(),
      platform: 'node',
      packages: 'external',
      target: 'es2022',
      tsconfigRaw: JSON.stringify({ compilerOptions }),
      loader: {
        '.txt': 'text',
        '.sql': 'text',
      },
    });
  }

  private async startWatchingFunctionFiles() {
    // Make sure we pick up added/removed function files
    const resourcesWatcher = chokidar.watch([this.getFunctionResourcesPattern()], {
      ignoreInitial: true,
    });

    const reinitializeWatcher = async () => {
      await this.buildCtx?.dispose();
      this.buildCtx = await this.createEsbuildContext();
      await this.buildCtx.watch();
    };

    reinitializeWatcher();
    resourcesWatcher.on('add', reinitializeWatcher);
    resourcesWatcher.on('unlink', reinitializeWatcher);
  }

  async start() {
    if (this.project.options.dev) {
      await this.migrateLegacy();

      await this.startWatchingFunctionFiles();

      this.project.events.subscribe('envChanged', async () => {
        await this.project.invalidateQueries();
      });
    }
  }

  async build() {
    const ctx = await this.createEsbuildContext();
    await ctx.rebuild();
    await ctx.dispose();

    const types = await this.extractTypes();
    if (types.error) {
      throw errorFrom(types.error);
    }

    await fs.mkdir(this.getFunctionsOutputFolder(), { recursive: true });
    await fs.writeFile(this.getIntrospectJsonPath(), JSON.stringify(types, null, 2), 'utf-8');
  }

  private async disposeBuildcontext() {
    this.buildCtx?.dispose();
    this.buildCtx = undefined;
  }

  async dispose() {
    await Promise.all([this.disposeBuildcontext(), this.extractTypesWorker?.destroy()]);
  }

  async exec(
    fileName: string,
    name: string,
    parameters: Record<string, unknown>,
  ): Promise<ExecFetchResult<unknown>> {
    const resourcesFolder = this.getResourcesFolder();
    const fullPath = path.resolve(resourcesFolder, fileName);
    const entryPoint = path.relative(this.project.getRoot(), fullPath);

    const buildErrors = this.getBuildErrorsForFile(entryPoint);

    if (buildErrors.length > 0) {
      throw formatError(buildErrors[0]);
    }

    const outputFilePath = this.getOutputFile(fileName);
    if (!outputFilePath) {
      throw new Error(`No build found for "${fileName}"`);
    }

    const extractedTypes = await this.introspect();

    if (extractedTypes.error) {
      throw errorFrom(extractedTypes.error);
    }

    const file = extractedTypes.files.find((fileEntry) => fileEntry.name === fileName);
    const handler = file?.handlers.find((handlerEntry) => handlerEntry.name === name);

    if (!handler) {
      throw new Error(`No function found with the name "${name}"`);
    }

    const executeParams = handler.isCreateFunction
      ? [{ parameters }]
      : handler.parameters.map(([parameterName]) => parameters[parameterName]);

    const data = await this.executeFn(outputFilePath, name, executeParams);

    return { data: removeCircularReferences(data) };
  }

  async introspect(): Promise<IntrospectionResult> {
    if (!this.extractedTypes) {
      if (this.shouldExtractTypes()) {
        this.extractedTypes = this.extractTypes();
      } else {
        this.extractedTypes = readJsonFile(
          this.getIntrospectJsonPath(),
        ) as Promise<IntrospectionResult>;
      }
    }

    return this.extractedTypes;
  }

  async createFunctionFile(name: string): Promise<void> {
    const filePath = path.resolve(this.getResourcesFolder(), ensureSuffix(name, '.ts'));
    const content = createDefaultFunction();
    if (await fileExists(filePath)) {
      throw new Error(`"${name}" already exists`);
    }
    await writeFileRecursive(filePath, content, { encoding: 'utf-8' });
    this.extractedTypes = undefined;
  }
}
