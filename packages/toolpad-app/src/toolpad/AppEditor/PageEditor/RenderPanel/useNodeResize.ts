import React from 'react';
import { NodeId } from '@mui/toolpad-core';

import * as appDom from '../../../../appDom';
import {
  RectangleEdge,
  RECTANGLE_EDGE_LEFT,
  RECTANGLE_EDGE_RIGHT,
} from '../../../../utils/geometry';
import { isPageRow } from '../../../../toolpadComponents';
import { useDom, useDomApi } from '../../../DomLoader';
import { OverlayGridHandle } from './OverlayGrid';
import { usePageEditorApi, usePageEditorState } from '../PageEditorProvider';
import { EditorCanvasHostHandle } from '../EditorCanvasHost';

const RESIZE_SNAP_UNITS = 4; // px
const SNAP_TO_GRID_COLUMN_MARGIN = 10; // px

interface UseNodeResizeProps {
  pageNodes: appDom.AppDomNode[];
  getCurrentlyDraggedNode: () => appDom.ElementNode | null;
  canvasHostRef: React.RefObject<EditorCanvasHostHandle>;
  overlayGridRef: React.MutableRefObject<OverlayGridHandle>;
}

interface UseNodeResizePayload {
  resizePreviewElementRef: React.MutableRefObject<HTMLDivElement | null>;
  handleEdgeDragStart: (
    node: appDom.ElementNode,
    edge: RectangleEdge,
  ) => (event: React.MouseEvent<HTMLElement>) => void;
  handleEdgeDragOver: (event: React.MouseEvent<Element>) => void;
  handleEdgeDragEnd: (event: React.MouseEvent<Element>) => void;
}

