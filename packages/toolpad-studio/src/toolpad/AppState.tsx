import * as React from 'react';
import { NodeHashes, NodeId } from '@toolpad/studio-runtime';
import { createProvidedContext } from '@toolpad/utils/react';
import invariant from 'invariant';
import { debounce, DebouncedFunc } from 'lodash-es';
import { useLocation } from 'react-router-dom';
import { mapValues } from '@toolpad/utils/collections';
import useDebouncedHandler from '@toolpad/utils/hooks/useDebouncedHandler';
import useEventCallback from '@mui/utils/useEventCallback';
import { omit, update } from '@toolpad/utils/immutability';
import * as appDom from '@toolpad/studio-runtime/appDom';
import { useProjectApi } from '../projectApi';
import useShortcut from '../utils/useShortcut';
import insecureHash from '../utils/insecureHash';
import { ClientDataSource } from '../types';
import { hasFieldFocus } from '../utils/fields';
import { DomView, getViewFromPathname, PageViewTab, QueryTab } from '../utils/domView';

export function getNodeHashes(dom: appDom.AppDom): NodeHashes {
  return mapValues(dom.nodes, (node) => insecureHash(JSON.stringify(omit(node, 'id'))));
}

export type DomAction = {
  type: 'UPDATE';
  updater?: (dom: appDom.AppDom) => appDom.AppDom;
  view?: DomView;
};

export type DomLoaderAction =
  | DomAction
  | {
      type: 'DOM_SAVING';
    }
  | {
      type: 'DOM_SAVED';
      savedDom: appDom.AppDom;
    }
  | {
      type: 'DOM_SAVING_ERROR';
      error: string;
    }
  | {
      type: 'DOM_SERVER_UPDATE';
      dom: appDom.AppDom;
    };

export type AppStateAction =
  | DomLoaderAction
  | {
      type: 'UPDATE_HISTORY';
    }
  | {
      type: 'UNDO';
    }
  | {
      type: 'REDO';
    }
  | {
      type: 'SET_VIEW';
      view: DomView;
    }
  | {
      type: 'OPEN_QUERY_TAB';
      queryId: NodeId;
    }
  | {
      type: 'CREATE_QUERY_TAB';
      dataSource: ClientDataSource;
      dataSourceId: string;
      mode?: appDom.FetchMode;
    }
  | {
      type: 'CLOSE_QUERY_TAB';
      queryId: NodeId;
      queryIndex?: number;
      deleteQuery?: boolean;
    }
  | {
      type: 'UPDATE_QUERY_TAB';
      updater: (tab: QueryTab) => QueryTab;
    }
  | {
      type: 'CLOSE_QUERY_PANEL';
    }
  | {
      type: 'UPDATE_QUERY_DRAFT';
      updater: (draft: appDom.QueryNode) => appDom.QueryNode;
    }
  | {
      type: 'SAVE_QUERY_DRAFT';
      draft: appDom.QueryNode;
    }
  | {
      type: 'SET_PAGE_VIEW_TAB';
      tab: PageViewTab;
    }
  | {
      type: 'SELECT_NODE';
      nodeId: NodeId;
    }
  | {
      type: 'DESELECT_NODE';
    }
  | {
      type: 'HOVER_NODE';
      nodeId: NodeId;
    }
  | {
      type: 'BLUR_HOVER_NODE';
    }
  | {
      type: 'SET_HAS_UNSAVED_CHANGES';
      hasUnsavedChanges: boolean;
    }
  | {
      type: 'IGNORE_FORMATTING_ERRORS';
      ignoreFormattingErrors: boolean;
    };

export function domReducer(dom: appDom.AppDom, action: AppStateAction): appDom.AppDom {
  switch (action.type) {
    case 'UPDATE': {
      return action.updater ? action.updater(dom) : dom;
    }
    default:
      return dom;
  }
}

export interface AppState {
  dom: appDom.AppDom;
  appUrl: string;
  savedDom: appDom.AppDom;
  savingDom: boolean;
  unsavedDomChanges: number;
  saveDomError: string | null;
  currentView: DomView;
  undoStack: UndoRedoStackEntry[];
  redoStack: UndoRedoStackEntry[];
  hasUnsavedChanges: boolean;
  ignoreFormattingErrors: boolean;
}

