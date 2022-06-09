import * as React from 'react';
import { Box, CircularProgress, styled } from '@mui/material';
import { NodeId } from '../../../types';
import * as appDom from '../../../appDom';
import { HTML_ID_APP_ROOT } from '../../../constants';
import { rectContainsPoint } from '../../../utils/geometry';

export interface EditorCanvasHostHandle {
  getRootElm(): HTMLElement | null;
  getViewCoordinates(clientX: number, clientY: number): { x: number; y: number } | null;
}

export interface EditorCanvasHostProps {
  className?: string;
  onLoad?: (window: Window) => void;
  appId: string;
  pageNodeId: NodeId;
  // TODO: Remove these when we get rid of PageView
  // eslint-disable-next-line react/no-unused-prop-types
  editor?: boolean;
  dom: appDom.AppDom;
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

export default React.forwardRef<EditorCanvasHostHandle, EditorCanvasHostProps>(
  function EditorCanvasHost({ appId, className, pageNodeId, onLoad, dom }, forwardedRef) {
    const frameRef = React.useRef<HTMLIFrameElement>(null);

    const update = React.useCallback(() => {
      const renderDom = appDom.createRenderTree(dom);
      // eslint-disable-next-line no-underscore-dangle
      frameRef.current?.contentWindow?.__TOOLPAD_BRIDGE__?.update({
        appId,
        dom: renderDom,
      });
    }, [appId, dom]);
    React.useEffect(() => update(), [update]);

    const onReadyRef = React.useRef((window: Window) => {
      update();
      onLoad?.(window);
    });
    React.useEffect(() => {
      onReadyRef.current = (window: Window) => {
        update();
        onLoad?.(window);
      };
    }, [update, onLoad]);

    React.useEffect(() => {
      const frameWindow = frameRef.current?.contentWindow;
      if (!frameWindow) {
        throw new Error('Iframe ref not attached');
      }

      // eslint-disable-next-line no-underscore-dangle
      if (frameWindow.__TOOLPAD_READY__ === true) {
        onReadyRef.current?.(frameWindow);
        // eslint-disable-next-line no-underscore-dangle
      } else if (typeof frameWindow.__TOOLPAD_READY__ !== 'function') {
        // eslint-disable-next-line no-underscore-dangle
        frameWindow.__TOOLPAD_READY__ = () => onReadyRef.current?.(frameWindow);
      }
    }, []);

    React.useImperativeHandle(
      forwardedRef,
      () => {
        const getRootElm = () => {
          return frameRef.current?.contentDocument?.getElementById(HTML_ID_APP_ROOT) || null;
        };
        return {
          getRootElm,
          getViewCoordinates(clientX, clientY) {
            const rootElm = getRootElm();
            if (!rootElm) {
              return null;
            }
            const rect = rootElm.getBoundingClientRect();
            if (rectContainsPoint(rect, clientX, clientY)) {
              return { x: clientX - rect.x, y: clientY - rect.y };
            }
            return null;
          },
        };
      },
      [],
    );

    return (
      <CanvasRoot className={className}>
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
        <CanvasFrame
          ref={frameRef}
          src={`/app-canvas/${appId}/pages/${pageNodeId}`}
          // Used by the runtime to know when to load react devtools
          data-toolpad-canvas
        />
      </CanvasRoot>
    );
  },
);
