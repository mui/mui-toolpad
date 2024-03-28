// @ts-check
import * as path from 'path';
import * as url from 'url';
import { createRequire } from 'module';

const currentDirectory = url.fileURLToPath(new URL('.', import.meta.url));

const require = createRequire(import.meta.url);

const withDocsInfra = require('@mui/monorepo/docs/nextConfigDocsInfra');

const pkg = require('../package.json');
const { findPages } = require('./src/modules/utils/find');

const WORKSPACE_ROOT = path.resolve(currentDirectory, '../');
const MONOREPO_PATH = path.resolve(currentDirectory, '../node_modules/@mui/monorepo');

export default withDocsInfra({
  experimental: {
    workerThreads: true,
    cpus: 3,
  },
  transpilePackages: ['@mui/monorepo', '@mui/x-charts'],
  // Avoid conflicts with the other Next.js apps hosted under https://mui.com/
  assetPrefix: process.env.DEPLOY_ENV === 'development' ? undefined : '/toolpad',
  env: {
    // docs-infra
    LIB_VERSION: pkg.version,
    SOURCE_CODE_REPO: 'https://github.com/mui/mui-toolpad',
    SOURCE_GITHUB_BRANCH: 'master', // #default-branch-switch
    GITHUB_TEMPLATE_DOCS_FEEDBACK: '4.docs-feedback.yml',
    // Toolpad related
    // …
  },
  webpack: (config, options) => {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve.alias,
          docs: path.resolve(MONOREPO_PATH, './docs'),
          '@toolpad/studio-components': path.resolve(
            currentDirectory,
            '../packages/toolpad-studio-components/src',
          ),
          '@toolpad/studio-runtime': path.resolve(
            currentDirectory,
            '../packages/toolpad-studio-runtime/src',
          ),
          '@toolpad/utils': path.resolve(currentDirectory, '../packages/toolpad-utils/src'),
        },
      },
      module: {
        ...config.module,
        rules: config.module.rules.concat([
          // used in some /getting-started/templates
          {
            test: /\.md$/,
            oneOf: [
              {
                resourceQuery: /muiMarkdown/,
                use: [
                  options.defaultLoaders.babel,
                  {
                    loader: require.resolve('@mui/internal-markdown/loader'),
                    options: {
                      workspaceRoot: WORKSPACE_ROOT,
                      env: {
                        SOURCE_CODE_REPO: options.config.env.SOURCE_CODE_REPO,
                        LIB_VERSION: options.config.env.LIB_VERSION,
                      },
                    },
                  },
                ],
              },
            ],
          },
          {
            test: /\.+(js|jsx|mjs|ts|tsx)$/,
            include: [/(@mui[\\/]monorepo)$/, /(@mui[\\/]monorepo)[\\/](?!.*node_modules)/],
            use: options.defaultLoaders.babel,
          },
        ]),
      },
    };
  },
  distDir: 'export',
  // Next.js provides a `defaultPathMap` argument, we could simplify the logic.
  // However, we don't in order to prevent any regression in the `findPages()` method.
  exportPathMap: () => {
    const pages = findPages();
    const map = {};

    function traverse(pages2, userLanguage) {
      const prefix = userLanguage === 'en' ? '' : `/${userLanguage}`;

      pages2.forEach((page) => {
        if (!page.children) {
          map[`${prefix}${page.pathname.replace(/^\/api-docs\/(.*)/, '/api/$1')}`] = {
            page: page.pathname,
            query: {
              userLanguage,
            },
          };
          return;
        }

        traverse(page.children, userLanguage);
      });
    }

    // eslint-disable-next-line no-console
    console.log('Considering only English for SSR');
    traverse(pages, 'en');

    return map;
  },
  // Used to signal we run yarn build
  ...(process.env.NODE_ENV === 'production'
    ? {
        output: 'export',
      }
    : {
        redirects: async () => [
          {
            source: '/',
            destination: '/toolpad/',
            permanent: false,
          },
        ],
      }),
});