export interface UndoRedoStackEntry {
  dom: appDom.AppDom;
  view: DomView;
  timestamp: number;
}

const UNDO_HISTORY_LIMIT = 100;

export function appStateReducer(state: AppState, action: AppStateAction): AppState {
  if (state.dom) {
    const newDom = domReducer(state.dom, action);
    const hasUnsavedDomChanges = newDom !== state.dom;

    state = update(state, {
      dom: newDom,
      unsavedDomChanges: hasUnsavedDomChanges
        ? state.unsavedDomChanges + 1
        : state.unsavedDomChanges,
    });
  }

  switch (action.type) {
    case 'DOM_SAVING': {
      return update(state, {
        savingDom: true,
        saveDomError: null,
      });
    }
    case 'DOM_SAVED': {
      return update(state, {
        savedDom: action.savedDom,
        savingDom: false,
        saveDomError: null,
        unsavedDomChanges: 0,
      });
    }
    case 'DOM_SAVING_ERROR': {
      return update(state, {
        savingDom: false,
        saveDomError: action.error,
      });
    }
    case 'IGNORE_FORMATTING_ERRORS': {
      return update(state, {
        savingDom: action.ignoreFormattingErrors,
        ignoreFormattingErrors: action.ignoreFormattingErrors,
      });
    }
    case 'DOM_SERVER_UPDATE': {
      if (state.unsavedDomChanges > 0) {
        // Ignore this server update
        return state;
      }

      return update(state, { dom: action.dom, savedDom: action.dom });
    }
    case 'UPDATE_HISTORY': {
      const updatedUndoStack = [
        ...state.undoStack,
        {
          dom: state.dom,
          view: state.currentView,
          timestamp: Date.now(),
        },
      ];

      if (updatedUndoStack.length > UNDO_HISTORY_LIMIT) {
        updatedUndoStack.shift();
      }

      return update(state, {
        undoStack: updatedUndoStack,
        redoStack: [],
      });
    }
    case 'UNDO': {
      const undoStack = [...state.undoStack];
      const redoStack = [...state.redoStack];

      if (undoStack.length < 2) {
        return state;
      }

      const currentState = undoStack.pop();

      const previousStackEntry = undoStack[undoStack.length - 1];

      if (!previousStackEntry || !currentState) {
        return state;
      }

      redoStack.push(currentState);

      return update(state, {
        dom: previousStackEntry.dom,
        currentView: previousStackEntry.view,
        undoStack,
        redoStack,
      });
    }
    case 'REDO': {
      const undoStack = [...state.undoStack];
      const redoStack = [...state.redoStack];

      const nextStackEntry = redoStack.pop();

      if (!nextStackEntry) {
        return state;
      }

      undoStack.push(nextStackEntry);

      return update(state, {
        dom: nextStackEntry.dom,
        currentView: nextStackEntry.view,
        undoStack,
        redoStack,
      });
    }
    case 'SELECT_NODE': {
      if (state.currentView.kind === 'page') {
        return update(state, {
          currentView: {
            ...state.currentView,
            selectedNodeId: action.nodeId,
            pageViewTab: 'component',
          },
        });
      }
      return state;
    }
    case 'DESELECT_NODE': {
      if (state.currentView.kind === 'page') {
        return update(state, {
          currentView: { ...state.currentView, selectedNodeId: null, pageViewTab: 'page' },
        });
      }
      return state;
    }
    case 'HOVER_NODE': {
      if (state.currentView.kind === 'page') {
        return update(state, {
          currentView: { ...state.currentView, hoveredNodeId: action.nodeId },
        });
      }
      return state;
    }
    case 'BLUR_HOVER_NODE': {
      if (state.currentView.kind === 'page') {
        return update(state, {
          currentView: { ...state.currentView, hoveredNodeId: null },
        });
      }
      return state;
    }
    case 'SET_VIEW':
    case 'UPDATE': {
      if (!action.view) {
        return state;
      }

      let newView = action.view;
      if (action.view.kind === 'page') {
        if (typeof action.view.selectedNodeId === 'undefined') {
          const isSameNode = action.view.name === state.currentView.name;

          newView = {
            ...action.view,
            selectedNodeId:
              state.currentView.kind === 'page' && isSameNode
                ? state.currentView.selectedNodeId
                : null,
          };
        }
        if (action.view.selectedNodeId && typeof action.view.pageViewTab === 'undefined') {
          newView = {
            ...action.view,
            pageViewTab: 'component',
          };
        }
      }

      return update(state, {
        currentView: newView,
      });
    }
    case 'SET_PAGE_VIEW_TAB': {
      if (state.currentView.kind === 'page') {
        return update(state, {
          currentView: { ...state.currentView, pageViewTab: action.tab },
        });
      }
      return state;
    }
    case 'SET_HAS_UNSAVED_CHANGES': {
      return update(state, {
        hasUnsavedChanges: action.hasUnsavedChanges,
      });
    }
    case 'SAVE_QUERY_DRAFT': {
      if (state.currentView.kind === 'page' && state.currentView.view?.kind === 'query') {
        const queryTabs = state.currentView.queryPanel?.queryTabs || [];
        const currentTabIndex = state.currentView.queryPanel?.currentTabIndex;
        if (currentTabIndex !== undefined && queryTabs) {
          let newDom = state.dom;
          let nodeName = action.draft.name;
          let target = action.draft;
          // Check if the dom contains this query draft via its id
          try {
            appDom.getNode(state.dom, action.draft.id);
          } catch (err) {
            if (state.currentView?.name) {
              const pageNode = appDom.getPageByName(state.dom, state.currentView.name);
              if (pageNode) {
                newDom = appDom.addNode(state.dom, action.draft, pageNode, 'queries');
                const createdNode = appDom.getNode(newDom, action.draft.id, 'query');
                nodeName = createdNode.name;
                newDom = appDom.saveNode(newDom, createdNode);
                target = createdNode;
              }
            }
          }

          newDom = appDom.saveNode(newDom, target);

          return update(state, {
            currentView: {
              ...state.currentView,
              queryPanel: {
                ...state.currentView.queryPanel,
                queryTabs: state.currentView?.queryPanel?.queryTabs?.map((tab, index) => {
                  if (index === currentTabIndex) {
                    return {
                      ...tab,
                      draft: target,
                      meta: {
                        ...tab.meta,
                        name: nodeName,
                      },
                      saved: target,
                    };
                  }
                  return tab;
                }),
              },
            },
            dom: newDom,
          });
        }
      }
      return state;
    }
    case 'UPDATE_QUERY_DRAFT': {
      if (state.currentView.kind === 'page' && state.currentView.view?.kind === 'query') {
        const queryTabs = state.currentView.queryPanel?.queryTabs || [];
        const currentTabIndex = state.currentView.queryPanel?.currentTabIndex;
        if (currentTabIndex !== undefined && queryTabs) {
          return update(state, {
            currentView: {
              ...state.currentView,
              queryPanel: {
                ...state.currentView.queryPanel,
                queryTabs: state.currentView?.queryPanel?.queryTabs?.map((tab, index) => {
                  if (index === currentTabIndex) {
                    if (action.updater && tab.draft) {
                      return {
                        ...tab,
                        draft: action.updater(tab.draft),
                      };
                    }
                  }
                  return tab;
                }),
              },
            },
          });
        }
      }
      return state;
    }
    case 'CREATE_QUERY_TAB': {
      if (state.currentView.kind !== 'page' || !state.currentView.name) {
        return state;
      }
      // const pageNode = appDom.getNode(state.dom, state.currentView.nodeId, 'page');
      const draftNode = appDom.createNode(state.dom, 'query', {
        name: action.mode === 'mutation' ? 'action' : 'query',
        attributes: {
          query: action.dataSource?.getInitialQueryValue(),
          mode: action.mode ?? undefined,
          connectionId: null,
          dataSource: action?.dataSourceId,
        },
      });

      // const newDom = appDom.addNode(state.dom, draftNode, pageNode, 'queries');
      const newView = { ...state.currentView };
      // const createdNode = newDom.nodes[draftNode.id] as appDom.QueryNode;

      /**
       * To make the app state updates atomic, we must also simultaneously
       * update the dom and the currentView
       */

      /**
       * If tabs are open, simply add the new tab as the latest tab
       */

      if (state.currentView.queryPanel?.queryTabs) {
        newView.view = { kind: 'query', nodeId: draftNode.id };
        newView.queryPanel = {
          queryTabs: [
            ...state.currentView.queryPanel.queryTabs,
            {
              meta: {
                id: draftNode.id,
                name: draftNode.name,
                dataSource: action.dataSourceId,
                mode: draftNode.attributes?.mode,
              },
              saved: draftNode,
              draft: draftNode,
              toolsTabType: 'preview',
              isPreviewLoading: false,
            },
          ],
          currentTabIndex: state.currentView.queryPanel.queryTabs.length,
        };
      } else {
        /**
         * If no tabs are open, initialise the query panel
         */
        newView.view = { kind: 'query', nodeId: draftNode.id };
        newView.queryPanel = {
          queryTabs: [
            {
              meta: {
                id: draftNode.id,
                name: draftNode.name,
                dataSource: action.dataSourceId,
                mode: draftNode.attributes?.mode,
              },
              saved: draftNode,
              draft: draftNode,
              isPreviewLoading: false,
              toolsTabType: 'preview',
            },
          ],
          currentTabIndex: 0,
        };
      }

      return update(state, {
        currentView: newView,
      });
    }
    case 'OPEN_QUERY_TAB': {
      if (state.currentView.kind !== 'page' || !state.currentView.name) {
        return state;
      }
      if (state.currentView.name) {
        /**
         * Selected query is already open, do nothing
         */
        if (
          state.currentView?.view?.kind === 'query' &&
          action.queryId === state.currentView.view?.nodeId
        ) {
          return state;
        }
        /**
         * Selected query is open but not the active tab, set it as active
         * and update the view
         */

        const selectedQueryTabIndex = state?.currentView?.queryPanel?.queryTabs?.findIndex(
          (tab) => {
            return tab.meta.id === action.queryId;
          },
        );

        if (selectedQueryTabIndex !== undefined && selectedQueryTabIndex > -1) {
          return update(state, {
            currentView: update(state.currentView, {
              view: { kind: 'query', nodeId: action.queryId },
              queryPanel: update(state.currentView.queryPanel, {
                currentTabIndex: selectedQueryTabIndex,
              }),
            }),
          });
        }
        /**
         * Selected query is not open, add it as a tab
         * and update the view
         */

        let newTabIndex;
        let newTabs;
        const pageNode = appDom.getPageByName(state.dom, state.currentView.name);
        if (pageNode) {
          const queries = appDom.getChildNodes(state.dom, pageNode).queries ?? [];
          if (queries.length) {
            const selectedQuery = queries?.find((query) => query?.id === action.queryId);
            const newTab: QueryTab = {
              meta: {
                id: action.queryId,
                name: selectedQuery?.name,
                dataSource: selectedQuery?.attributes?.dataSource,
                mode: selectedQuery?.attributes?.mode,
              },
              saved: selectedQuery,
              draft: selectedQuery,
              toolsTabType: 'preview',
              isPreviewLoading: false,
            };

            /**
             * If no tabs are open, set the currentTabIndex to 0
             */
            if (
              !state.currentView?.queryPanel?.queryTabs ||
              state?.currentView?.queryPanel?.queryTabs?.length === 0
            ) {
              newTabIndex = 0;
              newTabs = [newTab];
            } else {
              /*
               * If tabs are open, set the currentTabIndex to the next index
               */
              newTabIndex = state.currentView?.queryPanel.queryTabs.length;
              newTabs = [...state.currentView.queryPanel.queryTabs, newTab];
            }
            return update(state, {
              currentView: {
                ...state.currentView,
                view: { kind: 'query', nodeId: action.queryId },
                queryPanel: {
                  currentTabIndex: newTabIndex,
                  queryTabs: newTabs,
                },
              },
            });
          }
        }
      }
      return state;
    }
    case 'UPDATE_QUERY_TAB': {
      if (state.currentView.kind !== 'page' || !state.currentView.name) {
        return state;
      }

      return update(state, {
        currentView: {
          ...state.currentView,
          queryPanel: {
            ...state.currentView.queryPanel,
            queryTabs: state.currentView.queryPanel?.queryTabs?.map((tab, index) => {
              if (index === state.currentView.queryPanel?.currentTabIndex) {
                return action.updater ? action.updater(tab) : tab;
              }
              return tab;
            }),
          },
        },
      });
    }
    case 'CLOSE_QUERY_TAB': {
      if (state.currentView.kind !== 'page' || !state.currentView.name) {
        return state;
      }

      const tabs = state.currentView.queryPanel?.queryTabs;
      const newView = { ...state.currentView };
      const newTabs = tabs?.filter((tab) => tab.meta.id !== action.queryId);
      let newDom = state.dom;

      if (tabs && action.queryId !== undefined) {
        /*
         * if this is the only tab,
         * remove the tab and set the view to the page
         */
        if (tabs.length === 1) {
          newView.view = undefined;
          newView.queryPanel = {
            queryTabs: undefined,
            currentTabIndex: undefined,
          };
        }
      }

      const currentTabIndex = state.currentView.queryPanel?.currentTabIndex;

      if (currentTabIndex !== undefined && action.queryId && action.queryIndex !== undefined) {
        /*
         * if the query being closed is not the one open,
         * decrement the current tab index if it is greater than the index of the tab being closed
         */
        if (action.queryIndex !== currentTabIndex) {
          const newTabIndex =
            currentTabIndex > action.queryIndex ? currentTabIndex - 1 : currentTabIndex;
          newView.queryPanel = {
            queryTabs: newTabs,
            currentTabIndex: newTabIndex,
          };
        }
        // if there are multiple tabs open, and
        // the query being closed is the one open,
        // select the previous tab, or the next tab if there is no previous tab
        else {
          const queryIds = tabs?.map((tab) => tab.meta.id);

          const replacementQueryId =
            queryIds?.[action.queryIndex === 0 ? currentTabIndex + 1 : currentTabIndex - 1];
          const replacementTabIndex =
            action.queryIndex === 0 ? currentTabIndex : currentTabIndex - 1;
          if (replacementQueryId) {
            newView.view = { kind: 'query', nodeId: replacementQueryId };
            newView.queryPanel = {
              queryTabs: newTabs,
              currentTabIndex: replacementTabIndex,
            };
          }
        }
      }

      // If a delete action is also involved, remove the query from the dom
      if (action.deleteQuery) {
        newDom = appDom.removeNode(state.dom, action.queryId);
      }

      return update(state, {
        dom: newDom,
        currentView: newView,
      });
    }
    case 'CLOSE_QUERY_PANEL': {
      if (state.currentView.kind === 'page') {
        return update(state, {
          currentView: {
            ...state.currentView,
            view: undefined,
            queryPanel: undefined,
          },
        });
      }
      return state;
    }
    default:
      return state;
  }
}

