import * as React from 'react';
import { styled } from '@mui/material';
import { RuntimeEvent, NodeId } from '@mui/toolpad-core';
import { useNavigate } from 'react-router-dom';
import invariant from 'invariant';
import * as appDom from '../../../../appDom';
import EditorCanvasHost, { EditorCanvasHostHandle } from '../EditorCanvasHost';
import { getSavedNodes, useDom, useDomApi, useDomLoader } from '../../../DomLoader';
import { usePageEditorApi, usePageEditorState } from '../PageEditorProvider';
import RenderOverlay from './RenderOverlay';

const classes = {
  view: 'Toolpad_View',
};

const RenderPanelRoot = styled('div')({
  position: 'relative',
  overflow: 'hidden',

  [`& .${classes.view}`]: {
    height: '100%',
  },
});

export interface RenderPanelProps {
  className?: string;
}

export default function RenderPanel({ className }: RenderPanelProps) {
  const domLoader = useDomLoader();
  const dom = useDom();
  const domApi = useDomApi();
  const api = usePageEditorApi();
  const { appId, nodeId: pageNodeId } = usePageEditorState();

  const canvasHostRef = React.useRef<EditorCanvasHostHandle>(null);

  const navigate = useNavigate();

  const savedNodes = React.useMemo(
    () => getSavedNodes(domLoader.dom, domLoader.savedDom),
    [domLoader.dom, domLoader.savedDom],
  );

  const handleRuntimeEvent = React.useCallback(
    (event: RuntimeEvent) => {
      switch (event.type) {
        case 'propUpdated': {
          const node = appDom.getNode(dom, event.nodeId as NodeId, 'element');
          const actual = node.props?.[event.prop];
          if (actual && actual.type !== 'const') {
            console.warn(`Can't update a non-const prop "${event.prop}" on node "${node.id}"`);
            return;
          }

          const newValue: unknown =
            typeof event.value === 'function' ? event.value(actual?.value) : event.value;

          domApi.setNodeNamespacedProp(node, 'props', event.prop, {
            type: 'const',
            value: newValue,
          });
          return;
        }
        case 'pageStateUpdated': {
          api.pageStateUpdate(event.pageState);
          return;
        }
        case 'pageBindingsUpdated': {
          api.pageBindingsUpdate(event.bindings);
          return;
        }
        case 'screenUpdate': {
          invariant(canvasHostRef.current, 'canvas ref not attached');
          const pageViewState = canvasHostRef.current?.getPageViewState();
          api.pageViewStateUpdate(pageViewState);
          return;
        }
        case 'pageNavigationRequest': {
          navigate(`../pages/${event.pageNodeId}`);
          return;
        }
        default:
          throw new Error(
            `received unrecognized event "${(event as RuntimeEvent).type}" from editor runtime`,
          );
      }
    },
    [dom, domApi, api, navigate],
  );

  return (
    <RenderPanelRoot className={className}>
      <EditorCanvasHost
        ref={canvasHostRef}
        appId={appId}
        className={classes.view}
        dom={dom}
        savedNodes={savedNodes}
        pageNodeId={pageNodeId}
        onRuntimeEvent={handleRuntimeEvent}
        overlay={<RenderOverlay canvasHostRef={canvasHostRef} />}
      />
    </RenderPanelRoot>
  );
}
