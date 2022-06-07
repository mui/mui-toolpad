import * as React from 'react';
import * as builtins from '@mui/toolpad-components';
import {
  ToolpadComponent,
  ToolpadComponents,
  TOOLPAD_COMPONENT,
  createComponent,
} from '@mui/toolpad-core';
import * as ReactIs from 'react-is';
import * as appDom from '../appDom';
import { getToolpadComponents } from '../toolpadComponents';
import createCodeComponent from './createCodeComponent';
import { createProvidedContext } from '../utils/react';
import { hasOwnProperty } from '../utils/collections';

const [useComponents, ComponentsContextProvider] =
  createProvidedContext<ToolpadComponents>('Components');

function createToolpadComponentThatThrows(error: Error) {
  return createComponent(() => {
    throw error;
  });
}

const Noop = createComponent(() => null);

type ComponentsCache = Partial<
  Record<
    string,
    | { state: 'pending'; promise: Promise<any> }
    | { state: 'loaded'; Component: ToolpadComponent }
    | undefined
  >
>;

const globalCache: ComponentsCache = {};

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

/**
 * This function will instantiate all components used on a page. CodeComponents that haven't been
 * loaded yet will return null. Additionally, an array with promises is returned,
 * one for each code component that is still loading. This can be used to suspend rendering.
 */
function getComponentsForPage(dom: appDom.AppDom, page: appDom.PageNode) {
  const components: ToolpadComponents = {};
  const pending: Promise<any>[] = [];

  const catalog = getToolpadComponents(dom);

  const descendants = appDom.getDescendants(dom, page);
  const usedComponents = new Set(
    descendants.flatMap((node) => {
      if (!appDom.isElement(node)) {
        return [];
      }

      return [node.attributes.component.value];
    }),
  );

  for (const id of usedComponents) {
    const componentDef = catalog[id];
    if (componentDef) {
      if (componentDef.builtin) {
        const builtin = (builtins as any)[componentDef.builtin];

        if (!isToolpadComponent(builtin)) {
          throw new Error(`Imported builtin "${componentDef.builtin}" is not a ToolpadComponent`);
        }

        components[id] = builtin;
      }

      if (componentDef?.codeComponentId) {
        const componentId = componentDef.codeComponentId;
        const codeComponentNode = appDom.getNode(dom, componentId, 'codeComponent');
        const src = codeComponentNode.attributes.code.value;

        const fromCache = globalCache[src];

        if (!fromCache) {
          const createPromise = createCodeComponent(src)
            .catch((error) => createToolpadComponentThatThrows(error))
            .then((Component) => {
              globalCache[src] = {
                state: 'loaded',
                Component,
              };
            });
          globalCache[src] = {
            state: 'pending',
            promise: createPromise,
          };
          pending.push(createPromise);
          components[id] = Noop;
        } else if (fromCache.state === 'pending') {
          pending.push(fromCache.promise);
          components[id] = Noop;
        } else {
          components[id] = fromCache.Component;
        }
      }
    }
  }

  return { components, pending };
}

interface ComponentsContextProps {
  dom: appDom.AppDom;
  page: appDom.PageNode;
  children?: React.ReactNode;
}

export default function ComponentsContext({ dom, page, children }: ComponentsContextProps) {
  const { components, pending } = React.useMemo(() => getComponentsForPage(dom, page), [dom, page]);

  if (pending.length > 0) {
    // We can suspend rendering here to avoid layout shifting
    throw Promise.all(pending);
  }

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
