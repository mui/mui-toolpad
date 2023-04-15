import { InlineConfig, Plugin, build } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';
import { Server } from 'http';
import serializeJavascript from 'serialize-javascript';
import { MUI_X_PRO_LICENSE, RUNTIME_CONFIG_WINDOW_PROPERTY } from '../constants';
import { indent } from '../utils/strings';
import { getComponents, getAppOutputFolder } from './localMode';
import { RuntimeConfig } from '../config';
import * as appDom from '../appDom';
import createRuntimeState from '../createRuntimeState';

const MAIN_ENTRY = '/main.tsx';
const CANVAS_ENTRY = '/canvas.tsx';
const INITIAL_STATE_WINDOW_PROPERTY = '__initialToolpadState__';

export interface GetHtmlContentParams {
  canvas: boolean;
}

export function getHtmlContent({ canvas }: GetHtmlContentParams) {
  const entryPoint = canvas ? CANVAS_ENTRY : MAIN_ENTRY;
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>Toolpad</title>
      </head>
      <body>
        <div id="root"></div>

        ${
          canvas
            ? `
              <script>
                // Add the data-toolpad-canvas attribute to the canvas iframe element
                if (window.frameElement?.dataset.toolpadCanvas) {
                  var script = document.createElement('script');
                  script.src = '/reactDevtools/bootstrap.global.js';
                  document.write(script.outerHTML);
                }
              </script>
            `
            : ''
        }
    
        <!-- __TOOLPAD_SCRIPTS__ -->

        <script type="module" src=${JSON.stringify(entryPoint)}></script>
      </body>
    </html>
  `;
}

export interface PostProcessHtmlParams {
  config: RuntimeConfig;
  dom: appDom.AppDom;
}

export function postProcessHtml(html: string, { config, dom }: PostProcessHtmlParams): string {
  const serializedConfig = serializeJavascript(config, { ignoreFunction: true });
  const initialState = createRuntimeState({ dom });
  const serializedInitialState = serializeJavascript(initialState, {
    ignoreFunction: true,
  });

  const toolpadScripts = [
    `<script>window[${JSON.stringify(
      RUNTIME_CONFIG_WINDOW_PROPERTY,
    )}] = ${serializedConfig}</script>`,
    `<script>window[${JSON.stringify(
      INITIAL_STATE_WINDOW_PROPERTY,
    )}] = ${serializedInitialState}</script>`,
  ];

  return html.replaceAll(`<!-- __TOOLPAD_SCRIPTS__ -->`, toolpadScripts.join('\n'));
}

interface ToolpadVitePluginParams {
  root: string;
  base: string;
}

function toolpadVitePlugin({ root, base }: ToolpadVitePluginParams): Plugin {
  const resolvedRuntimeEntryPointId = `\0${MAIN_ENTRY}`;
  const resolvedCanvasEntryPointId = `\0${CANVAS_ENTRY}`;

  const componentsId = `virtual:toolpad:components`;
  const resolvedComponentsId = `\0${componentsId}`;

  const getEntryPoint = (isCanvas: boolean) => `
    import { init } from '@mui/toolpad-app/runtime';
    import { LicenseInfo } from '@mui/x-data-grid-pro';
    import components from 'virtual:toolpad:components';
    ${isCanvas ? `import AppCanvas from '@mui/toolpad-app/canvas'` : ''}
    
    LicenseInfo.setLicenseKey(${JSON.stringify(MUI_X_PRO_LICENSE)});
    
    const initialState = window[${JSON.stringify(INITIAL_STATE_WINDOW_PROPERTY)}];

    init({
      ${isCanvas ? `ToolpadApp: AppCanvas,` : ''}
      base: ${JSON.stringify(base)},
      components,
      initialState,
    })
  `;

  return {
    name: 'toolpad',

    async resolveId(id, importer) {
      if (id.endsWith(`/index.html`)) {
        return id;
      }
      if (id === MAIN_ENTRY) {
        return resolvedRuntimeEntryPointId;
      }
      if (id === CANVAS_ENTRY) {
        return resolvedCanvasEntryPointId;
      }
      if (id === componentsId) {
        return resolvedComponentsId;
      }
      if (importer === resolvedRuntimeEntryPointId || importer === resolvedComponentsId) {
        const newId = path.resolve(root, 'toolpad', id);
        return this.resolve(newId, importer);
      }
      return null;
    },

    async load(id) {
      if (id.endsWith(`/index.html`)) {
        // production build only
        return getHtmlContent({ canvas: false });
      }
      if (id === resolvedRuntimeEntryPointId) {
        return {
          code: getEntryPoint(false),
          map: null,
        };
      }
      if (id === resolvedCanvasEntryPointId) {
        return {
          code: getEntryPoint(true),
          map: null,
        };
      }
      if (id === resolvedComponentsId) {
        const components = await getComponents(root);

        const imports = components.map(({ name }) => `import ${name} from './components/${name}';`);

        const defaultExportProperties = components.map(
          ({ name }) => `${JSON.stringify(`codeComponent.${name}`)}: ${name}`,
        );

        return {
          code: `
            ${imports.join('\n')}

            export default {
              ${indent(defaultExportProperties.join(',\n'), 2)}
            }
          `,
          map: null,
        };
      }
      return null;
    },
  };
}

export interface CreateViteConfigParams {
  server?: Server;
  dev: boolean;
  root: string;
  base: string;
}

export function createViteConfig({
  root,
  dev,
  base,
  server,
}: CreateViteConfigParams): InlineConfig {
  const mode = dev ? 'development' : 'production';
  return {
    configFile: false,
    mode,
    build: {
      outDir: getAppOutputFolder(root),
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
    server: {
      middlewareMode: true,
      hmr: {
        server,
      },
      fs: {
        allow: [root, path.resolve(__dirname, '../../../../')],
      },
    },
    appType: 'custom',
    logLevel: 'info',
    root,
    plugins: [react(), toolpadVitePlugin({ root, base })],
    base,
    define: {
      'process.env.NODE_ENV': `'${mode}'`,
    },
  };
}

export interface ToolpadBuilderParams {
  root: string;
  base: string;
}

export async function buildApp({ root, base }: ToolpadBuilderParams) {
  await build(createViteConfig({ dev: false, root, base }));
}
