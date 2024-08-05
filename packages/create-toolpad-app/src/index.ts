#!/usr/bin/env node

import * as fs from 'fs/promises';
import { constants as fsConstants } from 'fs';
import path from 'path';
import yargs from 'yargs';
import { input, confirm, select, checkbox } from '@inquirer/prompts';
import chalk from 'chalk';
import { errorFrom } from '@toolpad/utils/errors';
import { execa } from 'execa';
import { satisfies } from 'semver';
import { readJsonFile } from '@toolpad/utils/fs';
import invariant from 'invariant';
import { bashResolvePath } from '@toolpad/utils/cli';
import generateProject, { GenerateProjectOptions } from './generateProject';
import generateStudioProject from './generateStudioProject';
import writeFiles from './writeFiles';
import { downloadAndExtractExample } from './examples';
import type { PackageJson } from './templates/packageType';
import type { SupportedRouter, SupportedAuthProvider, PackageManager } from './types';

declare global {
  interface Error {
    code?: unknown;
  }
}

function getPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent;

  if (userAgent) {
    if (userAgent.startsWith('yarn')) {
      return 'yarn';
    }
    if (userAgent.startsWith('pnpm')) {
      return 'pnpm';
    }
    if (userAgent.startsWith('npm')) {
      return 'npm';
    }
  }
  return 'npm';
}

// From https://github.com/vercel/next.js/blob/canary/packages/create-next-app/helpers/is-folder-empty.ts

async function isFolderEmpty(pathDir: string): Promise<boolean> {
  const validFiles = [
    '.DS_Store',
    '.git',
    '.gitattributes',
    '.gitignore',
    '.gitlab-ci.yml',
    '.hg',
    '.hgcheck',
    '.hgignore',
    '.idea',
    '.npmignore',
    '.travis.yml',
    'LICENSE',
    'Thumbs.db',
    'docs',
    'mkdocs.yml',
    'npm-debug.log',
    'yarn-debug.log',
    'yarn-error.log',
    'yarnrc.yml',
    '.yarn',
  ];

  const conflicts = await fs.readdir(pathDir);

  conflicts
    .filter((file) => !validFiles.includes(file))
    // Support IntelliJ IDEA-based editors
    .filter((file) => !/\.iml$/.test(file));

  if (conflicts.length > 0) {
    return false;
  }
  return true;
}

// Detect the package manager
const packageManager = getPackageManager();

const validatePath = async (relativePath: string): Promise<boolean | string> => {
  const absolutePath = bashResolvePath(relativePath);

  try {
    await fs.access(absolutePath, fsConstants.F_OK);

    // Directory exists, verify if it's empty to proceed
    if (await isFolderEmpty(absolutePath)) {
      return true;
    }
    return `${chalk.red('error')} - The directory at ${chalk.cyan(
      absolutePath,
    )} contains files that could conflict. Either use a new directory, or remove conflicting files.`;
  } catch (rawError: unknown) {
    // Directory does not exist, create it
    const error = errorFrom(rawError);
    if (error.code === 'ENOENT') {
      await fs.mkdir(absolutePath, { recursive: true });
      return true;
    }
    // Unexpected error, let it bubble up and crash the process
    throw error;
  }
};

// Create a new `package.json` file and install dependencies
const scaffoldStudioProject = async (absolutePath: string, installFlag: boolean): Promise<void> => {
  // eslint-disable-next-line no-console
  console.log();
  // eslint-disable-next-line no-console
  console.log(
    `${chalk.cyan('info')} - Creating Toolpad Studio project in ${chalk.cyan(absolutePath)}`,
  );
  // eslint-disable-next-line no-console
  console.log();

  const files = generateStudioProject(packageManager, path.basename(absolutePath));
  await writeFiles(absolutePath, files);

  if (installFlag) {
    // eslint-disable-next-line no-console
    console.log(`${chalk.cyan('info')} - Installing dependencies`);
    // eslint-disable-next-line no-console
    console.log();

    await execa(packageManager, ['install'], { stdio: 'inherit', cwd: absolutePath });

    // eslint-disable-next-line no-console
    console.log();
    // eslint-disable-next-line no-console
    console.log(`${chalk.green('success')} - Dependencies installed successfully!`);
    // eslint-disable-next-line no-console
    console.log();
  }
};

