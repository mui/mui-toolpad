import { Emitter } from '@mui/toolpad-utils/events';
import * as esbuild from 'esbuild';
import * as path from 'path';
import invariant from 'invariant';
import { indent } from '@mui/toolpad-utils/strings';
import * as chokidar from 'chokidar';
import chalk from 'chalk';
import { glob } from 'glob';
import * as fs from 'fs/promises';
import EnvManager from './EnvManager';
import { ProjectEvents, ToolpadProjectOptions } from '../types';
import { writeFileRecursive, fileExists } from '../utils/fs';
import { createWorker } from './functionsDevWorker';

const DEFAULT_FUNCTIONS_FILE_CONTENT = `// Toolpad queries:

export async function example() {
  return [
    { firstname: 'Nell', lastName: 'Lester' },
    { firstname: 'Keanu', lastName: 'Walter' },
    { firstname: 'Daniella', lastName: 'Sweeney' },
  ];
}
`;

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

interface IToolpadProject {
  options: ToolpadProjectOptions;
  events: Emitter<ProjectEvents>;
  getRoot(): string;
  getToolpadFolder(): string;
  getOutputFolder(): string;
  openCodeEditor(path: string): Promise<void>;
  envManager: EnvManager;
}

export default class FunctionsManager {
  private project: IToolpadProject;

  private controller: AbortController | undefined;

  private buildMetafile: esbuild.Metafile | undefined;

  private buildErrors: Error[] = [];

  private env: Record<string, string> | undefined;

  private unsubscribeFromEnv: (() => void) | undefined;

  private devWorker: ReturnType<typeof createWorker>;

  private initPromise: Promise<void>;

  // eslint-disable-next-line class-methods-use-this
  private setInitialized: () => void = () => {
    throw new Error('setInitialized should be initialized');
  };

  constructor(project: IToolpadProject) {
    this.project = project;
    this.initPromise = new Promise((resolve) => {
      this.setInitialized = resolve;
    });
    const relativeResourcesFolder = path.relative(
      this.project.getRoot(),
      this.getResourcesFolder(),
    );
    this.devWorker = createWorker(relativeResourcesFolder, {});
    this.startDev();
  }

  getResourcesFolder(): string {
    return path.join(this.project.getToolpadFolder(), './resources');
  }

  getFunctionsFile() {
    return path.join(this.getResourcesFolder(), './functions.ts');
  }

  getFunctionResourcesPattern(): string {
    return path.join(this.getResourcesFolder(), 'functions.ts');
  }

  private async migrateLegacy() {
    const legacyQueriesFile = path.resolve(this.project.getToolpadFolder(), 'queries.ts');
    if (await fileExists(legacyQueriesFile)) {
      const functionsFile = this.getFunctionsFile();
      await fs.mkdir(path.dirname(functionsFile), { recursive: true });
      await fs.rename(legacyQueriesFile, functionsFile);
    }
  }

  getOutputFile(): string | undefined {
    if (this.buildErrors.length <= 0) {
      invariant(this.buildMetafile, 'esbuild settings should enable metafile');
      const mainEntry = Object.entries(this.buildMetafile.outputs).find(
        ([, entry]) => entry.entryPoint === 'toolpad:main.ts',
      );
      invariant(mainEntry, 'No output found for main entry point');
      return mainEntry[0];
    }
    return undefined;
  }

  async getFunctionFiles(): Promise<string[]> {
    const paths = await glob(this.getFunctionResourcesPattern());
    return paths.map((fullPath) => path.relative(this.project.getRoot(), fullPath));
  }

  getOutputFileForEntryPoint(entryPoint: string): string | undefined {
    const [outputFile] =
      Object.entries(this.buildMetafile?.outputs ?? {}).find(
        (entry) => entry[1].entryPoint === entryPoint,
      ) ?? [];

    return outputFile;
  }

