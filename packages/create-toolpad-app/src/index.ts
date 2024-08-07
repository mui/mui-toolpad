#!/usr/bin/env node

import * as fs from 'fs/promises';
import { constants as fsConstants } from 'fs';
import path from 'path';
import yargs from 'yargs';
import { input } from '@inquirer/prompts';
import chalk from 'chalk';
import { errorFrom } from '@toolpad/utils/errors';
import { execa } from 'execa';
import { satisfies } from 'semver';
import { readJsonFile } from '@toolpad/utils/fs';
import invariant from 'invariant';
import { bashResolvePath } from '@toolpad/utils/cli';
import { PackageJson } from './packageType';
import generateProject from './generateProject';
import writeFiles from './writeFiles';
import { downloadAndExtractExample } from './examples';

/**
 * Find package.json of the create-toolpad-app package
 */
async function findCtaPackageJson() {
  const ctaPackageJsonPath = path.resolve(__dirname, '../package.json');
  const content = await fs.readFile(ctaPackageJsonPath, 'utf8');
  const packageJson = JSON.parse(content);
  return packageJson;
}

type PackageManager = 'npm' | 'pnpm' | 'yarn';
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

  const packageJson: PackageJson = {
    name: path.basename(absolutePath),
    version: '0.1.0',
    scripts: {
      dev: 'toolpad-studio dev',
      build: 'toolpad-studio build',
      start: 'toolpad-studio start',
    },
    dependencies: {
      '@toolpad/studio': 'latest',
    },
  };

  const DEFAULT_GENERATED_GITIGNORE_FILE = '.gitignore';
  // eslint-disable-next-line no-console
  console.log(`${chalk.cyan('info')} - Initializing package.json file`);
  await fs.writeFile(path.join(absolutePath, 'package.json'), JSON.stringify(packageJson, null, 2));

  // eslint-disable-next-line no-console
  console.log(`${chalk.cyan('info')} - Initializing .gitignore file`);
  await fs.copyFile(
    path.resolve(__dirname, `./gitignoreTemplate`),
    path.join(absolutePath, DEFAULT_GENERATED_GITIGNORE_FILE),
  );

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

interface ScaffoldProjectOptions {
  coreVersion?: string;
}

const scaffoldCoreProject = async (
  absolutePath: string,
  { coreVersion }: ScaffoldProjectOptions = {},
): Promise<void> => {
  // eslint-disable-next-line no-console
  console.log();
  // eslint-disable-next-line no-console
  console.log(
    `${chalk.cyan('info')} - Creating Toolpad Core project in ${chalk.cyan(absolutePath)}`,
  );
  // eslint-disable-next-line no-console
  console.log();
  const pkg = await findCtaPackageJson();
  const files = generateProject({
    name: path.basename(absolutePath),
    version: coreVersion || pkg.version,
  });
  await writeFiles(absolutePath, files);

  // eslint-disable-next-line no-console
  console.log(`${chalk.cyan('info')} - Installing dependencies`);
  // eslint-disable-next-line no-console
  console.log();

  await execa(packageManager, ['install'], { stdio: 'inherit', cwd: absolutePath });

  // eslint-disable-next-line no-console
  console.log();
  // eslint-disable-next-line no-console
  console.log(
    `${chalk.green('success')} - Created Toolpad Core project at ${chalk.cyan(absolutePath)}`,
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
      describe: 'The path where the Toolpad project directory will be created',
    })
    .option('studio', {
      type: 'boolean',
      describe: 'Create a new project with Toolpad Studio',
      default: false,
    })
    .option('install', {
      type: 'boolean',
      describe: 'Install dependencies',
      default: true,
    })
    .option('core-version', {
      type: 'string',
      describe: 'Use a specific version of Toolpad Core',
    })
    .option('example', {
      type: 'string',
      describe:
        'The name of one of the available examples. See https://github.com/mui/mui-toolpad/tree/master/examples.',
    })
    .help().argv;

  const pathArg = args._?.[0] as string;
  const installFlag = args.install as boolean;
  const studioFlag = args.studio as boolean;

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

    if (installFlag) {
      // eslint-disable-next-line no-console
      console.log(`${chalk.cyan('info')} - Installing dependencies`);
      // eslint-disable-next-line no-console
      console.log();
      await execa(packageManager, ['install'], { stdio: 'inherit', cwd: absolutePath });
      // eslint-disable-next-line no-console
      console.log();
      // eslint-disable-next-line no-console
      console.log(
        `${chalk.green('success')} - Installed "${args.example}" at ${chalk.cyan(absolutePath)}`,
      );
      // eslint-disable-next-line no-console
      console.log();
    }
  }
  // If the studio flag is set, create a new project with Toolpad Studio
  else if (studioFlag) {
    await scaffoldStudioProject(absolutePath, installFlag);
  } else {
    // Otherwise, create a new project with Toolpad Core
    await scaffoldCoreProject(absolutePath, {
      coreVersion: args.coreVersion,
    });
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
