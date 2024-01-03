import * as path from 'path';
import * as url from 'node:url';
import type { InlineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { indent } from '@mui/toolpad-utils/strings';
import type { ComponentEntry, PagesManifest } from './localMode';
import { INITIAL_STATE_WINDOW_PROPERTY } from '../constants';
import * as appDom from '../appDom';
import { pathToNodeImportSpecifier } from '../utils/paths';
import viteVirtualPlugin, { VirtualFileContent, replaceFiles } from './viteVirtualPlugin';

import.meta.url ??= url.pathToFileURL(__filename).toString();
const currentDirectory = url.fileURLToPath(new URL('.', import.meta.url));

const MAIN_ENTRY = '/main.tsx';
const CANVAS_ENTRY = '/canvas.tsx';

export interface GetHtmlContentParams {
  canvas: boolean;
  base: string;
}

export function getHtmlContent({ canvas }: GetHtmlContentParams) {
  const entryPoint = canvas ? CANVAS_ENTRY : MAIN_ENTRY;
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Toolpad</title>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
        />
      </head>
      <body>
        <div id="root"></div>
    
        <!-- __TOOLPAD_SCRIPTS__ -->

        <script type="module" src=${JSON.stringify(entryPoint)}></script>
      </body>
    </html>
  `;
}

interface ToolpadVitePluginParams {
  base: string;
}

function toolpadVitePlugin({ base }: ToolpadVitePluginParams): Plugin {
  return {
    name: 'toolpad',

    async resolveId(id) {
      if (id.endsWith('.html')) {
        return id;
      }
      return null;
    },

    async load(id) {
      if (id.endsWith('.html')) {
        // production build only
        return getHtmlContent({ canvas: false, base });
      }
      return null;
    },

    transform(code, id) {
      if (/\/resources\//.test(id)) {
        const codeFile = path.basename(id);

        const functionExports = [];

        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i += 1) {
          const line = lines[i];
          const lineNr = i + 1;
          if (/\s*export\b/.test(line)) {
            const match = line.match(/\s*export\s+async\s+function\s+([a-zA-Z0-9]+)\b/);

            if (match) {
              const functionName = match[1];
              functionExports.push(functionName);
            } else {
              console.warn(
                `Unsupported export at "${id}:${lineNr}". Only exports of the form "export async function foo(...) {" are supported.`,
              );
            }
          }
        }

        return `
          import { createRemoteFunction } from '@mui/toolpad/runtime';

          const functionFile = ${JSON.stringify(codeFile)};

          ${functionExports
            .map(
              (functionName) =>
                `const __${functionName} = createRemoteFunction(functionFile, ${JSON.stringify(
                  functionName,
                )})`,
            )
            .join('\n')}

          export {
            ${functionExports
              .map((functionName) => `__${functionName} as ${functionName}`)
              .join(',\n')}
          }
        `;
      }

      return code;
    },
  };
}

export interface CreateViteConfigParams {
  outDir: string;
  root: string;
  dev: boolean;
  base: string;
  customServer?: boolean;
  plugins?: Plugin[];
  getComponents: () => Promise<ComponentEntry[]>;
  loadDom: () => Promise<appDom.AppDom>;
  getPagesManifest: () => Promise<PagesManifest>;
}

export async function createViteConfig({
  outDir,
  root,
  dev,
  base,
  customServer,
  plugins = [],
  getComponents,
  loadDom,
  getPagesManifest,
}: CreateViteConfigParams) {
  const mode = dev ? 'development' : 'production';

  const getEntryPoint = (isCanvas: boolean) => {
    const componentsId = 'virtual:toolpad-files:components.tsx';
    const pageComponentsId = 'virtual:toolpad-files:page-components.tsx';

    return `
import { init, setComponents } from '@mui/toolpad/runtime';
import components from ${JSON.stringify(componentsId)};
import pageComponents from ${JSON.stringify(pageComponentsId)};
${isCanvas ? `import AppCanvas from '@mui/toolpad/canvas'` : ''}

const initialState = window[${JSON.stringify(INITIAL_STATE_WINDOW_PROPERTY)}];

setComponents(components, pageComponents);

init({
  ${isCanvas ? `ToolpadApp: AppCanvas,` : ''}
  base: ${JSON.stringify(base)},
  initialState,
})

if (import.meta.hot) {
  // TODO: investigate why this doesn't work, see https://github.com/vitejs/vite/issues/12912
  import.meta.hot.accept(
    [${JSON.stringify(componentsId)}, ${JSON.stringify(pageComponentsId)}],
    (newComponents, newPageComponents) => {
    if (newComponents) {
      console.log('hot updating Toolpad components')
      setComponents(
        newComponents ?? components,
        newPageComponents ?? pageComponents
      );
    }
  });
}
`;
  };

  const createComponentsFile = async () => {
    const components = await getComponents();

    const imports = components.map(
      ({ name }) => `import ${name} from 'toolpad-user-project:./components/${name}';`,
    );

    const defaultExportProperties = components.map(
      ({ name }) => `${JSON.stringify(`codeComponent.${name}`)}: ${name}`,
    );

    const code = `
      ${imports.join('\n')}

      export default {
        ${indent(defaultExportProperties.join(',\n'), 2)}
      };
    `;

    return {
      code,
      map: null,
    };
  };

  const createPageComponentsFile = async () => {
    const dom = await loadDom();
    const appNode = appDom.getApp(dom);
    const { pages = [] } = appDom.getChildNodes(dom, appNode);

    const imports = new Map<string, string>();

    for (const page of pages) {
      const codeFile = page.attributes.codeFile;
      if (codeFile) {
        const importPath = path.resolve(root, `./pages/${page.name}/page`);
        const relativeImportPath = path.relative(root, importPath);
        const importSpec = `toolpad-user-project:${pathToNodeImportSpecifier(relativeImportPath)}`;
        imports.set(page.name, importSpec);
      }
    }

    const importLines = Array.from(
      imports.entries(),
      ([name, spec]) => `${name}: React.lazy(() => import(${JSON.stringify(spec)}))`,
    );

    const code = `
      import * as React from 'react';
      
      export default {
        ${importLines.join(',\n')}
      }
    `;

    return {
      code,
      map: null,
    };
  };

  const virtualFiles = new Map<string, VirtualFileContent>([
    ['main.tsx', getEntryPoint(false)],
    ['canvas.tsx', getEntryPoint(true)],
    ['components.tsx', await createComponentsFile()],
    ['page-components.tsx', await createPageComponentsFile()],
    ['pages-manifest.json', JSON.stringify(await getPagesManifest(), null, 2)],
  ]);

  const virtualToolpadFiles = viteVirtualPlugin(virtualFiles, 'toolpad-files');

  return {
    reloadComponents: async () => {
      const newFiles = new Map(virtualFiles);
      newFiles.set('components.tsx', await createComponentsFile());
      replaceFiles(virtualToolpadFiles, newFiles);
    },
    viteConfig: {
      configFile: false,
      mode,
      build: {
        outDir,
        chunkSizeWarningLimit: Infinity,
        rollupOptions: {
          onwarn(warning, warn) {
            if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
              return;
            }
            warn(warning);
          },
        },
      },
      envFile: false,
      resolve: {
        alias: [
          {
            // FIXME(https://github.com/mui/material-ui/issues/35233)
            find: /^@mui\/icons-material\/(?!esm\/)([^/]*)/,
            replacement: '@mui/icons-material/esm/$1',
          },
          {
            find: /^toolpad-user-project:(.*)$/,
            replacement: `${root}/$1`,
          },
          {
            find: MAIN_ENTRY,
            replacement: 'virtual:toolpad-files:main.tsx',
          },
          {
            find: CANVAS_ENTRY,
            replacement: 'virtual:toolpad-files:canvas.tsx',
          },
        ],
      },
      server: {
        fs: {
          allow: [root, path.resolve(currentDirectory, '../../../../')],
        },
      },
      optimizeDeps: {
        include: [
          '@emotion/cache',
          '@emotion/react',
          '@mui/icons-material',
          '@mui/icons-material/ArrowDropDownRounded',
          '@mui/icons-material/Close',
          '@mui/icons-material/Delete',
          '@mui/icons-material/DarkMode',
          '@mui/icons-material/Edit',
          '@mui/icons-material/Error',
          '@mui/icons-material/HelpOutlined',
          '@mui/icons-material/LightMode',
          '@mui/icons-material/OpenInNew',
          '@mui/icons-material/SettingsBrightnessOutlined',
          '@mui/lab',
          '@mui/material',
          '@mui/material/CircularProgress',
          '@mui/material/Button',
          '@mui/material/colors',
          '@mui/material/styles',
          '@mui/material/useMediaQuery',
          '@mui/utils',
          '@mui/utils/useEventCallback',
          '@mui/x-data-grid-pro',
          '@mui/x-date-pickers/AdapterDayjs',
          '@mui/x-date-pickers/DesktopDatePicker',
          '@mui/x-date-pickers/LocalizationProvider',
          '@mui/x-license-pro',
          '@tanstack/react-query',
          '@tanstack/react-query-devtools/build/modern/production.js',
          'dayjs',
          'dayjs/locale/en',
          'dayjs/locale/fr',
          'dayjs/locale/nl',
          'fractional-indexing',
          'invariant',
          'lodash-es',
          'markdown-to-jsx',
          'nanoid/non-secure',
          'prop-types',
          'react',
          'react-dom',
          'react-dom/client',
          'react-error-boundary',
          'react-hook-form',
          'react-is',
          'react-router-dom',
          'react/jsx-dev-runtime',
          'react/jsx-runtime',
          'recharts',
          'superjson',
          'title',
          'zod',
        ],
        exclude: [
          '@mui/toolpad-core',
          '@mui/toolpad/browser',
          '@mui/toolpad/runtime',
          '@mui/toolpad/canvas',
        ],
      },
      appType: 'custom',
      logLevel: 'info',
      root,
      plugins: [virtualToolpadFiles, react(), toolpadVitePlugin({ base }), ...plugins],
      base,
      define: {
        'process.env.NODE_ENV': `'${mode}'`,
        'process.env.BASE_URL': `'${base}'`,
        'process.env.TOOLPAD_CUSTOM_SERVER': `'${JSON.stringify(customServer)}'`,
      },
    } satisfies InlineConfig,
  };
}

export interface ToolpadBuilderParams {
  outDir: string;
  getComponents: () => Promise<ComponentEntry[]>;
  loadDom: () => Promise<appDom.AppDom>;
  getPagesManifest: () => Promise<PagesManifest>;
  root: string;
  base: string;
}

export async function buildApp({
  root,
  base,
  getComponents,
  getPagesManifest,
  loadDom,
  outDir,
}: ToolpadBuilderParams) {
  const { viteConfig } = await createViteConfig({
    dev: false,
    root,
    base,
    outDir,
    getComponents,
    getPagesManifest,
    loadDom,
  });
  const vite = await import('vite');
  await vite.build(viteConfig);
}
