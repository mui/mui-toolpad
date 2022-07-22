import { NodeId, LiveBindings } from '@mui/toolpad-core';
import * as React from 'react';
import * as appDom from '../../../appDom';
import { PageViewState } from '../../../types';
import { RectangleEdge } from '../../../utils/geometry';
import { update } from '../../../utils/immutability';

export type ComponentPanelTab = 'component' | 'theme';

export const DROP_ZONE_TOP = 'top';
export const DROP_ZONE_BOTTOM = 'bottom';
export const DROP_ZONE_LEFT = 'left';
export const DROP_ZONE_RIGHT = 'right';
export const DROP_ZONE_CENTER = 'center';
export type DropZone =
  | typeof DROP_ZONE_TOP
  | typeof DROP_ZONE_BOTTOM
  | typeof DROP_ZONE_LEFT
  | typeof DROP_ZONE_RIGHT
  | typeof DROP_ZONE_CENTER;

export interface PageEditorState {
  readonly appId: string;
  readonly type: 'page';
  readonly nodeId: NodeId;
  readonly selection: NodeId | null;
  readonly componentPanelTab: ComponentPanelTab;
  readonly newNode: appDom.ElementNode | null;
  readonly draggedNodeId: NodeId | null;
  readonly isDraggingOver: boolean;
  readonly dragOverNodeId: NodeId | null;
  readonly dragOverSlotParentProp: string | null;
  readonly dragOverZone: DropZone | null;
  readonly draggedEdge: RectangleEdge | null;
  readonly viewState: PageViewState;
  readonly pageState: Record<string, unknown>;
  readonly bindings: LiveBindings;
}

export type PageEditorAction =
  | {
      type: 'REPLACE';
      state: PageEditorState;
    }
  | {
      type: 'SELECT_NODE';
      nodeId: NodeId | null;
    }
  | {
      type: 'DESELECT_NODE';
    }
  | {
      type: 'PAGE_SET_COMPONENT_PANEL_TAB';
      tab: ComponentPanelTab;
    }
  | {
      type: 'PAGE_NEW_NODE_DRAG_START';
      newNode: appDom.ElementNode;
    }
  | {
      type: 'PAGE_EXISTING_NODE_DRAG_START';
      node: appDom.ElementNode;
    }
  | {
      type: 'PAGE_EDGE_DRAG_START';
      edgeDragState: {
        nodeId: NodeId | null;
        edge: RectangleEdge;
      };
    }
  | {
      type: 'PAGE_NODE_DRAG_OVER';
      dragOverState: {
        nodeId: NodeId | null;
        parentProp: string | null;
        zone: DropZone | null;
      };
    }
  | {
      type: 'PAGE_DRAG_END';
    }
  | {
      type: 'PAGE_STATE_UPDATE';
      pageState: Record<string, unknown>;
    }
  | {
      type: 'PAGE_VIEW_STATE_UPDATE';
      viewState: PageViewState;
    }
  | {
      type: 'PAGE_BINDINGS_UPDATE';
      bindings: LiveBindings;
    };

export function createPageEditorState(appId: string, nodeId: NodeId): PageEditorState {
  return {
    appId,
    type: 'page',
    nodeId,
    selection: null,
    componentPanelTab: 'component',
    newNode: null,
    draggedNodeId: null,
    isDraggingOver: false,
    dragOverNodeId: null,
    dragOverSlotParentProp: null,
    dragOverZone: null,
    draggedEdge: null,
    viewState: { nodes: {} },
    pageState: {},
    bindings: {},
  };
}

