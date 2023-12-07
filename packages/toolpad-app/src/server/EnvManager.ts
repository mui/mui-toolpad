import * as path from 'path';
import * as chokidar from 'chokidar';
import * as dotenv from 'dotenv';
import { Emitter } from '@mui/toolpad-utils/events';
import chalk from 'chalk';
import { truncate } from '@mui/toolpad-utils/strings';
import { ProjectEvents, ToolpadProjectOptions } from '../types';
import { Awaitable } from '../utils/types';

interface IToolpadProject {
  options: ToolpadProjectOptions;
  events: Emitter<ProjectEvents>;
  getRoot(): string;
  invalidateQueries(): void;
}

/**
 * Get file path for the env file.
 */
function getEnvFilePath() {
  return path.resolve(process.cwd(), '.env');
}

/**
 * Handles loading env files and watches for updates.
 */
export default class EnvManager {
  private project: IToolpadProject;

  private originalEnv: Record<string, string | undefined> = { ...process.env };

  private values: Awaitable<Record<string, string>> = {};

  private watcher: chokidar.FSWatcher | undefined;

  constructor(project: IToolpadProject) {
    this.project = project;
  }

  async start() {
    this.loadEnvFile();
    if (this.project.options.dev) {
      this.initWatcher();
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async build() {
    // Dummy method
  }

  async dispose() {
    await this.watcher?.close();
  }

  private resetEnv() {
    Object.keys(process.env).forEach((key) => {
      delete process.env[key];
    });
    Object.assign(process.env, this.originalEnv);
  }

  private loadEnvFile() {
    const envFilePath = getEnvFilePath();
    this.resetEnv();
    const { parsed = {} } = dotenv.config({ path: envFilePath, override: true });
    this.values = parsed;
    // eslint-disable-next-line no-console
    console.log(
      `${chalk.blue('info')}  - loaded env file "${envFilePath}" with keys ${truncate(
        Object.keys(parsed).join(', '),
        1000,
      )}`,
    );
  }

  private initWatcher() {
    if (!this.project.options.dev) {
      return;
    }

    this.watcher = chokidar.watch([getEnvFilePath()], {
      usePolling: true,
      ignoreInitial: true,
    });

    const handleChange = async () => {
      this.loadEnvFile();

      this.project.events.emit('envChanged', {});
      this.project.invalidateQueries();
    };

    this.watcher.on('add', handleChange);
    this.watcher.on('unlink', handleChange);
    this.watcher.on('change', handleChange);
  }

  async getDeclaredValues(): Promise<Record<string, string>> {
    return this.values;
  }

  // eslint-disable-next-line class-methods-use-this
  async getEnv() {
    return process.env;
  }
}
