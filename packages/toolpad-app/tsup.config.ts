import * as fs from 'fs/promises';
import path from 'path';
import { defineConfig, Options } from 'tsup';

type EsbuildPlugin = NonNullable<Options['esbuildPlugins']>[number];

function cleanFolderOnFailure(folder: string): EsbuildPlugin {
  return {
    name: 'clean-dist-on-failure',
    setup(build) {
      build.onEnd(async (result) => {
        if (result.errors.length > 0) {
          await fs.rm(folder, { recursive: true, force: true });
        }
      });
    },
  };
}

export default defineConfig((options) => [
  {
    entry: {
      index: './cli/index.ts',

      // Worker entry points
      appServerWorker: './src/server/appServerWorker.ts',
      appBuilderWorker: './src/server/appBuilderWorker.ts',
      functionsTypesWorker: './src/server/functionsTypesWorker.ts',
    },
    format: ['esm'],
    outDir: 'dist/cli',
    silent: true,
    // Code splitting in esbuild is buggy. It doesn't preserve order of imports correctly.
    // It's important that `dotenv/config` remains the first import in the program because it
    // needs to set up environment variables before anything else is imported.
    // To fix this, we disable code splitting.
    // See: https://github.com/evanw/esbuild/issues/399
    splitting: false,
    clean: !options.watch,
    sourcemap: true,
    esbuildPlugins: [cleanFolderOnFailure(path.resolve(__dirname, './dist/cli'))],
    async onSuccess() {
      // eslint-disable-next-line no-console
      console.log('cli: build successful');
    },
  },
  {
    entry: ['src/exports/*.ts', 'src/exports/*.tsx'],
    format: ['esm'],
    dts: true,
    silent: true,
    clean: !options.watch,
    outDir: 'dist/exports',
    tsconfig: './tsconfig.runtime.json',
    sourcemap: true,
    esbuildPlugins: [cleanFolderOnFailure(path.resolve(__dirname, 'dist/runtime'))],
    loader: {
      '.svg': 'copy',
      '.png': 'copy',
      '.jpg': 'copy',
      '.jpeg': 'copy',
      '.gif': 'copy',
      '.ico': 'copy',
      '.webp': 'copy',
    },
    async onSuccess() {
      // eslint-disable-next-line no-console
      console.log('runtime: build successful');
    },
  },
]);