function createDomApi(dispatch: React.Dispatch<AppStateAction>) {
  return {
    update(updater: (dom: appDom.AppDom) => appDom.AppDom) {
      dispatch({
        type: 'UPDATE',
        updater,
      });
    },
    setNodeName(nodeId: NodeId, name: string) {
      dispatch({
        type: 'UPDATE',
        updater(dom) {
          const node = appDom.getNode(dom, nodeId);
          return appDom.setNodeName(dom, node, name);
        },
      });
    },
    saveNode(node: appDom.AppDomNode) {
      dispatch({
        type: 'UPDATE',
        updater(dom) {
          return appDom.saveNode(dom, node);
        },
      });
    },
  };
}

function createAppStateApi(
  dispatch: React.Dispatch<AppStateAction>,
  scheduleTextInputHistoryUpdate?: DebouncedFunc<() => void>,
) {
  return {
    update(updater: (dom: appDom.AppDom) => appDom.AppDom, view?: DomView) {
      dispatch({
        type: 'UPDATE',
        updater,
        view,
      });
    },
    undo() {
      scheduleTextInputHistoryUpdate?.flush();

      dispatch({ type: 'UNDO' });
    },
    redo() {
      dispatch({ type: 'REDO' });
    },
    setView(view: DomView) {
      dispatch({
        type: 'SET_VIEW',
        view,
      });
    },
    setPageViewTab(tab: PageViewTab) {
      dispatch({
        type: 'SET_PAGE_VIEW_TAB',
        tab,
      });
    },
    selectNode(nodeId: NodeId) {
      dispatch({
        type: 'SELECT_NODE',
        nodeId,
      });
    },
    hoverNode(nodeId: NodeId) {
      dispatch({
        type: 'HOVER_NODE',
        nodeId,
      });
    },
    blurHoverNode() {
      dispatch({
        type: 'BLUR_HOVER_NODE',
      });
    },
    deselectNode() {
      dispatch({
        type: 'DESELECT_NODE',
      });
    },
    setHasUnsavedChanges(hasUnsavedChanges: boolean) {
      dispatch({
        type: 'SET_HAS_UNSAVED_CHANGES',
        hasUnsavedChanges,
      });
    },
    openQueryTab(queryId: NodeId) {
      dispatch({
        type: 'OPEN_QUERY_TAB',
        queryId,
      });
    },
    createQueryTab(dataSource: ClientDataSource, dataSourceId: string, mode?: appDom.FetchMode) {
      dispatch({
        type: 'CREATE_QUERY_TAB',
        dataSource,
        dataSourceId,
        mode,
      });
    },
    updateQueryTab(updater: (tab: QueryTab) => QueryTab) {
      dispatch({
        type: 'UPDATE_QUERY_TAB',
        updater,
      });
    },
    closeQueryTab(queryId: NodeId, queryIndex?: number, deleteQuery?: boolean) {
      dispatch({
        type: 'CLOSE_QUERY_TAB',
        queryId,
        queryIndex,
        deleteQuery,
      });
    },
    closeQueryPanel() {
      dispatch({
        type: 'CLOSE_QUERY_PANEL',
      });
    },
    updateQueryDraft(updater: (draft: appDom.QueryNode) => appDom.QueryNode) {
      dispatch({
        type: 'UPDATE_QUERY_DRAFT',
        updater,
      });
    },
    saveQueryDraft(draft: appDom.QueryNode) {
      dispatch({
        type: 'SAVE_QUERY_DRAFT',
        draft,
      });
    },
  };
}

