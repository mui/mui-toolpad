import { PackageJson } from '../packageType';

export default (appName: string): PackageJson => ({
  name: appName,
  version: '0.1.0',
  scripts: {
    dev: 'next dev',
    build: 'next build',
    start: 'next start',
    lint: 'next lint',
  },
  dependencies: {
    '@emotion/react': '^11.11.4',
    '@emotion/styled': '^11.11.5',
    '@mui/icons-material': '6.0.0-beta.2',
    '@mui/lab': '6.0.0-beta.2',
    '@mui/material': '6.0.0-beta.2',
    '@mui/material-nextjs': 'next',
    '@toolpad/core': 'latest',
    next: '14.2.4',
    'next-auth': '5.0.0-beta.18',
    react: '18.3.1',
    'react-dom': '18.3.1',
  },
  devDependencies: {
    '@types/node': '^20.14.10',
    '@types/react': '^18.3.3',
    '@types/react-dom': '^18.3.0',
    'eslint-config-next': '14.2.4',
  },
});
