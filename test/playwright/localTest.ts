import * as path from 'path';
import * as fs from 'fs/promises';
import childProcess from 'child_process';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { once } from 'events';
import invariant from 'invariant';
import archiver from 'archiver';
import * as url from 'url';
import getPort from 'get-port';
import * as execa from 'execa';
import { PageScreenshotOptions, WorkerInfo, test as baseTest } from './test';
import { waitForMatch } from '../utils/streams';
import { asyncDisposeSymbol, using } from '../utils/resources';

const currentDirectory = url.fileURLToPath(new URL('.', import.meta.url));

const CLI_CMD = path.resolve(currentDirectory, '../../packages/toolpad-studio/cli.mjs');

const PROJECT_ROOT = path.resolve(currentDirectory, '../../');

// https://github.com/mui/material-ui/blob/bc35128302b5bd61fa35f89d371aeed91e6a5748/scripts/pushArgos.mjs#L7
const ARGOS_OUTPUT_FOLDER = 'test/regressions/screenshots/chrome';

export interface RunningLocalApp {
  url: string;
  dir: string;
  stdout: Readable;
}

// You'll need to have `pnpm dev` running for this
const VERBOSE = true;

interface SetupContext {
  dir: string;
}

interface ProjectConfig {
  // Template to be used as the starting point of the project folder Toolpad Studio is running in
  // This will copied to the temporary folder
  template?: string;
  setup?: (ctx: SetupContext) => Promise<void>;
}

interface LocalAppConfig {
  // Command to start Toolpad Studio with
  cmd?: 'start' | 'dev';
  // Run Toolpad Studio editor app in local dev mode
  toolpadDev?: boolean;
  // Extra environment variables when running Toolpad
  env?: Record<string, string>;
  base?: string;
}

interface LocalServerConfig {
  dev?: boolean;
  env?: Record<string, string>;
  base?: string;
}
export async function getTemporaryDir() {
  const tmpDir = await fs.mkdtemp(path.resolve(currentDirectory, './tmp-'));

  return {
    path: tmpDir,
    [asyncDisposeSymbol]: async () => {
      await fs.rm(tmpDir, { recursive: true, maxRetries: 3, retryDelay: 1000 });
    },
  };
}

async function getTestFixtureTempDir(
  workerInfo: WorkerInfo,
  { template, setup }: ProjectConfig = {},
) {
  const tmpTestDir = path.resolve(currentDirectory, `./.tmp-test-dir-${workerInfo.parallelIndex}`);
  await fs.mkdir(tmpTestDir);
  // Each test runs in its own temporary folder to avoid race conditions when running tests in parallel.
  // It also avoids mutating the source code of the fixture while running the test.
  const projectDir = path.resolve(tmpTestDir, './fixture');
  await fs.mkdir(projectDir, { recursive: true });

  if (template) {
    await fs.cp(template, projectDir, { recursive: true });
  }

  if (setup) {
    await setup({ dir: projectDir });
  }

  return {
    path: projectDir,
    [asyncDisposeSymbol]: async () => {
      await fs.rm(tmpTestDir, { recursive: true, maxRetries: 3, retryDelay: 1000 });
    },
  };
}

interface BuildAppOptions {
  base?: string;
  env?: Record<string, string>;
}

async function buildApp(projectDir: string, { base, env = {} }: BuildAppOptions = {}) {
  const buildArgs = [CLI_CMD, 'build'];

  if (base) {
    buildArgs.push('--base', base);
  }

  const child = childProcess.spawn('node', buildArgs, {
    cwd: projectDir,
    stdio: 'pipe',
    shell: !process.env.CI,
    env: {
      ...process.env,
      ...env,
    },
  });

  if (VERBOSE) {
    child.stdout?.pipe(process.stdout);
    child.stderr?.pipe(process.stderr);
  }

  await once(child, 'exit');

  if (child.exitCode !== 0) {
    throw new Error('Build failed');
  }
}

export async function runCustomServer(
  projectDir: string,
  { dev = false, base = '/foo', env = {} }: LocalServerConfig,
) {
  const origEnv = { ...process.env };
  Object.assign(process.env, env);

  if (!dev) {
    await buildApp(projectDir, { base, env });
  }

  const port = await getPort();

  const child = execa.execaNode(path.resolve(projectDir, './server.mjs'), {
    cwd: projectDir,
    env: {
      NODE_ENV: dev ? 'development' : 'production',
      PORT: String(port),
      BASE: base,
    },
  });

  invariant(child.stdout && child.stderr, "Childprocess must be started with stdio: 'pipe'");
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  await waitForMatch(child.stdout, /Custom server listening/);

  return {
    url: `http://localhost:${port}${base}`,
    dir: projectDir,
    stdout: process.stdout,
    [asyncDisposeSymbol]: async () => {
      process.env = origEnv;
      await child.kill();
    },
  };
}

export async function runApp(projectDir: string, options: LocalAppConfig) {
  const { cmd = 'start', env, base } = options;

  if (cmd === 'start') {
    await buildApp(projectDir, { base, env });
  }

  const args: string[] = [CLI_CMD, cmd];
  if (options.toolpadDev) {
    args.push('--dev');
  }

  // Run each test on its own port to avoid race conditions when running tests in parallel.
  args.push('--port', String(await getPort()));

  if (base) {
    args.push('--base', base);
  }

  const child = childProcess.spawn('node', args, {
    cwd: projectDir,
    stdio: 'pipe',
    shell: !process.env.CI,
    env: {
      ...process.env,
      ...env,
    },
  });

  const port = await Promise.race([
    once(child, 'exit').then(([code]) => {
      throw new Error(`App process exited unexpectedly${code ? ` with code ${code}` : ''}`);
    }),
    (async () => {
      invariant(child.stdout, "Childprocess must be started with stdio: 'pipe'");

      if (VERBOSE) {
        child.stdout?.pipe(process.stdout);
        child.stderr?.pipe(process.stderr);
      }

      const match = await waitForMatch(child.stdout, /localhost:(\d+)/);

      if (!match) {
        throw new Error('Failed to start');
      }

      const detectedPort = Number(match[1]);

      return detectedPort;
    })(),
  ]);

  return {
    url: `http://localhost:${port}`,
    dir: projectDir,
    stdout: child.stdout,

    [asyncDisposeSymbol]: () => {
      child.kill();
    },
  };
}

