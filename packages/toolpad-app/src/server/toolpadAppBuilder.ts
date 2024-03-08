import * as path from 'path';
import * as url from 'node:url';
import * as fs from 'fs';
import type { InlineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { indent } from '@mui/toolpad-utils/strings';
import * as appDom from '@mui/toolpad-core/appDom';
import type { ComponentEntry, PagesManifest } from './localMode';
import { INITIAL_STATE_WINDOW_PROPERTY } from '../constants';
import { pathToNodeImportSpecifier } from '../utils/paths';
import viteVirtualPlugin, { VirtualFileContent, replaceFiles } from './viteVirtualPlugin';

const currentDirectory = url.fileURLToPath(new URL('.', import.meta.url));

const pkgJsonContent = fs.readFileSync(path.resolve(currentDirectory, '../../package.json'), {
  encoding: 'utf-8',
});
const pkgJson = JSON.parse(pkgJsonContent);
const TOOLPAD_BUILD = process.env.GIT_SHA1?.slice(0, 7) || 'dev';

const MAIN_ENTRY = '/main.tsx';
const EDITOR_ENTRY = '/editor.tsx';
const FALLBACK_MODULES = [
  '@mui/material',
  '@mui/icons-material',
  '@mui/x-data-grid',
  '@mui/x-charts',
];

function getHtmlContent(entry: string) {
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

        <script type="module" src=${JSON.stringify(entry)}></script>
      </body>
    </html>
  `;
}

export function getAppHtmlContent() {
  return getHtmlContent(MAIN_ENTRY);
}

export function getEditorHtmlContent() {
  return getHtmlContent(EDITOR_ENTRY);
}

function toolpadVitePlugin(): Plugin {
  return {
    name: 'toolpad',

    async resolveId(id, parent) {
      if (id.endsWith('.html')) {
        return id;
      }
      const hasFallback = FALLBACK_MODULES.some(
        (moduleName) => moduleName === id || id.startsWith(`${moduleName}/`),
      );
      if (hasFallback) {
        const [userMod, fallbackMod] = await Promise.all([
          this.resolve(id, parent),
          this.resolve(id, currentDirectory),
        ]);
        return userMod || fallbackMod;
      }
      return null;
    },

    async load(id) {
      if (id.endsWith('index.html')) {
        // production build only
        return getAppHtmlContent();
      }

      if (id.endsWith('editor.html')) {
        // production build only
        return getEditorHtmlContent();
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
  toolpadDevMode: boolean;
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
  toolpadDevMode,
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

  const getEntryPoint = (target: 'prod' | 'dev' | 'editor') => {
    const isCanvas = target === 'dev';
    const isEditor = target === 'editor';

    const componentsId = 'virtual:toolpad-files:components.tsx';
    const pageComponentsId = 'virtual:toolpad-files:page-components.tsx';

    return `
import { init, setComponents } from '@mui/toolpad/entrypoint';
import components from ${JSON.stringify(componentsId)};
import pageComponents from ${JSON.stringify(pageComponentsId)};
${isCanvas ? `import AppCanvas from '@mui/toolpad/canvas'` : ''}
${isEditor ? `import ToolpadEditor from '@mui/toolpad/editor'` : ''}

// importing monaco to get around module ordering issues in esbuild
import 'monaco-editor';

window.MonacoEnvironment = {
  getWorker: async (_, label) => {
    // { type: 'module' } is supported in firefox but behind feature flag:
    // you have to enable it manually via about:config and set dom.workers.modules.enabled to true.
    if (label === 'typescript') {
      const { default: TsWorker } = await import('monaco-editor/esm/vs/language/typescript/ts.worker?worker');
      return new TsWorker();
    }
    if (label === 'json') {
      const { default: JsonWorker } = await import('monaco-editor/esm/vs/language/json/json.worker?worker');
      return new JsonWorker();
    }
    if (label === 'html') {
      const { default: HtmlWorker } = await import('monaco-editor/esm/vs/language/html/html.worker?worker');
      return new HtmlWorker();
    }
    if (label === 'css') {
      const { default: CssWorker } = await import('monaco-editor/esm/vs/language/css/css.worker?worker');
      return new CssWorker();
    }
    if (label === 'editorWorkerService') {
      const { default: EditorWorker } = await import('monaco-editor/esm/vs/editor/editor.worker?worker');
      return new EditorWorker();
    }
    throw new Error(\`Failed to resolve worker with label "\${label}"\`);
  },
} as monaco.Environment;

const initialState = window[${JSON.stringify(INITIAL_STATE_WINDOW_PROPERTY)}];

setComponents(components, pageComponents);

init({
  ${isCanvas ? `ToolpadApp: AppCanvas,` : ''}
  ${isEditor ? `ToolpadApp: ToolpadEditor,` : ''}
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
    ['main.tsx', getEntryPoint('prod')],
    ['dev.tsx', getEntryPoint('dev')],
    ['editor.tsx', getEntryPoint('editor')],
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
        emptyOutDir: true,
        chunkSizeWarningLimit: Infinity,
        rollupOptions: {
          input: {
            index: path.resolve(currentDirectory, './index.html'),
            ...(process.env.EXPERIMENTAL_INLINE_CANVAS && dev
              ? { editor: path.resolve(currentDirectory, './editor.html') }
              : {}),
          },
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
        dedupe: FALLBACK_MODULES,
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
            // eslint-disable-next-line no-nested-ternary
            replacement: process.env.EXPERIMENTAL_INLINE_CANVAS
              ? 'virtual:toolpad-files:main.tsx'
              : dev
                ? 'virtual:toolpad-files:dev.tsx'
                : 'virtual:toolpad-files:main.tsx',
          },
          {
            find: '@mui/toolpad',
            replacement: toolpadDevMode
              ? // load source
                path.resolve(currentDirectory, '../../src/exports')
              : // load compiled
                path.resolve(currentDirectory, '../exports'),
          },
          ...(process.env.EXPERIMENTAL_INLINE_CANVAS && dev
            ? [
                {
                  find: EDITOR_ENTRY,
                  replacement: 'virtual:toolpad-files:editor.tsx',
                },
                {
                  find: 'vm',
                  replacement: 'vm-browserify',
                },
              ]
            : []),
        ],
      },
      server: {
        fs: {
          allow: [root, path.resolve(currentDirectory, '../../../../')],
        },
      },
      optimizeDeps: {
        force: !process.env.EXPERIMENTAL_INLINE_CANVAS && toolpadDevMode ? true : undefined,
        include: [
          ...FALLBACK_MODULES.map((moduleName) => `@mui/toolpad > ${moduleName}`),
          ...(process.env.EXPERIMENTAL_INLINE_CANVAS && dev
            ? [
                'perf-cascade',
                'monaco-editor',
                'monaco-editor/esm/vs/basic-languages/javascript/javascript',
                'monaco-editor/esm/vs/basic-languages/typescript/typescript',
                'monaco-editor/esm/vs/basic-languages/markdown/markdown',
              ]
            : []),
        ],
      },
      appType: 'custom',
      logLevel: 'info',
      root: currentDirectory,
      plugins: [toolpadVitePlugin(), virtualToolpadFiles, react(), ...plugins],
      base,
      define: {
        'process.env.NODE_ENV': `'${mode}'`,
        'process.env.BASE_URL': `'${base}'`,
        'process.env.TOOLPAD_CUSTOM_SERVER': `'${JSON.stringify(customServer)}'`,
        'process.env.TOOLPAD_VERSION': JSON.stringify(pkgJson.version),
        'process.env.TOOLPAD_BUILD': JSON.stringify(TOOLPAD_BUILD),
        'process.env.EXPERIMENTAL_INLINE_CANVAS': JSON.stringify(
          process.env.EXPERIMENTAL_INLINE_CANVAS,
        ),
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
    toolpadDevMode: false,
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
