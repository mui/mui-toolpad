import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { defineConfig } from 'tsup';
import { cleanFolderOnFailure } from '../toolpad-utils/src/tsup';

const execP = promisify(exec);

export default defineConfig([
  {
    entry: {
      index: './cli/index.ts',
      appServer: './cli/appServer.ts',
      appBuilder: './cli/appBuilder.ts',
      functionsDevWorker: './src/server/functionsDevWorker.ts',
      functionsTypesWorker: './src/server/functionsTypesWorker.ts',
    },
    outDir: 'dist/cli',
    silent: true,
    noExternal: [
      'open-editor',
      'execa',
      'fractional-indexing',
      'lodash-es',
      'chalk',
      'get-port',
      'pretty-bytes',
      'latest-version',
      'nanoid',
    ],
    sourcemap: true,
    esbuildPlugins: [cleanFolderOnFailure(path.resolve(__dirname, './dist/cli'))],
    async onSuccess() {
      // eslint-disable-next-line no-console
      console.log('cli: build successful');
    },
  },
  {
    entry: ['./reactDevtools/bootstrap.ts'],
    silent: true,
    outDir: './public/reactDevtools',
    bundle: true,
    sourcemap: true,
    target: 'es6',
    format: 'iife',
    replaceNodeEnv: true,
    esbuildPlugins: [cleanFolderOnFailure(path.resolve(__dirname, './public/reactDevtools'))],
    async onSuccess() {
      // eslint-disable-next-line no-console
      console.log('reactDevtools: build successful');
    },
  },
  {
    entry: ['src/exports/*.ts', 'src/exports/*.tsx'],
    format: ['esm', 'cjs'],
    dts: false,
    silent: true,
    outDir: 'dist/exports',
    tsconfig: './tsconfig.exports.json',
    sourcemap: true,
    esbuildPlugins: [cleanFolderOnFailure(path.resolve(__dirname, 'dist/exports'))],
    async onSuccess() {
      // eslint-disable-next-line no-console
      console.log('exports: build successful, generating types');
      const { stdout } = await execP(
        'tsc --emitDeclarationOnly --declaration -p ./tsconfig.exports.json',
      );
      console.error(stdout);
      // eslint-disable-next-line no-console
      console.log('exports: type generation successful');
    },
  },
]);
