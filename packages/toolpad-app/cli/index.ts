import 'dotenv/config';
import arg from 'arg';
import path from 'path';
import invariant from 'invariant';
import { Readable } from 'stream';
import * as readline from 'readline';
import openBrowser from 'react-dev-utils/openBrowser';

const DEFAULT_PORT = 3000;

async function waitForMatch(input: Readable, regex: RegExp): Promise<RegExpExecArray | null> {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input });

    rl.on('line', (line) => {
      const match = regex.exec(line);
      if (match) {
        rl.close();
        input.resume();
        resolve(match);
      }
    });
    rl.on('error', (err) => reject(err));
    rl.on('end', () => resolve(null));
  });
}

function* getPreferredPorts(port: number = DEFAULT_PORT): Iterable<number> {
  while (true) {
    yield port;
    port += 1;
  }
}

interface RunCommandArgs {
  // Whether Toolpad editor is running in debug mode
  devMode?: boolean;
  port?: number;
  dir?: string;
}

async function runApp(
  cmd: 'dev' | 'start',
  { devMode = false, port, dir = process.cwd() }: RunCommandArgs,
) {
  const { execaNode } = await import('execa');
  const { default: chalk } = await import('chalk');
  const { default: getPort } = await import('get-port');
  const toolpadDir = path.resolve(__dirname, '../..'); // from ./dist/server

  if (!port) {
    port = cmd === 'dev' ? await getPort({ port: getPreferredPorts(DEFAULT_PORT) }) : DEFAULT_PORT;
  } else {
    // if port is specified but is not available, exit
    const availablePort = await getPort({ port });
    if (availablePort !== port) {
      console.error(`${chalk.red('error')} - Port ${port} is not available. Aborted.`);
      process.exit(1);
    }
  }

  const serverPath = path.resolve(__dirname, './server.js');

  const cp = execaNode(serverPath, [], {
    cwd: dir,
    stdio: 'pipe',
    env: {
      NODE_ENV: devMode ? 'development' : 'production',
      TOOLPAD_DIR: toolpadDir,
      TOOLPAD_PROJECT_DIR: dir,
      TOOLPAD_PORT: String(port),
      TOOLPAD_CMD: cmd,
      FORCE_COLOR: '1',
    },
  });

  invariant(cp.stdout, 'child process must be started with "stdio: \'pipe\'"');

  process.stdin.pipe(cp.stdin!);
  cp.stdout?.pipe(process.stdout);
  cp.stderr?.pipe(process.stderr);

  if (cmd === 'dev') {
    // Poll stdout for "http://localhost:3000" first
    const match = await waitForMatch(cp.stdout, /http:\/\/localhost:(\d+)/);
    const detectedPort = match ? Number(match[1]) : null;
    invariant(detectedPort, 'Could not find port in stdout');
    const toolpadBaseUrl = `http://localhost:${detectedPort}/`;
    try {
      openBrowser(toolpadBaseUrl);
    } catch (err: any) {
      console.error(`${chalk.red('error')} - Failed to open browser: ${err.message}`);
    }
  }

  cp.on('exit', (code) => {
    if (code) {
      process.exit(code);
    }
  });
}

async function devCommand(args: RunCommandArgs) {
  const { default: chalk } = await import('chalk');

  // eslint-disable-next-line no-console
  console.log(`${chalk.blue('info')}  - starting Toolpad application in dev mode...`);
  await runApp('dev', args);
}

async function buildCommand() {
  const { default: chalk } = await import('chalk');
  // eslint-disable-next-line no-console
  console.log(`${chalk.blue('info')}  - building Toolpad application...`);
  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });
  // eslint-disable-next-line no-console
  console.log(`${chalk.green('success')} - build done.`);
}

async function startCommand(args: RunCommandArgs) {
  const { default: chalk } = await import('chalk');
  // eslint-disable-next-line no-console
  console.log(`${chalk.blue('info')}  - Starting Toolpad application...`);
  await runApp('start', args);
}

export default async function cli(argv: string[]) {
  const args = arg(
    {
      // Types
      '--help': Boolean,
      '--dev': Boolean,
      '--port': Number,

      // Aliases
      '-p': '--port',
    },
    {
      argv,
    },
  );

  const command: string | undefined = args._[0];
  const dir: string = path.resolve(process.cwd(), args._[1] || '.');

  const runArgs = {
    devMode: args['--dev'],
    port: args['--port'],
    dir,
  };

  switch (command) {
    case undefined:
    case 'dev':
      await devCommand(runArgs);
      break;
    case 'build':
      await buildCommand();
      break;
    case 'start':
      await startCommand(runArgs);
      break;
    default:
      throw new Error(`Unknown command "${command}"`);
  }
}