  async createBuilder() {
    const root = this.project.getRoot();

    const entryPoints = await this.getFunctionFiles();

    const onFunctionsBuildEnd = async (args: esbuild.BuildResult<esbuild.BuildOptions>) => {
      // TODO: use for hot reloading
      // eslint-disable-next-line no-console
      console.log(
        `${chalk.green('ready')} - built functions.ts: ${args.errors.length} error(s), ${
          args.warnings.length
        } warning(s)`,
      );

      this.buildErrors = args.errors.map((message) => {
        let messageText = message.text;
        if (message.location) {
          const formattedLocation = indent(formatCodeFrame(message.location), 2);
          messageText = [messageText, formattedLocation].join('\n');
        }
        return new Error(messageText);
      });

      this.buildMetafile = args.metafile;

      this.project.events.emit('functionsBuildEnd', {});

      this.setInitialized();
    };

    const toolpadPlugin: esbuild.Plugin = {
      name: 'toolpad',
      setup(build) {
        build.onEnd((args) => {
          onFunctionsBuildEnd(args);
        });
      },
    };

    const ctx = await esbuild.context({
      absWorkingDir: root,
      entryPoints,
      plugins: [toolpadPlugin],
      write: true,
      bundle: true,
      metafile: true,
      outdir: path.resolve(this.project.getOutputFolder(), 'functions'),
      platform: 'node',
      packages: 'external',
      target: 'es2022',
    });

    let resourcesWatcher: chokidar.FSWatcher | undefined;

    const unsubscribers: (() => void)[] = [];

    const dispose = async () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      await Promise.all([ctx.dispose(), this.controller?.abort(), this.unsubscribeFromEnv?.()]);
    };

    const watch = () => {
      ctx.watch({});

      // Make sure we pick up added/removed function files
      (async () => {
        if (resourcesWatcher) {
          await resourcesWatcher.close();
        }

        const calculateFingerPrint = async () => {
          const functionFiles = await this.getFunctionFiles();
          return functionFiles.join('|');
        };

        let fingerprint = await calculateFingerPrint();

        resourcesWatcher = chokidar.watch([this.getFunctionResourcesPattern()]);
        resourcesWatcher.on('all', async () => {
          const newFingerprint = await calculateFingerPrint();
          if (fingerprint !== newFingerprint) {
            fingerprint = newFingerprint;
            ctx.rebuild();
          }
        });
      })();
    };

    return {
      watch,
      dispose,
    };
  }

  async startDev() {
    await this.migrateLegacy();
    this.env = await this.project.envManager.getValues();

    const relativeResourcesFolder = path.relative(
      this.project.getRoot(),
      this.getResourcesFolder(),
    );
    this.devWorker = createWorker(relativeResourcesFolder, this.env);

    const builder = await this.createBuilder();
    await builder.watch();

    this.unsubscribeFromEnv = this.project.events.subscribe('envChanged', async () => {
      this.env = await this.project.envManager.getValues();
      this.devWorker = createWorker(relativeResourcesFolder, this.env);
    });

    return builder;
  }

  async exec(fileName: string, name: string, parameters: Record<string, unknown>) {
    await this.initPromise;
    const resourcesFolder = this.getResourcesFolder();
    const fullPath = path.resolve(resourcesFolder, fileName);
    const entryPoint = path.relative(this.project.getRoot(), fullPath);
    const outputFilePath = this.getOutputFileForEntryPoint(entryPoint);
    if (!outputFilePath) {
      throw new Error(`No build found for "${fileName}"`);
    }
    return this.devWorker.execute(outputFilePath, name, parameters);
  }

  async introspect() {
    await this.initPromise;
    const functionFiles = await this.getFunctionFiles();
    const outputFiles = new Map(
      functionFiles.flatMap((functionFile) => {
        const file = this.getOutputFileForEntryPoint(functionFile);
        return file ? [[functionFile, { file }]] : [];
      }),
    );
    return this.devWorker.introspect(outputFiles);
  }

  async initQueriesFile(): Promise<void> {
    const queriesFilePath = this.getFunctionsFile();
    if (!(await fileExists(queriesFilePath))) {
      // eslint-disable-next-line no-console
      console.log(`${chalk.blue('info')}  - Initializing Toolpad functions file`);
      await writeFileRecursive(queriesFilePath, DEFAULT_FUNCTIONS_FILE_CONTENT, {
        encoding: 'utf-8',
      });
    }
  }

  async openQueryEditor() {
    await this.initQueriesFile();
    const queriesFilePath = this.getFunctionsFile();
    await this.project.openCodeEditor(queriesFilePath);
  }
}
