import * as path from 'path';
import * as fs from 'fs/promises';
import { Emitter } from '@toolpad/utils/events';
import * as esbuild from 'esbuild';
import { ensureSuffix, indent } from '@toolpad/utils/strings';
import * as chokidar from 'chokidar';
import chalk from 'chalk';
import { glob } from 'glob';
import { writeFileRecursive, fileExists, readJsonFile } from '@toolpad/utils/fs';
import Piscina from 'piscina';
import {
  ExecFetchResult,
  GetRecordsParams,
  GetRecordsResult,
  PaginationMode,
  ToolpadDataProviderIntrospection,
} from '@toolpad/studio-runtime';
import { errorFrom } from '@toolpad/utils/errors';
import * as url from 'node:url';
import type { GridRowId } from '@mui/x-data-grid';
import invariant from 'invariant';
import { Awaitable } from '@toolpad/utils/types';
import { ProjectEvents } from '../types';
import * as functionsRuntime from './functionsRuntime';
import type { ExtractTypesParams, IntrospectionResult } from './functionsTypesWorker';
import { format } from '../utils/prettier';
import { compilerOptions } from './functionsShared';

export interface CreateDataProviderOptions {
  paginationMode: PaginationMode;
}

const currentDirectory = url.fileURLToPath(new URL('.', String(import.meta.url)));

async function createDefaultFunction(filePath: string): Promise<string> {
  const result = await format(
    `
    /**
     * Toolpad Studio handlers file.
     */

    export default async function handler (message: string) {
      return \`Hello \${message}\`;
    }
  `,
    filePath,
  );
  return result;
}

async function createDefaultDataProvider(
  filePath: string,
  options: CreateDataProviderOptions,
): Promise<string> {
  const result = await format(
    `
    /**
     * Toolpad data provider file.
     * See: https://mui.com/toolpad/studio/concepts/data-providers/
     */

    import { createDataProvider } from '@toolpad/studio/server';

    export default createDataProvider({
      ${options.paginationMode === 'cursor' ? 'paginationMode: "cursor",' : ''}
      async getRecords({ paginationModel: ${
        options.paginationMode === 'cursor' ? '{ cursor, pageSize }' : '{ start, pageSize }'
      } }) {
        return {
          records: [],
          ${options.paginationMode === 'cursor' ? 'cursor: null,' : ''}
        };
      }
    })
  `,
    filePath,
  );
  return result;
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
  options: { dev: boolean };
  events: Emitter<ProjectEvents>;
  getRoot(): string;
  getOutputFolder(): string;
}

export default class FunctionsManager {
  private project: IToolpadProject;

  private buildErrors: esbuild.Message[] = [];

  private extractedTypes: Awaitable<IntrospectionResult> | undefined;

  private extractTypesWorker: Piscina | undefined;

  private buildCtx: esbuild.BuildContext | undefined;

  constructor(project: IToolpadProject) {
    this.project = project;
  }

