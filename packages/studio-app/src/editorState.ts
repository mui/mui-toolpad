import { omit, update, updateOrCreate } from './utils/immutability';
import { generateUniqueId } from './utils/randomId';
import { NodeId, SlotLocation, StudioNodeProp, StudioNodeProps, ViewState } from './types';
import * as studioDom from './studioDom';

export type ComponentPanelTab = 'catalog' | 'component' | 'theme';

export interface BindingEditorState {
  readonly nodeId: NodeId;
  readonly prop: string;
}

export interface BaseEditorState {
  readonly editorType: 'page' | 'api';
  readonly dom: studioDom.StudioDom;
}

export interface ApiEditorState extends BaseEditorState {
  readonly editorType: 'api';
  readonly apiNodeId: NodeId;
}

export interface PageEditorState extends BaseEditorState {
  readonly editorType: 'page';
  readonly pageNodeId: NodeId;
  readonly selection: NodeId | null;
  readonly componentPanelTab: ComponentPanelTab;
  readonly newNode: studioDom.StudioNode | null;
  readonly bindingEditor: BindingEditorState | null;
  readonly highlightLayout: boolean;
  readonly highlightedSlot: SlotLocation | null;
  readonly viewState: ViewState;
}

export type EditorState = PageEditorState | ApiEditorState;

export type EditorAction =
  | {
      type: 'NOOP';
    }
  | {
      type: 'SELECT_NODE';
      nodeId: NodeId | null;
    }
  | {
      type: 'DESELECT_NODE';
    }
  | {
      type: 'SET_NODE_NAME';
      nodeId: NodeId;
      name: string;
    }
  | {
      type: 'SET_NODE_PROP';
      nodeId: NodeId;
      prop: string;
      value: StudioNodeProp<unknown>;
    }
  | {
      type: 'SET_NODE_PROPS';
      nodeId: NodeId;
      props: StudioNodeProps<unknown>;
    }
  | {
      type: 'SET_COMPONENT_PANEL_TAB';
      tab: ComponentPanelTab;
    }
  | {
      type: 'NODE_DRAG_START';
      nodeId: NodeId;
    }
  | {
      type: 'NEW_NODE_DRAG_START';
      newNode: studioDom.StudioNode;
    }
  | {
      type: 'NODE_DRAG_OVER';
      slot: SlotLocation | null;
    }
  | {
      type: 'NODE_DRAG_END';
    }
  | {
      type: 'OPEN_BINDING_EDITOR';
      nodeId: NodeId;
      prop: string;
    }
  | {
      type: 'CLOSE_BINDING_EDITOR';
    }
  | {
      type: 'ADD_BINDING';
      srcNodeId: NodeId;
      srcProp: string;
      destNodeId: NodeId;
      destProp: string;
      initialValue: string;
    }
  | {
      type: 'REMOVE_BINDING';
      nodeId: NodeId;
      prop: string;
    }
  | {
      type: 'PAGE_VIEW_STATE_UPDATE';
      viewState: ViewState;
    }
  | {
      type: 'ADD_NODE';
      node: studioDom.StudioNode;
      parentId: NodeId;
      parentProp: string;
      parentIndex?: string;
    }
  | {
      type: 'MOVE_NODE';
      nodeId: NodeId;
      parentId: NodeId;
      parentProp: string;
      parentIndex: string;
    }
  | {
      type: 'REMOVE_NODE';
      nodeId: NodeId;
    };

export function createApiEditorState(dom: studioDom.StudioDom, apiNodeId: NodeId): ApiEditorState {
  return {
    editorType: 'api',
    dom,
    apiNodeId,
  };
}

export function createPageEditorState(
  dom: studioDom.StudioDom,
  pageNodeId: NodeId,
): PageEditorState {
  return {
    editorType: 'page',
    dom,
    pageNodeId,
    selection: null,
    componentPanelTab: 'catalog',
    newNode: null,
    bindingEditor: null,
    highlightLayout: false,
    highlightedSlot: null,
    viewState: {},
  };
}

export function createEditorState(dom: studioDom.StudioDom): EditorState {
  const pageNode = studioDom.getPages(dom, studioDom.getApp(dom))[0];
  return createPageEditorState(dom, pageNode.id);
}

