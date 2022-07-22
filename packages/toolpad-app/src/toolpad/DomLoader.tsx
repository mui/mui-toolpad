import * as React from 'react';
import { Alert, Snackbar } from '@mui/material';
import { NodeId, BindableAttrValue, BindableAttrValues } from '@mui/toolpad-core';
import invariant from 'invariant';
import * as appDom from '../appDom';
import { update } from '../utils/immutability';
import client from '../api';
import useShortcut from '../utils/useShortcut';
import useDebouncedHandler from '../utils/useDebouncedHandler';
import { createProvidedContext } from '../utils/react';

export type DomAction =
  | {
      type: 'DOM_SAVING';
    }
  | {
      type: 'DOM_SAVED';
    }
  | {
      type: 'DOM_SAVING_ERROR';
      error: string;
    }
  | {
      type: 'DOM_SET_NODE_NAME';
      nodeId: NodeId;
      name: string;
    }
  | {
      type: 'DOM_SET_NODE_PROP';
      node: appDom.AppDomNode;
      prop: string;
      namespace: string;
      value: BindableAttrValue<unknown> | null;
    }
  | {
      type: 'DOM_SET_NODE_NAMESPACE';
      node: appDom.AppDomNode;
      namespace: string;
      value: BindableAttrValues | null;
    }
  | {
      type: 'DOM_ADD_NODE';
      node: appDom.AppDomNode;
      parent: appDom.AppDomNode;
      parentProp: string;
      parentIndex?: string;
    }
  | {
      type: 'DOM_MOVE_NODE';
      node: appDom.AppDomNode;
      parent: appDom.AppDomNode;
      parentProp: string;
      parentIndex?: string;
    }
  | {
      type: 'DOM_REMOVE_NODE';
      nodeId: NodeId;
    }
  | {
      type: 'DOM_SAVE_NODE';
      node: appDom.AppDomNode;
    };

export function domReducer(dom: appDom.AppDom, action: DomAction): appDom.AppDom {
  switch (action.type) {
    case 'DOM_SET_NODE_NAME': {
      // TODO: Also update all bindings on the page that use this name
      const node = appDom.getNode(dom, action.nodeId);
      return appDom.setNodeName(dom, node, action.name);
    }
    case 'DOM_SET_NODE_PROP': {
      return appDom.setNodeNamespacedProp<any, any, any>(
        dom,
        action.node,
        action.namespace,
        action.prop,
        action.value,
      );
    }
    case 'DOM_SET_NODE_NAMESPACE': {
      return appDom.setNodeNamespace<any, any>(dom, action.node, action.namespace, action.value);
    }
    case 'DOM_ADD_NODE': {
      return appDom.addNode<any, any>(
        dom,
        action.node,
        action.parent,
        action.parentProp,
        action.parentIndex,
      );
    }
    case 'DOM_MOVE_NODE': {
      return appDom.moveNode<any, any>(
        dom,
        action.node,
        action.parent,
        action.parentProp,
        action.parentIndex,
      );
    }
    case 'DOM_SAVE_NODE': {
      return appDom.saveNode(dom, action.node);
    }
    case 'DOM_REMOVE_NODE': {
      return appDom.removeNode(dom, action.nodeId);
    }
    default:
      return dom;
  }
}

export function domLoaderReducer(state: DomLoader, action: DomAction): DomLoader {
  if (state.dom) {
    const newDom = domReducer(state.dom, action);
    const hasUnsavedChanges = newDom !== state.dom;

    state = update(state, {
      dom: newDom,
      unsavedChanges: hasUnsavedChanges ? state.unsavedChanges + 1 : state.unsavedChanges,
    });
  }

  switch (action.type) {
    case 'DOM_SAVING': {
      return update(state, {
        saving: true,
        saveError: null,
      });
    }
    case 'DOM_SAVED': {
      return update(state, {
        saving: false,
        saveError: null,
        unsavedChanges: 0,
      });
    }
    case 'DOM_SAVING_ERROR': {
      return update(state, {
        saving: false,
        saveError: action.error,
      });
    }
    default:
      return state;
  }
}

