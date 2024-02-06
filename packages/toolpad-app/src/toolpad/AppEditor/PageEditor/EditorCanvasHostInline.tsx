import * as React from 'react';
import { styled } from '@mui/material';
import { NodeHashes } from '@mui/toolpad-core';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import * as ReactDOM from 'react-dom';
import { Route, Routes } from 'react-router-dom';
import { Emitter } from '@mui/toolpad-utils/events';
import { update } from '@mui/toolpad-utils/immutability';
import { throttle } from 'lodash-es';
import invariant from 'invariant';
import { createCommands, type ToolpadBridge } from '../../../canvas/ToolpadBridge';
import { useProject } from '../../../project';
import { RuntimeState } from '../../../runtime';
import { AppHost, AppHostContext } from '../../../runtime/AppHostContext';
import ToolpadApp from '../../../runtime/ToolpadApp';
import { CanvasHooks, CanvasHooksContext } from '../../../runtime/CanvasHooksContext';
import { rectContainsPoint } from '../../../utils/geometry';
import { queryClient } from '../../../runtime/api';
import { PageViewState } from '../../../types';
import { updateNodeInfo } from '../../../canvas';

interface OverlayProps {
  children?: React.ReactNode;
  container: HTMLElement;
}

function Overlay(props: OverlayProps) {
  const { children, container } = props;

  const cache = React.useMemo(
    () =>
      createCache({
        key: `toolpad-editor-overlay`,
        prepend: true,
        container,
      }),
    [container],
  );

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}

export interface EditorCanvasHostProps {
  className?: string;
  runtimeState: RuntimeState;
  savedNodes: NodeHashes;
  overlay?: React.ReactNode;
  onInit?: (bridge: ToolpadBridge) => void;
  base: string;
}

const CanvasRoot = styled('div')({
  width: '100%',
  position: 'relative',
});

const CanvasFrame = styled('iframe')({
  border: 'none',
  position: 'absolute',
  width: '100%',
  height: '100%',
});

const appHost: AppHost = {
  isPreview: true,
  isCustomServer: false,
  isCanvas: true,
};

export default function EditorCanvasHost({
  className,
  runtimeState,
  base,
  savedNodes,
  overlay,
  onInit,
}: EditorCanvasHostProps) {
  const project = useProject();

  const [editorOverlayRoot, setEditorOverlayRoot] = React.useState<HTMLElement | null>(null);

  const state = React.useMemo(() => ({ ...runtimeState, savedNodes }), [runtimeState, savedNodes]);

  const [portal, setPortal] = React.useState<HTMLElement | null>(null);

  const handleIframeLoad = React.useCallback<React.ReactEventHandler<HTMLIFrameElement>>(
    (event) => {
      invariant(event.currentTarget.contentDocument, 'iframe contentDocument is not available');
      const root = event.currentTarget.contentDocument.getElementById('root');
      invariant(root, 'root element not found');
      setPortal(root);
    },
    [],
  );

  const viewState = React.useRef<PageViewState>({ nodes: {} });

  const canvasHooks: CanvasHooks = React.useMemo(
    () => ({
      overlayRef: setEditorOverlayRoot,
      savedNodes,
      registerNode: (node, props, componentConfig) => {
        viewState.current.nodes[node.id] = {
          nodeId: node.id,
          props,
          componentConfig,
        };

        return () => {
          delete viewState.current.nodes[node.id];
        };
      },
    }),
    [savedNodes],
  );

  const appRootRef = React.useRef<HTMLDivElement>();
  const appRootCleanupRef = React.useRef<() => void>();
  const projectEventSubscriptionRef = React.useRef<() => void>();
  const onAppRoot = React.useCallback(
    (appRoot: HTMLDivElement) => {
      appRootCleanupRef.current?.();
      appRootCleanupRef.current = undefined;

      if (!appRoot) {
        return;
      }

      const bridge: ToolpadBridge = {
        editorEvents: new Emitter(),
        editorCommands: createCommands(),
        canvasEvents: new Emitter(),
        canvasCommands: createCommands({
          isReady: () => true,
          getPageViewState: () => {
            let nodes = viewState.current.nodes;

            for (const [nodeId, nodeInfo] of Object.entries(nodes)) {
              nodes = update(nodes, {
                [nodeId]: updateNodeInfo(nodeInfo, appRoot),
              });
            }

            return { nodes };
          },
          getViewCoordinates: (clientX: number, clientY: number) => {
            const rect = appRoot.getBoundingClientRect();
            if (rectContainsPoint(rect, clientX, clientY)) {
              return { x: clientX - rect.x, y: clientY - rect.y };
            }
            return null;
          },
          invalidateQueries: () => {
            queryClient.invalidateQueries();
          },
          update: () => {},
        }),
      } satisfies ToolpadBridge;

      const handleScreenUpdate = throttle(
        () => {
          bridge?.canvasEvents.emit('screenUpdate', {});
        },
        50,
        { trailing: true },
      );

      projectEventSubscriptionRef.current = project.events.subscribe('queriesInvalidated', () => {
        bridge.canvasCommands.invalidateQueries();
      });

      appRootRef.current = appRoot;

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

      appRootCleanupRef.current = () => {
        handleScreenUpdate.cancel();
        mutationObserver.disconnect();
        resizeObserver.disconnect();
      };

      onInit?.(bridge);
    },
    [onInit, project.events],
  );

  React.useEffect(
    () => () => {
      appRootCleanupRef.current?.();
      appRootCleanupRef.current = undefined;
      projectEventSubscriptionRef.current?.();
      projectEventSubscriptionRef.current = undefined;
    },
    [],
  );

  return (
    <CanvasRoot className={className}>
      <CanvasFrame srcDoc={`<!DOCTYPE html><div id="root"></div>`} onLoad={handleIframeLoad} />
      {portal
        ? ReactDOM.createPortal(
            <Overlay container={portal}>
              <CanvasHooksContext.Provider value={canvasHooks}>
                <AppHostContext.Provider value={appHost}>
                  <Routes>
                    <Route
                      path="/app/*"
                      element={
                        <ToolpadApp
                          rootRef={onAppRoot}
                          basename={'/_toolpad/app'}
                          state={state}
                          apiUrl={`${base}/api/runtime-rpc`}
                        />
                      }
                    />
                  </Routes>
                </AppHostContext.Provider>
              </CanvasHooksContext.Provider>
            </Overlay>,
            portal,
          )
        : null}
      {editorOverlayRoot
        ? ReactDOM.createPortal(
            <Overlay container={editorOverlayRoot}>{overlay}</Overlay>,
            editorOverlayRoot,
          )
        : null}
    </CanvasRoot>
  );
}