export interface EditorConfig {
  cwd: string;
  appUrl: string;
  toolpadDev?: boolean;
  env?: Record<string, string>;
}

export async function runEditor(options: EditorConfig) {
  const { appUrl, cwd, env } = options;

  const args: string[] = [CLI_CMD, 'editor', appUrl];

  if (options.toolpadDev) {
    args.push('--dev');
  }

  // Run each test on its own port to avoid race conditions when running tests in parallel.
  args.push('--port', String(await getPort()));

  const child = childProcess.spawn('node', args, {
    cwd,
    stdio: 'pipe',
    shell: !process.env.CI,
    env: {
      ...process.env,
      ...env,
    },
  });

  const port = await Promise.race([
    once(child, 'exit').then(([code]) => {
      throw new Error(`App process exited unexpectedly${code ? ` with code ${code}` : ''}`);
    }),
    (async () => {
      invariant(child.stdout, "Childprocess must be started with stdio: 'pipe'");

      if (VERBOSE) {
        child.stdout?.pipe(process.stdout);
        child.stderr?.pipe(process.stderr);
      }

      const match = await waitForMatch(child.stdout, /localhost:(\d+)/);

      if (!match) {
        throw new Error('Failed to start');
      }

      const detectedPort = Number(match[1]);

      return detectedPort;
    })(),
  ]);

  return {
    url: `http://localhost:${port}`,
    stdout: child.stdout,

    [asyncDisposeSymbol]: () => {
      child.kill();
    },
  };
}

const test = baseTest.extend<
  {
    projectSnapshot: null;
    // Take a screenshot of the app to be used in argos-ci
    argosScreenshot: (
      name: string,
      options?: Omit<PageScreenshotOptions, 'path' | 'type'>,
    ) => Promise<void>;
  },
  {
    browserCloser: null;
    localApp?: RunningLocalApp;
    projectDir: { path: string };
    toolpadDev: boolean;
    customServer?: RunningLocalApp;
    localAppConfig?: LocalAppConfig;
    customServerConfig?: LocalServerConfig;
    projectConfig?: ProjectConfig;
  }
>({
  toolpadDev: [!!process.env.TOOLPAD_NEXT_DEV, { option: true, scope: 'worker' }],
  localAppConfig: [undefined, { option: true, scope: 'worker' }],
  customServerConfig: [undefined, { option: true, scope: 'worker' }],
  projectConfig: [undefined, { option: true, scope: 'worker' }],
  projectDir: [
    async ({ projectConfig }, use, workerInfo) => {
      await using(await getTestFixtureTempDir(workerInfo, projectConfig), async (projectDir) => {
        await use(projectDir);
      });
    },
    { scope: 'worker', timeout: 120000 },
  ],
  customServer: [
    async ({ projectDir, customServerConfig }, use) => {
      if (customServerConfig) {
        await using(await runCustomServer(projectDir.path, customServerConfig), async (app) => {
          await use(app);
        });
      } else {
        await use(undefined);
      }
    },
    { scope: 'worker', timeout: 60000 },
  ],
  localApp: [
    async ({ projectDir, localAppConfig, toolpadDev }, use) => {
      if (localAppConfig) {
        await using(
          await runApp(projectDir.path, { toolpadDev, ...localAppConfig }),
          async (app) => {
            await use(app);
          },
        );
      } else {
        await use(undefined);
      }
    },
    { scope: 'worker', timeout: 60000 },
  ],
  baseURL: async ({ localApp }, use) => {
    await use(localApp?.url);
  },
  browserCloser: [
    async ({ browser }, use) => {
      // For some reason the browser doesn't close automatically when running a child process
      await use(null);
      await browser.close();
    },
    {
      scope: 'worker',
      auto: true,
    },
  ],
  projectSnapshot: [
    async ({ projectDir }, use, testInfo) => {
      await use(null);

      if (testInfo.status !== 'passed' && testInfo.status !== 'skipped') {
        await fs.mkdir(testInfo.outputDir, { recursive: true });
        const output = createWriteStream(path.resolve(testInfo.outputDir, './projectSnapshot.zip'));
        const archive = archiver.create('zip');
        archive.directory(projectDir.path, '/project');
        archive.finalize();

        await pipeline(archive, output);
      }
    },
    { scope: 'test', auto: true },
  ],
  argosScreenshot: [
    async ({ page }, use, testInfo) => {
      await use(async (name, options) => {
        const snapshotPath = testInfo.snapshotPath(`${name}.png`);
        const relative = path.relative(testInfo.project.testDir, snapshotPath);

        invariant(
          !relative.startsWith('..'),
          "Can't store a screenshot outside of the argos directory",
        );

        const screenshotPath = path.resolve(PROJECT_ROOT, ARGOS_OUTPUT_FOLDER, relative);
        await page.screenshot({
          path: screenshotPath,
          animations: 'disabled',
          ...options,
        });
      });
    },
    { scope: 'test', auto: true },
  ],
});

// eslint-disable-next-line import/export
export * from './test';
// eslint-disable-next-line import/export
export { test };