function createDomApi(dispatch: React.Dispatch<DomAction>) {
  return {
    setNodeName(nodeId: NodeId, name: string) {
      dispatch({ type: 'DOM_SET_NODE_NAME', nodeId, name });
    },
    addNode<Parent extends appDom.AppDomNode, Child extends appDom.AppDomNode>(
      node: Child,
      parent: Parent,
      parentProp: appDom.ParentPropOf<Child, Parent>,
      parentIndex?: string,
    ) {
      dispatch({
        type: 'DOM_ADD_NODE',
        node,
        parent,
        parentProp,
        parentIndex,
      });
    },
    moveNode<Parent extends appDom.AppDomNode, Child extends appDom.AppDomNode>(
      node: Child,
      parent: Parent,
      parentProp: appDom.ParentPropOf<Child, Parent>,
      parentIndex?: string,
    ) {
      dispatch({
        type: 'DOM_MOVE_NODE',
        node,
        parent,
        parentProp,
        parentIndex,
      });
    },
    removeNode(nodeId: NodeId) {
      dispatch({
        type: 'DOM_REMOVE_NODE',
        nodeId,
      });
    },
    saveNode(node: appDom.AppDomNode) {
      dispatch({
        type: 'DOM_SAVE_NODE',
        node,
      });
    },
    setNodeNamespacedProp<
      Node extends appDom.AppDomNode,
      Namespace extends appDom.PropNamespaces<Node>,
      Prop extends keyof NonNullable<Node[Namespace]> & string,
    >(
      node: Node,
      namespace: Namespace,
      prop: Prop,
      value: NonNullable<Node[Namespace]>[Prop] | null,
    ) {
      dispatch({
        type: 'DOM_SET_NODE_PROP',
        namespace,
        node,
        prop,
        value: value as BindableAttrValue<unknown> | null,
      });
    },
    setNodeNamespace<Node extends appDom.AppDomNode, Namespace extends appDom.PropNamespaces<Node>>(
      node: Node,
      namespace: Namespace,
      value: Node[Namespace] | null,
    ) {
      dispatch({
        type: 'DOM_SET_NODE_NAMESPACE',
        namespace,
        node,
        value: value as BindableAttrValues | null,
      });
    },
  };
}

interface DomLoader {
  dom: appDom.AppDom;
  saving: boolean;
  unsavedChanges: number;
  saveError: string | null;
}

const [useDomLoader, DomLoaderProvider] = createProvidedContext<DomLoader>('DomLoader');

const DomApiContext = React.createContext<DomApi>(createDomApi(() => undefined));

export type DomApi = ReturnType<typeof createDomApi>;

export { useDomLoader };

export function useDom(): appDom.AppDom {
  const { dom } = useDomLoader();
  if (!dom) {
    throw new Error("Trying to access the DOM before it's loaded");
  }
  return dom;
}

export function useDomApi(): DomApi {
  return React.useContext(DomApiContext);
}

export interface DomContextProps {
  appId: string;
  children?: React.ReactNode;
}

export default function DomProvider({ appId, children }: DomContextProps) {
  const { data: dom } = client.useQuery('loadDom', [appId], { suspense: true });

  invariant(dom, `Suspense should load the dom`);

  const [state, dispatch] = React.useReducer(domLoaderReducer, {
    saving: false,
    unsavedChanges: 0,
    saveError: null,
    dom,
  });
  const api = React.useMemo(() => createDomApi(dispatch), []);

  const lastSavedDom = React.useRef<appDom.AppDom | null>(null);
  const handleSave = React.useCallback(() => {
    if (!state.dom || lastSavedDom.current === state.dom) {
      return;
    }

    lastSavedDom.current = state.dom;
    dispatch({ type: 'DOM_SAVING' });

    client.mutation
      .saveDom(appId, state.dom)
      .then(() => {
        dispatch({ type: 'DOM_SAVED' });
      })
      .catch((err) => {
        dispatch({ type: 'DOM_SAVING_ERROR', error: err.message });
      });
  }, [appId, state.dom]);

  const debouncedhandleSave = useDebouncedHandler(handleSave, 1000);

  React.useEffect(() => {
    debouncedhandleSave();
  }, [state.dom, debouncedhandleSave]);

  React.useEffect(() => {
    if (state.unsavedChanges <= 0) {
      return () => {};
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = `You have ${state.unsavedChanges} unsaved change(s), are you sure you want to navigate away?`;
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [state.unsavedChanges]);

  useShortcut({ code: 'KeyS', metaKey: true }, handleSave);

  return (
    <DomLoaderProvider value={state}>
      <DomApiContext.Provider value={api}>{children}</DomApiContext.Provider>
      <Snackbar open={!!state.saveError}>
        <Alert severity="error" sx={{ width: '100%' }}>
          Failed to save: {state.saveError}
        </Alert>
      </Snackbar>
    </DomLoaderProvider>
  );
}
