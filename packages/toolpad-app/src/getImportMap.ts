import { ImportMap } from 'esinstall';
import importMap from '../public/web_modules/import-map.json';

function rewriteImports(map: ImportMap): ImportMap {
  return {
    ...map,
    imports: {
      ...Object.fromEntries(
        Object.entries(map.imports).map(([specifier, source]) => {
          const { pathname } = new URL(source, 'https://x/web_modules/');
          return [specifier, pathname];
        }),
      ),
      '@mui/toolpad-components': '/runtime/components.js',
      '@mui/toolpad-core': '/runtime/core.js',
      '@mui/toolpad-core/runtime': '/runtime/coreRuntime.js',
    },
  };
}

const IMPORT_MAP = rewriteImports(importMap);

export default function getImportMap() {
  return IMPORT_MAP;
}
