import { spawnSync } from 'child_process';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/*.ts', 'src/*.tsx', 'src/hooks/*.ts', 'src/hooks/*.tsx'],
  format: ['esm', 'cjs'],
  dts: false,
  silent: true,
  clean: true,
  async onSuccess() {
    // eslint-disable-next-line no-console
    console.log('build successful');
    spawnSync('tsc', ['--emitDeclarationOnly', '--declaration']);
  },
});