export const [useAppStateContext, AppStateProvider] = createProvidedContext<AppState>('AppState');

export function useAppState(): AppState {
  return useAppStateContext();
}

const DomApiContext = React.createContext<DomApi>(createDomApi(() => undefined));

export type DomApi = ReturnType<typeof createDomApi>;

export function useDomApi(): DomApi {
  return React.useContext(DomApiContext);
}

const AppStateApiContext = React.createContext<AppStateApi>(createAppStateApi(() => undefined));

export type AppStateApi = ReturnType<typeof createAppStateApi>;

export function useAppStateApi(): AppStateApi {
  return React.useContext(AppStateApiContext);
}

let previousUnsavedChanges = 0;
function logUnsavedChanges(unsavedChanges: number) {
  const hasUnsavedChanges = unsavedChanges >= 1;

  if (!hasUnsavedChanges && previousUnsavedChanges > 0) {
    // eslint-disable-next-line no-console
    console.log(`${previousUnsavedChanges} changes saved.`);
  }

  previousUnsavedChanges = unsavedChanges;
}

type AppStateActionType = AppStateAction['type'];

const UNDOABLE_ACTIONS = new Set<AppStateActionType>([
  'UPDATE',
  'SET_VIEW',
  'SET_PAGE_VIEW_TAB',
  'SELECT_NODE',
  'DESELECT_NODE',
  'UPDATE_QUERY_DRAFT',
  'OPEN_QUERY_TAB',
  'CREATE_QUERY_TAB',
  'CLOSE_QUERY_TAB',
]);