export function useNodeResize({
  pageNodes,
  getCurrentlyDraggedNode,
  overlayGridRef,
  canvasHostRef,
}: UseNodeResizeProps): UseNodeResizePayload {
  const dom = useDom();
  const domApi = useDomApi();
  const api = usePageEditorApi();
  const { viewState, draggedEdge } = usePageEditorState();

  const { nodes: nodesInfo } = viewState;

  const normalizePageRowColumnSizes = React.useCallback(
    (pageRowNode: appDom.ElementNode): number[] => {
      const children = appDom.getChildNodes(dom, pageRowNode).children;

      const layoutColumnSizes = children.map((child) => child.layout?.columnSize?.value || 1);
      const totalLayoutColumnSizes = layoutColumnSizes.reduce((acc, size) => acc + size, 0);

      const normalizedLayoutColumnSizes = layoutColumnSizes.map(
        (size) => (size * children.length) / totalLayoutColumnSizes,
      );

      children.forEach((child, childIndex) => {
        if (child.layout?.columnSize) {
          domApi.setNodeNamespacedProp(
            child,
            'layout',
            'columnSize',
            appDom.createConst(normalizedLayoutColumnSizes[childIndex]),
          );
        }
      });

      return normalizedLayoutColumnSizes;
    },
    [dom, domApi],
  );

  const previousRowColumnCountsRef = React.useRef<Record<NodeId, number>>({});

  React.useEffect(() => {
    pageNodes.forEach((node: appDom.AppDomNode) => {
      if (appDom.isElement(node) && isPageRow(node)) {
        const children = appDom.getChildNodes(dom, node).children;
        const childrenCount = children.length;

        if (childrenCount < previousRowColumnCountsRef.current[node.id]) {
          normalizePageRowColumnSizes(node);
        }

        previousRowColumnCountsRef.current[node.id] = childrenCount;
      }
    });
  }, [dom, normalizePageRowColumnSizes, pageNodes]);

  const resizePreviewElementRef = React.useRef<HTMLDivElement | null>(null);
  const resizePreviewElement = resizePreviewElementRef.current;

  const handleEdgeDragStart = React.useCallback(
    (node: appDom.ElementNode, edge: RectangleEdge) => (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();

      api.edgeDragStart({ nodeId: node.id, edge });

      api.select(node.id);
    },
    [api],
  );

  const handleEdgeDragOver = React.useCallback(
    (event: React.MouseEvent<Element>) => {
      const draggedNode = getCurrentlyDraggedNode();

      if (!draggedNode) {
        return;
      }

      const draggedNodeInfo = nodesInfo[draggedNode.id];
      const draggedNodeRect = draggedNodeInfo?.rect;

      const parent = draggedNode && appDom.getParent(dom, draggedNode);

      const parentInfo = parent ? nodesInfo[parent.id] : null;
      const parentRect = parentInfo?.rect;

      const cursorPos = canvasHostRef.current?.getViewCoordinates(event.clientX, event.clientY);

      if (draggedNodeRect && parentRect && resizePreviewElement && cursorPos) {
        let snappedToGridCursorPosX =
          Math.round(cursorPos.x / RESIZE_SNAP_UNITS) * RESIZE_SNAP_UNITS;

        const activeSnapGridColumnEdges =
          draggedEdge === RECTANGLE_EDGE_LEFT
            ? overlayGridRef.current.getLeftColumnEdges()
            : overlayGridRef.current.getRightColumnEdges();

        for (const gridColumnEdge of activeSnapGridColumnEdges) {
          if (Math.abs(gridColumnEdge - cursorPos.x) <= SNAP_TO_GRID_COLUMN_MARGIN) {
            snappedToGridCursorPosX = gridColumnEdge;
          }
        }

        const minGridColumnWidth = overlayGridRef.current.getMinColumnWidth();

        if (
          draggedEdge === RECTANGLE_EDGE_LEFT &&
          cursorPos.x > parentRect.x + minGridColumnWidth &&
          cursorPos.x < draggedNodeRect.x + draggedNodeRect.width - minGridColumnWidth
        ) {
          const updatedTransformScale =
            1 + (draggedNodeRect.x - snappedToGridCursorPosX) / draggedNodeRect.width;

          resizePreviewElement.style.transformOrigin = '100% 50%';
          resizePreviewElement.style.transform = `scale(${updatedTransformScale}, 1)`;
        }
        if (
          draggedEdge === RECTANGLE_EDGE_RIGHT &&
          cursorPos.x > draggedNodeRect.x + minGridColumnWidth &&
          cursorPos.x < parentRect.x + parentRect.width - minGridColumnWidth
        ) {
          const updatedTransformScale =
            (snappedToGridCursorPosX - draggedNodeRect.x) / draggedNodeRect.width;

          resizePreviewElement.style.transformOrigin = '0 50%';
          resizePreviewElement.style.transform = `scale(${updatedTransformScale}, 1)`;
        }
      }
    },
    [
      canvasHostRef,
      dom,
      draggedEdge,
      getCurrentlyDraggedNode,
      nodesInfo,
      overlayGridRef,
      resizePreviewElement,
    ],
  );

  const handleEdgeDragEnd = React.useCallback(
    (event: React.MouseEvent<Element>) => {
      event.preventDefault();

      const draggedNode = getCurrentlyDraggedNode();

      if (!draggedNode) {
        return;
      }

      const draggedNodeInfo = nodesInfo[draggedNode.id];
      const draggedNodeRect = draggedNodeInfo?.rect;

      const parent = appDom.getParent(dom, draggedNode);

      const parentChildren = parent ? appDom.getChildNodes(dom, parent).children : [];
      const totalLayoutColumnSizes = parentChildren.reduce(
        (acc, child) => acc + (nodesInfo[child.id]?.rect?.width || 0),
        0,
      );

      const resizePreviewRect = resizePreviewElement?.getBoundingClientRect();

      if (draggedNodeRect && resizePreviewRect) {
        const normalizeColumnSize = (size: number) =>
          Math.max(0, size * parentChildren.length) / totalLayoutColumnSizes;

        if (draggedEdge === RECTANGLE_EDGE_LEFT) {
          const previousSibling = appDom.getSiblingBeforeNode(dom, draggedNode, 'children');

          if (previousSibling) {
            const previousSiblingInfo = nodesInfo[previousSibling.id];
            const previousSiblingRect = previousSiblingInfo?.rect;

            if (previousSiblingRect) {
              const updatedDraggedNodeColumnSize = normalizeColumnSize(resizePreviewRect.width);
              const updatedPreviousSiblingColumnSize = normalizeColumnSize(
                previousSiblingRect.width - (resizePreviewRect.width - draggedNodeRect.width),
              );

              domApi.setNodeNamespacedProp(
                draggedNode,
                'layout',
                'columnSize',
                appDom.createConst(updatedDraggedNodeColumnSize),
              );
              domApi.setNodeNamespacedProp(
                previousSibling,
                'layout',
                'columnSize',
                appDom.createConst(updatedPreviousSiblingColumnSize),
              );
            }
          }
        }
        if (draggedEdge === RECTANGLE_EDGE_RIGHT) {
          const nextSibling = appDom.getSiblingAfterNode(dom, draggedNode, 'children');

          if (nextSibling) {
            const nextSiblingInfo = nodesInfo[nextSibling.id];
            const nextSiblingRect = nextSiblingInfo?.rect;

            if (nextSiblingRect) {
              const updatedDraggedNodeColumnSize = normalizeColumnSize(resizePreviewRect.width);
              const updatedNextSiblingColumnSize = normalizeColumnSize(
                nextSiblingRect.width - (resizePreviewRect.width - draggedNodeRect.width),
              );

              domApi.setNodeNamespacedProp(
                draggedNode,
                'layout',
                'columnSize',
                appDom.createConst(updatedDraggedNodeColumnSize),
              );
              domApi.setNodeNamespacedProp(
                nextSibling,
                'layout',
                'columnSize',
                appDom.createConst(updatedNextSiblingColumnSize),
              );
            }
          }
        }
      }

      api.dragEnd();
    },
    [api, dom, domApi, draggedEdge, getCurrentlyDraggedNode, nodesInfo, resizePreviewElement],
  );

  return {
    resizePreviewElementRef,
    handleEdgeDragStart,
    handleEdgeDragOver,
    handleEdgeDragEnd,
  };
}