  private getResourcesFolder(): string {
    return path.join(this.project.getRoot(), './resources');
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
    const legacyQueriesFile = path.resolve(this.project.getRoot(), 'queries.ts');
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

  private getFunctionsOutputFolder(): string {
    return path.resolve(this.project.getOutputFolder(), 'functions');
  }

  private getIntrospectJsonPath(): string {
    return path.resolve(this.getFunctionsOutputFolder(), 'introspect.json');
  }

  private async extractTypes() {
    if (!this.extractTypesWorker) {
      this.extractTypesWorker = new Piscina({
        filename: path.resolve(currentDirectory, '../cli/functionsTypesWorker.mjs'),
      });
    }

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

      this.project.events.emit('functionsChanged', {});
    };

    const toolpadStudioPlugin: esbuild.Plugin = {
      name: 'toolpad-studio',
      setup(build) {
        build.onStart(onFunctionBuildStart);
        build.onEnd(onFunctionsBuildEnd);
      },
    };

    const entryPoints = await this.getFunctionFiles();
    return esbuild.context({
      absWorkingDir: root,
      entryPoints,
      plugins: [toolpadStudioPlugin],
      write: true,
      bundle: true,
      metafile: true,
      outdir: this.getFunctionsOutputFolder(),
      outExtension: { '.js': '.mjs' },
      platform: 'node',
      format: 'esm',
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

  async getBuiltOutputFilePath(fileName: string): Promise<string> {
    const resourcesFolder = this.getResourcesFolder();
    const fullPath = path.resolve(resourcesFolder, fileName);
    const entryPoint = path.relative(this.project.getRoot(), fullPath);

    const buildErrors = this.getBuildErrorsForFile(entryPoint);

    if (buildErrors.length > 0) {
      throw formatError(buildErrors[0]);
    }

    const outputFilePath = path.resolve(
      this.getFunctionsOutputFolder(),
      `${path.basename(fileName, '.ts')}.mjs`,
    );

    return outputFilePath;
  }

  async exec(
    fileName: string,
    name: string,
    parameters: Record<string, unknown>,
  ): Promise<ExecFetchResult<unknown>> {
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

    return this.execFunction(fileName, name, executeParams);
  }

  async execFunction(
    fileName: string,
    name: string,
    parameters: unknown[],
  ): Promise<ExecFetchResult<unknown>> {
    const outputFilePath = await this.getBuiltOutputFilePath(fileName);

    const data = await functionsRuntime.execute(outputFilePath, name, parameters);

    return { data };
  }

  async introspect(): Promise<IntrospectionResult> {
    if (!this.extractedTypes) {
      if (this.project.options.dev) {
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
    const content = await createDefaultFunction(filePath);
    if (await fileExists(filePath)) {
      throw new Error(`"${name}" already exists`);
    }
    await writeFileRecursive(filePath, content, { encoding: 'utf-8' });
    this.extractedTypes = undefined;
  }

  async createDataProviderFile(name: string, options: CreateDataProviderOptions): Promise<void> {
    const filePath = path.resolve(this.getResourcesFolder(), ensureSuffix(name, '.ts'));
    const content = await createDefaultDataProvider(filePath, options);
    if (await fileExists(filePath)) {
      throw new Error(`"${name}" already exists`);
    }
    await writeFileRecursive(filePath, content, { encoding: 'utf-8' });
    this.extractedTypes = undefined;
  }

  async introspectDataProvider(
    fileName: string,
    exportName: string = 'default',
  ): Promise<ToolpadDataProviderIntrospection> {
    const fullPath = await this.getBuiltOutputFilePath(fileName);
    const dataProvider = await functionsRuntime.loadDataProvider(fullPath, exportName);
    return {
      paginationMode: dataProvider.paginationMode,
      hasDeleteRecord: !!dataProvider.deleteRecord,
      hasUpdateRecord: !!dataProvider.updateRecord,
      hasCreateRecord: !!dataProvider.createRecord,
    };
  }

  async getDataProviderRecords<R, P extends PaginationMode>(
    fileName: string,
    exportName: string,
    params: GetRecordsParams<R, P>,
  ): Promise<GetRecordsResult<R, P>> {
    const fullPath = await this.getBuiltOutputFilePath(fileName);
    const dataProvider = await functionsRuntime.loadDataProvider(fullPath, exportName);
    return dataProvider.getRecords(params);
  }

  async deleteDataProviderRecord(
    fileName: string,
    exportName: string,
    id: GridRowId,
  ): Promise<void> {
    const fullPath = await this.getBuiltOutputFilePath(fileName);
    const dataProvider = await functionsRuntime.loadDataProvider(fullPath, exportName);
    invariant(dataProvider.deleteRecord, 'DataProvider does not support deleteRecord');
    return dataProvider.deleteRecord(id);
  }

  async updateDataProviderRecord(
    fileName: string,
    exportName: string,
    id: GridRowId,
    values: Record<string, unknown>,
  ): Promise<void> {
    const fullPath = await this.getBuiltOutputFilePath(fileName);
    const dataProvider = await functionsRuntime.loadDataProvider(fullPath, exportName);
    invariant(dataProvider.updateRecord, 'DataProvider does not support updateRecord');
    return dataProvider.updateRecord(id, values);
  }

  async createDataProviderRecord(
    fileName: string,
    exportName: string,
    values: Record<string, unknown>,
  ): Promise<void> {
    const fullPath = await this.getBuiltOutputFilePath(fileName);
    const dataProvider = await functionsRuntime.loadDataProvider(fullPath, exportName);
    invariant(dataProvider.createRecord, 'DataProvider does not support createRecord');
    return dataProvider.createRecord(values);
  }
}