function isCancellableAction(action: AppStateAction): boolean {
  return Boolean(
    action.type === 'SET_VIEW' ||
      (action.type === 'UPDATE' && action.view) ||
      (action.type === 'UPDATE_QUERY_DRAFT' && action.updater),
  );
}

export interface DomContextProps {
  appUrl: string;
  children?: React.ReactNode;
}

export default function AppProvider({ appUrl, children }: DomContextProps) {
  const projectApi = useProjectApi();
  const { data: dom } = projectApi.useSuspenseQuery('loadDom', []);

  invariant(dom, 'Suspense should load the dom');

  const location = useLocation();

  const app = appDom.getApp(dom);
  const { pages = [] } = appDom.getChildNodes(dom, app);
  const firstPage = pages.length > 0 ? pages[0] : null;

  const initialView: DomView = getViewFromPathname(location.pathname) || {
    kind: 'page',
    name: firstPage?.name,
    selectedNodeId: null,
    pageViewTab: 'page',
  };

  const [state, dispatch] = React.useReducer(appStateReducer, {
    // DOM state
    dom,
    // base path of the running application
    appUrl,
    // DOM loader state
    savingDom: false,
    unsavedDomChanges: 0,
    saveDomError: null,
    savedDom: dom,
    ignoreFormattingErrors: false,
    // App state
    currentView: initialView,
    undoStack: [
      {
        dom,
        view: initialView,
        timestamp: Date.now(),
      },
    ],
    redoStack: [],
    hasUnsavedChanges: false,
  });

  React.useEffect(() => {
    dispatch({
      type: 'DOM_SERVER_UPDATE',
      dom,
    });
  }, [dom]);

  const scheduleTextInputHistoryUpdate = React.useMemo(
    () =>
      debounce(() => {
        dispatch({ type: 'UPDATE_HISTORY' });
      }, 500),
    [],
  );

  const dispatchWithHistory = useEventCallback((action: AppStateAction) => {
    if (state.hasUnsavedChanges && isCancellableAction(action)) {
      // eslint-disable-next-line no-alert
      const ok = window.confirm(
        'You have unsaved changes. Are you sure you want to navigate away? All changes will be discarded.',
      );

      if (!ok) {
        return;
      }
    }

    dispatch(action);

    if (UNDOABLE_ACTIONS.has(action.type)) {
      if (hasFieldFocus()) {
        scheduleTextInputHistoryUpdate();
      } else {
        dispatch({ type: 'UPDATE_HISTORY' });
      }
    }
  });

  const domApi = React.useMemo(() => createDomApi(dispatchWithHistory), [dispatchWithHistory]);
  const appStateApi = React.useMemo(
    () => createAppStateApi(dispatchWithHistory, scheduleTextInputHistoryUpdate),
    [dispatchWithHistory, scheduleTextInputHistoryUpdate],
  );

  const handleSave = React.useCallback(() => {
    if (!state.dom || state.savingDom || state.savedDom === state.dom) {
      return;
    }

    const domToSave = state.dom;
    dispatch({ type: 'DOM_SAVING' });
    const domDiff = appDom.createDiff(state.savedDom, domToSave);
    projectApi.methods
      .applyDomDiff(domDiff)
      .then(() => {
        dispatch({ type: 'DOM_SAVED', savedDom: domToSave });
      })
      .catch((err) => {
        console.error(`Failed to save the dom: ${err.message}`);
        if (err.code === 'FPRMATTINGERRORS') {
          dispatch({ type: 'DOM_SAVING_ERROR', error: err.message });
        }
      });
  }, [projectApi, state]);

  const debouncedHandleSave = useDebouncedHandler(handleSave, 100);

  React.useEffect(() => {
    debouncedHandleSave();
  }, [state.dom, debouncedHandleSave]);

  React.useEffect(() => {
    logUnsavedChanges(state.unsavedDomChanges);

    if (state.unsavedDomChanges <= 0 && !state.hasUnsavedChanges) {
      return () => {};
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = `You have unsaved changes. Are you sure you want to navigate away?`;
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [state.hasUnsavedChanges, state.unsavedDomChanges]);

  useShortcut({ key: 's', metaKey: true }, handleSave);

  return (
    <AppStateProvider value={state}>
      <AppStateApiContext.Provider value={appStateApi}>
        <DomApiContext.Provider value={domApi}>{children}</DomApiContext.Provider>
      </AppStateApiContext.Provider>
    </AppStateProvider>
  );
}
