const path = require('path');

module.exports = {
  context: path.resolve(__dirname),
  resolve: {
    modules: [__dirname, 'node_modules'],
    alias: {
      '@toolpad/studio-components': path.resolve(
        __dirname,
        './packages/toolpad-studio-components/src',
      ),
      '@toolpad/studio-runtime': path.resolve(__dirname, './packages/toolpad-studio-runtime/src'),
      '@toolpad/utils': path.resolve(__dirname, './packages/toolpad-utils/src'),
      docs: path.resolve(__dirname, './node_modules/@mui/monorepo/docs'),
    },
    extensions: ['.js', '.ts', '.tsx', '.d.ts'],
  },
};