export function pageEditorReducer(state: PageEditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'NOOP':
      return state;
    case 'SET_NODE_NAME': {
      const node = studioDom.getNode(state.dom, action.nodeId);
      return update(state, {
        dom: studioDom.setNodeName(state.dom, node, action.name),
      });
    }
    case 'SET_NODE_PROP': {
      const node = studioDom.getNode(state.dom, action.nodeId);
      return update(state, {
        dom: studioDom.setNodeProp<any, any>(state.dom, node, action.prop, action.value),
      });
    }
    case 'SET_NODE_PROPS': {
      const node = studioDom.getNode(state.dom, action.nodeId);
      studioDom.assertIsElement(node);
      return update(state, {
        dom: studioDom.setNodeProps(state.dom, node, action.props),
      });
    }
    case 'ADD_NODE': {
      return update(state, {
        dom: studioDom.addNode(
          state.dom,
          action.node,
          action.parentId,
          action.parentProp,
          action.parentIndex,
        ),
      });
    }
    case 'MOVE_NODE': {
      return update(state, {
        dom: studioDom.moveNode(
          state.dom,
          action.nodeId,
          action.parentId,
          action.parentProp,
          action.parentIndex,
        ),
      });
    }
    case 'REMOVE_NODE': {
      // TODO: also clean up orphaned state and bindings
      return update(state, {
        dom: studioDom.removeNode(state.dom, action.nodeId),
      });
    }
    case 'ADD_BINDING': {
      const { srcNodeId, srcProp, destNodeId, destProp, initialValue } = action;
      const srcNode = studioDom.getNode(state.dom, srcNodeId);
      studioDom.assertIsElement<Record<string, unknown>>(srcNode);
      const destNode = studioDom.getNode(state.dom, destNodeId);
      studioDom.assertIsElement(destNode);
      const destPropValue = (destNode.props as StudioNodeProps<Record<string, unknown>>)[destProp];
      let stateKey = destPropValue?.type === 'binding' ? destPropValue.state : null;

      const page = studioDom.getNode(state.dom, state.pageNodeId);
      studioDom.assertIsPage(page);

      let pageState = page.state;
      if (!stateKey) {
        stateKey = generateUniqueId(new Set(Object.keys(page.state)));
        pageState = update(pageState, {
          [stateKey]: { name: '', initialValue },
        });
      }

      return update(state, {
        dom: update(state.dom, {
          nodes: update(state.dom.nodes, {
            [page.id]: update(page, {
              state: pageState,
            }),
            [srcNodeId]: update(srcNode, {
              props: update(srcNode.props, {
                [srcProp]: { type: 'binding', state: stateKey },
              }),
            }),
            [destNodeId]: update(destNode, {
              props: update(destNode.props, {
                [destProp]: { type: 'binding', state: stateKey },
              }),
            }),
          }),
        }),
      });
    }
    case 'REMOVE_BINDING': {
      const { nodeId, prop } = action;

      const node = studioDom.getNode(state.dom, nodeId);
      studioDom.assertIsElement(node);

      // TODO: also clean up orphaned state and bindings
      return update(state, {
        dom: update(state.dom, {
          nodes: update(state.dom.nodes, {
            [nodeId]: update(node, {
              props: omit(node.props, prop),
            }),
          }),
        }),
      });
    }

    case 'SELECT_NODE': {
      if (action.nodeId) {
        const node = studioDom.getNode(state.dom, action.nodeId);
        if (studioDom.isElement(node)) {
          return update(state, {
            selection: node.id,
            componentPanelTab: 'component',
          });
        }
        return state;
      }
      return update(state, {
        selection: null,
        componentPanelTab: 'component',
      });
    }
    case 'DESELECT_NODE': {
      return update(state, {
        selection: null,
      });
    }
    case 'SET_COMPONENT_PANEL_TAB':
      return update(state, {
        componentPanelTab: action.tab,
      });
    case 'NODE_DRAG_START': {
      return update(state, {
        selection: action.nodeId,
      });
    }
    case 'NEW_NODE_DRAG_START': {
      if (state.newNode) {
        return state;
      }
      return update(state, {
        selection: null,
        newNode: action.newNode,
      });
    }
    case 'NODE_DRAG_END':
      return update(state, {
        newNode: null,
        highlightLayout: false,
        highlightedSlot: null,
      });
    case 'NODE_DRAG_OVER': {
      return update(state, {
        highlightLayout: true,
        highlightedSlot: action.slot ? updateOrCreate(state.highlightedSlot, action.slot) : null,
      });
    }
    case 'OPEN_BINDING_EDITOR': {
      return update(state, {
        bindingEditor: action,
      });
    }
    case 'CLOSE_BINDING_EDITOR': {
      return update(state, {
        bindingEditor: null,
      });
    }
    case 'PAGE_VIEW_STATE_UPDATE': {
      const { viewState } = action;
      return update(state, {
        viewState,
      });
    }
    default:
      throw new Error('Invariant');
  }
}

export function apiEditorReducer(state: ApiEditorState, action: EditorAction): EditorState {
  switch (action.type) {
    default:
      return state;
  }
}

export function baseEditorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SELECT_NODE': {
      if (action.nodeId) {
        let node = studioDom.getNode(state.dom, action.nodeId);
        if (studioDom.isElement(node)) {
          const page = studioDom.getElementPage(state.dom, node);
          if (page) {
            node = page;
          }
        }
        if (studioDom.isPage(node)) {
          if (state.editorType === 'page' && node.id === state.pageNodeId) {
            return state;
          }
          return createPageEditorState(state.dom, node.id);
        }
        if (studioDom.isApi(node)) {
          return createApiEditorState(state.dom, node.id);
        }
      }
      return state;
    }
    default:
      return state;
  }
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  state = baseEditorReducer(state, action);

  switch (state.editorType) {
    case 'page':
      return pageEditorReducer(state, action);
    case 'api':
      return apiEditorReducer(state, action);
    default:
      return state;
  }
}