const scaffoldCoreProject = async (options: GenerateProjectOptions): Promise<void> => {
  // eslint-disable-next-line no-console
  console.log();
  // eslint-disable-next-line no-console
  console.log(
    `${chalk.cyan('info')} - Creating Toolpad Core project in ${chalk.cyan(options.absolutePath)}`,
  );
  // eslint-disable-next-line no-console
  console.log();
  const files = generateProject(options);
  await writeFiles(options.absolutePath, files);

  // eslint-disable-next-line no-console
  console.log(`${chalk.cyan('info')} - Installing dependencies`);
  // eslint-disable-next-line no-console
  console.log();

  await execa(packageManager, ['install'], { stdio: 'inherit', cwd: options.absolutePath });

  // eslint-disable-next-line no-console
  console.log();
  // eslint-disable-next-line no-console
  console.log(
    `${chalk.green('success')} - Created Toolpad Core project at ${chalk.cyan(options.absolutePath)}`,
  );
  // eslint-disable-next-line no-console
  console.log();
};

// Run the CLI interaction with Inquirer.js
const run = async () => {
  const pkgJson: PackageJson = (await readJsonFile(
    path.resolve(__dirname, `../package.json`),
  )) as any;

  invariant(pkgJson.engines?.node, 'Missing node version in package.json');

  // check the node version before create
  if (!satisfies(process.version, pkgJson.engines.node)) {
    // eslint-disable-next-line no-console
    console.log(
      `${chalk.red('error')} - Your node version ${
        process.version
      } is unsupported. Please upgrade it to at least ${pkgJson.engines.node}`,
    );
    process.exit(1);
  }

  const args = await yargs(process.argv.slice(2))
    .scriptName('create-toolpad-app')
    .usage('$0 [path] [options]')
    .positional('path', {
      type: 'string',
      describe: 'The path where the Toolpad Studio project directory will be created',
    })
    .option('core', {
      type: 'boolean',
      describe: 'Create a new project with Toolpad Core',
      default: false,
    })
    .option('install', {
      type: 'boolean',
      describe: 'Install dependencies',
      default: true,
    })
    .option('example', {
      type: 'string',
      describe:
        'The name of one of the available examples. See https://github.com/mui/mui-toolpad/tree/master/examples.',
    })
    .help().argv;

  const pathArg = args._?.[0] as string;
  const installFlag = args.install as boolean;
  const coreFlag = args.core as boolean;

  if (pathArg) {
    const pathValidOrError = await validatePath(pathArg);
    if (typeof pathValidOrError === 'string') {
      // eslint-disable-next-line no-console
      console.log();
      // eslint-disable-next-line no-console
      console.log(pathValidOrError);
      // eslint-disable-next-line no-console
      console.log();
      process.exit(1);
    }
  }
  let projectPath = pathArg;

  if (!pathArg) {
    projectPath = await input({
      message: 'Enter path for new project directory:',
      validate: validatePath,
      default: '.',
    });
  }

  const absolutePath = bashResolvePath(projectPath);

  // If the user has provided an example, download and extract it
  if (args.example) {
    await downloadAndExtractExample(absolutePath, args.example);
  }
  // If the core flag is set, create a new project with Toolpad Core
  else if (coreFlag) {
    const routerOption: SupportedRouter = await select({
      message: 'Which router would you like to use?',
      default: 'nextjs-app',
      choices: [
        { name: 'Next.js App Router', value: 'nextjs-app' },
        { name: 'Next.js Pages Router', value: 'nextjs-pages' },
      ],
    });
    const authFlag = await confirm({
      message: 'Would you like to enable authentication?',
      default: true,
    });
    let authProviderOptions: SupportedAuthProvider[] = [];
    if (authFlag) {
      authProviderOptions = await checkbox({
        message: 'Select authentication providers to enable:',
        required: true,
        choices: [
          { name: 'Username/Password', value: 'Credentials' },
          { name: 'Google', value: 'Google' },
          { name: 'GitHub', value: 'GitHub' },
        ],
      });
    }
    const options = {
      name: path.basename(absolutePath),
      absolutePath,
      router: routerOption,
      auth: authFlag,
      authProviders: authProviderOptions,
    };
    await scaffoldCoreProject(options);
  } else {
    // Otherwise, create a new project with Toolpad Studio
    await scaffoldStudioProject(absolutePath, installFlag);
  }

  const changeDirectoryInstruction =
    /* `path.relative` is truth-y if the relative path
     * between `absolutePath` and `process.cwd()`
     * is not empty
     */
    path.relative(process.cwd(), absolutePath)
      ? `  cd ${path.relative(process.cwd(), absolutePath)}\n`
      : '';

  const installInstruction = installFlag ? '' : `  ${packageManager} install\n`;

  const message = `Run the following to get started: \n\n${chalk.magentaBright(
    `${changeDirectoryInstruction}${installInstruction}  ${packageManager}${
      packageManager === 'yarn' ? '' : ' run'
    } dev`,
  )}`;
  // eslint-disable-next-line no-console
  console.log(message);
  // eslint-disable-next-line no-console
  console.log();
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