export function pageEditorReducer(
  state: PageEditorState,
  action: PageEditorAction,
): PageEditorState {
  switch (action.type) {
    case 'REPLACE': {
      return action.state;
    }
    case 'SELECT_NODE': {
      return update(state, {
        selection: action.nodeId,
        componentPanelTab: 'component',
      });
    }
    case 'DESELECT_NODE': {
      return update(state, {
        selection: null,
      });
    }
    case 'PAGE_SET_COMPONENT_PANEL_TAB':
      return update(state, {
        componentPanelTab: action.tab,
      });
    case 'PAGE_NEW_NODE_DRAG_START': {
      if (state.newNode) {
        return state;
      }
      return update(state, {
        newNode: action.newNode,
      });
    }
    case 'PAGE_EXISTING_NODE_DRAG_START': {
      return update(state, {
        draggedNodeId: action.node.id,
      });
    }
    case 'PAGE_EDGE_DRAG_START': {
      const { nodeId, edge } = action.edgeDragState;

      return update(state, {
        draggedNodeId: nodeId,
        draggedEdge: edge,
      });
    }
    case 'PAGE_DRAG_END':
      return update(state, {
        newNode: null,
        draggedNodeId: null,
        isDraggingOver: false,
        dragOverNodeId: null,
        dragOverSlotParentProp: null,
        dragOverZone: null,
        draggedEdge: null,
      });
    case 'PAGE_NODE_DRAG_OVER': {
      const { nodeId, parentProp, zone } = action.dragOverState;

      return update(state, {
        isDraggingOver: true,
        dragOverNodeId: nodeId,
        dragOverSlotParentProp: parentProp,
        dragOverZone: zone,
      });
    }
    case 'PAGE_VIEW_STATE_UPDATE': {
      const { viewState } = action;
      return update(state, {
        viewState,
      });
    }
    case 'PAGE_STATE_UPDATE': {
      const { pageState } = action;
      return update(state, {
        pageState,
      });
    }
    case 'PAGE_BINDINGS_UPDATE': {
      const { bindings } = action;
      return update(state, {
        bindings,
      });
    }
    default:
      return state;
  }
}

function createPageEditorApi(dispatch: React.Dispatch<PageEditorAction>) {
  return {
    replace: (state: PageEditorState) => dispatch({ type: 'REPLACE', state }),
    select: (nodeId: NodeId | null) => dispatch({ type: 'SELECT_NODE', nodeId }),
    deselect: () => dispatch({ type: 'DESELECT_NODE' }),
    setComponentPanelTab(tab: ComponentPanelTab) {
      dispatch({ type: 'PAGE_SET_COMPONENT_PANEL_TAB', tab });
    },
    newNodeDragStart(newNode: appDom.ElementNode) {
      dispatch({ type: 'PAGE_NEW_NODE_DRAG_START', newNode });
    },
    existingNodeDragStart(node: appDom.ElementNode) {
      dispatch({ type: 'PAGE_EXISTING_NODE_DRAG_START', node });
    },
    edgeDragStart({ nodeId, edge }: { nodeId: NodeId | null; edge: RectangleEdge }) {
      dispatch({
        type: 'PAGE_EDGE_DRAG_START',
        edgeDragState: { nodeId, edge },
      });
    },
    dragEnd() {
      dispatch({ type: 'PAGE_DRAG_END' });
    },
    nodeDragOver({
      nodeId,
      parentProp,
      zone,
    }: {
      nodeId: NodeId | null;
      parentProp: string | null;
      zone: DropZone | null;
    }) {
      dispatch({
        type: 'PAGE_NODE_DRAG_OVER',
        dragOverState: { nodeId, parentProp, zone },
      });
    },
    pageViewStateUpdate(viewState: PageViewState) {
      dispatch({
        type: 'PAGE_VIEW_STATE_UPDATE',
        viewState,
      });
    },
    pageStateUpdate(pageState: Record<string, unknown>) {
      dispatch({
        type: 'PAGE_STATE_UPDATE',
        pageState,
      });
    },
    pageBindingsUpdate(bindings: LiveBindings) {
      dispatch({
        type: 'PAGE_BINDINGS_UPDATE',
        bindings,
      });
    },
  };
}

const PageEditorContext = React.createContext<PageEditorState | null>(null);

export function usePageEditorState() {
  const state = React.useContext(PageEditorContext);

  if (!state) {
    throw new Error(`Missing PageEditorContext`);
  }

  return state;
}

export interface PageEditorProviderProps {
  appId: string;
  children?: React.ReactNode;
  nodeId: NodeId;
}

export type PageEditorApi = ReturnType<typeof createPageEditorApi>;

const PageEditorApiContext = React.createContext<PageEditorApi>(
  createPageEditorApi(() => undefined),
);

export function PageEditorProvider({ appId, children, nodeId }: PageEditorProviderProps) {
  const initialState = createPageEditorState(appId, nodeId);
  const [state, dispatch] = React.useReducer(pageEditorReducer, initialState);
  const api = React.useMemo(() => createPageEditorApi(dispatch), []);

  React.useEffect(() => {
    api.replace(createPageEditorState(appId, nodeId));
  }, [appId, api, nodeId]);

  return (
    <PageEditorContext.Provider value={state}>
      <PageEditorApiContext.Provider value={api}>{children}</PageEditorApiContext.Provider>
    </PageEditorContext.Provider>
  );
}

export function usePageEditorApi() {
  return React.useContext(PageEditorApiContext);
}
