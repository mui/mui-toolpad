import * as React from 'react';
import { fireEvent } from '@mui/toolpad-core/runtime';
import invariant from 'invariant';
import { throttle } from 'lodash-es';
import ToolpadApp, { CanvasHooks, CanvasHooksContext } from '../runtime';
import * as appDom from '../appDom';
import { PageViewState } from '../types';
import getPageViewState from './getPageViewState';
import { rectContainsPoint } from '../utils/geometry';

export interface AppCanvasState {
  appId: string;
  dom: appDom.RenderTree;
}

export interface ToolpadBridge {
  update(updates: AppCanvasState): void;
  getViewCoordinates(clientX: number, clientY: number): { x: number; y: number } | null;
  getPageViewState(): PageViewState;
}

declare global {
  interface Window {
    __TOOLPAD_BRIDGE__?: ToolpadBridge | ((bridge: ToolpadBridge) => void);
  }
}

const handleScreenUpdate = throttle(() => fireEvent({ type: 'screenUpdate' }), 50, {
  trailing: true,
});

export interface AppCanvasProps {
  basename: string;
}

export default function AppCanvas({ basename }: AppCanvasProps) {
  const [state, setState] = React.useState<AppCanvasState | null>(null);

  const rootRef = React.useRef<HTMLDivElement>();

  const [appRoot, setAppRoot] = React.useState<HTMLDivElement | null>(null);

  // Notify host after every render
  React.useEffect(handleScreenUpdate);

  React.useEffect(() => {
    if (!appRoot) {
      return () => {};
    }

    rootRef.current = appRoot;

    const mutationObserver = new MutationObserver(handleScreenUpdate);

    mutationObserver.observe(appRoot, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    });

    const resizeObserver = new ResizeObserver(handleScreenUpdate);

    resizeObserver.observe(appRoot);
    appRoot.querySelectorAll('*').forEach((elm) => resizeObserver.observe(elm));

    return () => {
      handleScreenUpdate.cancel();
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [appRoot]);

  React.useEffect(() => {
    const bridge: ToolpadBridge = {
      update: (newState) => {
        React.startTransition(() => {
          setState(newState);
        });
      },
      getPageViewState: () => {
        invariant(rootRef.current, 'App ref not attached');
        return getPageViewState(rootRef.current);
      },
      getViewCoordinates(clientX, clientY) {
        if (!rootRef.current) {
          return null;
        }
        const rect = rootRef.current.getBoundingClientRect();
        if (rectContainsPoint(rect, clientX, clientY)) {
          return { x: clientX - rect.x, y: clientY - rect.y };
        }
        return null;
      },
    };

    // eslint-disable-next-line no-underscore-dangle
    if (typeof window.__TOOLPAD_BRIDGE__ === 'function') {
      // eslint-disable-next-line no-underscore-dangle
      window.__TOOLPAD_BRIDGE__(bridge);
    } else {
      // eslint-disable-next-line no-underscore-dangle
      window.__TOOLPAD_BRIDGE__ = bridge;
    }

    return () => {};
  }, []);

  const editorHooks: CanvasHooks = React.useMemo(() => {
    return {
      navigateToPage(pageNodeId) {
        fireEvent({ type: 'pageNavigationRequest', pageNodeId });
      },
    };
  }, []);

  return state ? (
    <CanvasHooksContext.Provider value={editorHooks}>
      <ToolpadApp
        rootRef={setAppRoot}
        hidePreviewBanner
        dom={state.dom}
        version="preview"
        appId={state.appId}
        basename={`${basename}/${state.appId}`}
      />
    </CanvasHooksContext.Provider>
  ) : (
    <div>loading...</div>
  );
}
