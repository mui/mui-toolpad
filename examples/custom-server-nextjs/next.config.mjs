/** @type {import('next').NextConfig} */
export default {
  webpack: (config) => {
    config.externals.push({
      fsevents: 'commonjs fsevents',
      chokidar: 'commonjs chokidar',
    });
    config.resolve.alias['@mui/icons-material'] = ['@mui/icons-material/esm'];
    return config;
  },
  basePath: '/my-next-app',
};
