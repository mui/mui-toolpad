import * as React from 'react';

import {
  ToolpadComponent,
  ToolpadComponents,
  TOOLPAD_COMPONENT,
  createComponent,
} from '@mui/toolpad-core';
import * as ReactIs from 'react-is';
import * as builtins from '../../../toolpad-components/dist/index';
import * as appDom from '../appDom';
import { getToolpadComponents } from '../toolpadComponents';
import { ensureToolpadComponent } from './loadCodeComponent';
import { createProvidedContext } from '../utils/react';
import { hasOwnProperty } from '../utils/collections';
import { useAppModules } from './AppModulesProvider';

const [useComponents, ComponentsContextProvider] =
  createProvidedContext<ToolpadComponents>('Components');

function createToolpadComponentThatThrows(error: Error) {
  return createComponent(() => {
    throw error;
  });
}

function isToolpadComponent(maybeComponent: unknown): maybeComponent is ToolpadComponent<any> {
  if (
    !ReactIs.isValidElementType(maybeComponent) ||
    typeof maybeComponent === 'string' ||
    !hasOwnProperty(maybeComponent, TOOLPAD_COMPONENT)
  ) {
    return false;
  }

  return true;
}

interface ComponentsContextProps {
  dom: appDom.AppDom;
  children?: React.ReactNode;
}

export default function ComponentsContext({ dom, children }: ComponentsContextProps) {
  const modules = useAppModules();

  const components = React.useMemo(() => {
    const catalog = getToolpadComponents(dom);
    const result: Record<string, ToolpadComponent<any>> = {};

    for (const [id, componentDef] of Object.entries(catalog)) {
      if (componentDef) {
        if (componentDef.builtin) {
          const builtin = (builtins as any)[componentDef.builtin];
          if (!isToolpadComponent(builtin)) {
            result[id] = createToolpadComponentThatThrows(
              new Error(`Imported builtin "${componentDef.builtin}" is not a ToolpadComponent`),
            );
          } else {
            result[id] = builtin;
          }
        }

        if (componentDef?.codeComponentId) {
          const componentId = componentDef.codeComponentId;
          const moduleEntry = modules[`codeComponents/${componentId}`];
          if (moduleEntry) {
            result[id] = moduleEntry.error
              ? createToolpadComponentThatThrows(moduleEntry.error)
              : ensureToolpadComponent((moduleEntry.module as any)?.default);
          }
        }
      }

      if (!result[id]) {
        result[id] = createToolpadComponentThatThrows(
          new Error(`Can't find component for "${id}"`),
        );
      }
    }

    return result;
  }, [dom, modules]);

  return <ComponentsContextProvider value={components}>{children}</ComponentsContextProvider>;
}

export { useComponents };

export function useComponent(id: string) {
  const components = useComponents();
  return React.useMemo(() => {
    return (
      components?.[id] ??
      createToolpadComponentThatThrows(new Error(`Can't find component for "${id}"`))
    );
  }, [components, id]);
}
