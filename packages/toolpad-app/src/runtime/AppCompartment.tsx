import 'ses';
import * as React from 'react';
import { StaticModuleRecord } from '@endo/static-module-record';
import { NodeId } from '@mui/toolpad-core';
import { transform } from 'sucrase';
import { createProvidedContext } from '../utils/react';
import * as appDom from '../appDom';
import { isAbsoluteUrl } from '../utils/strings';

const [useAppCompartment, AppCompartmentContextProvider] =
  createProvidedContext<Compartment>('AppCompartment');

const INTERNALS = new Map<string, () => Promise<any>>([
  ['react', () => import('react')],
  ['react-dom', () => import('react-dom')],
  ['@mui/toolpad-core', () => import(`@mui/toolpad-core`)],
  ['@mui/material', () => import('@mui/material')],
  ['@mui/x-data-grid-pro', () => import('@mui/x-data-grid-pro')],
  ['@mui/x-date-pickers', () => import('@mui/x-date-pickers')],
  ['@mui/icons-material', () => import('@mui/icons-material')],
  ['@mui/material/Button', () => import('@mui/material/Button')],
  // ... TODO: All @mui/material imports
]);

export function createAppCompartment(dom: appDom.AppDom): Compartment {
  const compartment = new Compartment(
    { console },
    {},
    {
      resolveHook(moduleSpecifier, moduleReferrer) {
        if (isAbsoluteUrl(moduleSpecifier)) {
          return moduleSpecifier;
        }

        if (moduleSpecifier.startsWith('.')) {
          return new URL(moduleSpecifier, moduleReferrer).href;
        }

        return moduleSpecifier;
      },
      async importHook(moduleSpecifier) {
        if (moduleSpecifier.startsWith('app:')) {
          const [type, id] = moduleSpecifier.slice(4).split('/');
          switch (type) {
            case 'codeComponents': {
              const node = appDom.getMaybeNode(dom, id as NodeId, 'codeComponent');
              const compiled = transform(node?.attributes.code.value ?? '', {
                transforms: ['typescript', 'jsx'],
              });
              return new StaticModuleRecord(compiled.code);
            }
            case 'pages': {
              const node = appDom.getMaybeNode(dom, id as NodeId, 'page');
              const compiled = transform(node?.attributes.module?.value ?? '', {
                transforms: ['typescript', 'jsx'],
              });
              return new StaticModuleRecord(compiled.code);
            }
            default:
              throw new Error(`Can't import "${moduleSpecifier}"`);
          }
        }

        if (moduleSpecifier.startsWith('https:')) {
          const res = await fetch(moduleSpecifier);
          if (res.ok) {
            return new StaticModuleRecord(await res.text());
          }
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const internal = INTERNALS.get(moduleSpecifier);

        if (internal) {
          const mod = await internal();
          return {
            imports: [],
            exports: Object.keys(mod),
            execute(exports, resolvedImports, compartment) {
              Object.assign(exports, mod);
            },
          };
        }

        throw new Error(`Can't import "${moduleSpecifier}"`);
      },
    },
  );

  return compartment;
}

interface AppCompartmentProviderProps {
  dom: appDom.AppDom;
  children?: React.ReactNode;
}

export default function AppCompartmentProvider({ dom, children }: AppCompartmentProviderProps) {
  const compartment = React.useMemo(() => createAppCompartment(dom), [dom]);
  return (
    <AppCompartmentContextProvider value={compartment}>{children}</AppCompartmentContextProvider>
  );
}

export { useAppCompartment };
