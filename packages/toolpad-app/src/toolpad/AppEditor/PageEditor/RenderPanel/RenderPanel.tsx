import * as React from 'react';
import clsx from 'clsx';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import { IconButton, styled } from '@mui/material';
import { RuntimeEvent, NodeId } from '@mui/toolpad-core';
import { useNavigate } from 'react-router-dom';
import { FlowDirection, NodeInfo, SlotsState, SlotState } from '../../../../types';
import * as appDom from '../../../../appDom';
import EditorCanvasHost, { EditorCanvasHostHandle } from '../EditorCanvasHost';
import {
  absolutePositionCss,
  getRectanglePointEdge,
  Rectangle,
  RectangleEdge,
  RECTANGLE_EDGE_BOTTOM,
  RECTANGLE_EDGE_LEFT,
  RECTANGLE_EDGE_RIGHT,
  RECTANGLE_EDGE_TOP,
  rectContainsPoint,
} from '../../../../utils/geometry';
import { PinholeOverlay } from '../../../../PinholeOverlay';
import { getPageViewState } from '../../../../pageViewState';
import { useDom, useDomApi } from '../../../DomLoader';
import {
  DropZone,
  DROP_ZONE_BOTTOM,
  DROP_ZONE_CENTER,
  DROP_ZONE_LEFT,
  DROP_ZONE_RIGHT,
  DROP_ZONE_TOP,
  usePageEditorApi,
  usePageEditorState,
} from '../PageEditorProvider';
import { useToolpadComponent } from '../../toolpadComponents';
import {
  getElementNodeComponentId,
  PAGE_COLUMN_COMPONENT_ID,
  PAGE_ROW_COMPONENT_ID,
  isPageLayoutComponent,
  isPageRow,
  isPageColumn,
} from '../../../../toolpadComponents';
import { ExactEntriesOf } from '../../../../utils/types';
import { OverlayGrid, OverlayGridHandle } from './OverlayGrid';
import { useNodeResize } from './useNodeResize';

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

const overlayClasses = {
  hud: 'Toolpad_Hud',
  nodeHud: 'Toolpad_NodeHud',
  highlightedTop: 'Toolpad_HighlightedTop',
  highlightedRight: 'Toolpad_HighlightedRight',
  highlightedBottom: 'Toolpad_HighlightedBottom',
  highlightedLeft: 'Toolpad_HighlightedLeft',
  highlightedCenter: 'Toolpad_HighlightedCenter',
  selected: 'Toolpad_Selected',
  allowNodeInteraction: 'Toolpad_AllowNodeInteraction',
  container: 'Toolpad_Container',
  componentDragging: 'Toolpad_ComponentDragging',
  resize: 'Toolpad_Resize',
  selectionHint: 'Toolpad_SelectionHint',
  hudOverlay: 'Toolpad_HudOverlay',
};

const OverlayRoot = styled('div')({
  pointerEvents: 'none',
  width: '100%',
  height: '100%',
  '&:focus': {
    outline: 'none',
  },
  [`&.${overlayClasses.componentDragging}`]: {
    cursor: 'copy',
  },
  [`&.${overlayClasses.resize}`]: {
    cursor: 'ew-resize',
  },
  [`.${overlayClasses.selectionHint}`]: {
    // capture mouse events
    pointerEvents: 'initial',
    cursor: 'grab',
    display: 'none',
    position: 'absolute',
    alignItems: 'center',
    right: -1,
    background: 'red',
    color: 'white',
    fontSize: 11,
    padding: `0 0 0 8px`,
    // TODO: figure out positioning of this selectionhint, perhaps it should
    //   - prefer top right, above the component
    //   - if that appears out of bound of the editor, show it bottom or left
    zIndex: 1,
    transform: `translate(0, -100%)`,
  },
  [`.${overlayClasses.hudOverlay}`]: {
    position: 'absolute',
    inset: '0 0 0 0',
  },
});

const NodeHudWrapper = styled('div')({
  // capture mouse events
  pointerEvents: 'initial',
  position: 'absolute',
  outline: '1px dotted rgba(255,0,0,.2)',
  userSelect: 'none',
  [`.${overlayClasses.selected}`]: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    outline: '1px solid red',
  },
  [`.${overlayClasses.selectionHint}`]: {
    display: 'flex',
  },
  [`&.${overlayClasses.allowNodeInteraction}`]: {
    // block pointer-events so we can interact with the selection
    pointerEvents: 'none',
  },
});

const StyledNodeDropArea = styled('div', {
  shouldForwardProp: (prop) => prop !== 'highlightRelativeRect',
})<{
  highlightRelativeRect?: Partial<Rectangle>;
}>(({ highlightRelativeRect = {} }) => {
  const {
    x: highlightRelativeX = 0,
    y: highlightRelativeY = 0,
    width: highlightWidth = '100%',
    height: highlightHeight = '100%',
  } = highlightRelativeRect;

  return {
    pointerEvents: 'none',
    position: 'absolute',
    [`&.${overlayClasses.highlightedTop}`]: {
      '&:after': {
        backgroundColor: '#44EB2D',
        content: "''",
        position: 'absolute',
        height: 4,
        width: highlightWidth,
        top: -2,
        left: highlightRelativeX,
      },
    },
    [`&.${overlayClasses.highlightedRight}`]: {
      '&:after': {
        backgroundColor: '#44EB2D',
        content: "''",
        position: 'absolute',
        height: highlightHeight,
        width: 4,
        top: highlightRelativeY,
        right: -2,
      },
    },
    [`&.${overlayClasses.highlightedBottom}`]: {
      '&:after': {
        backgroundColor: '#44EB2D',
        content: "''",
        position: 'absolute',
        height: 4,
        width: highlightWidth,
        bottom: -2,
        left: highlightRelativeX,
      },
    },
    [`&.${overlayClasses.highlightedLeft}`]: {
      '&:after': {
        backgroundColor: '#44EB2D',
        content: "''",
        position: 'absolute',
        height: highlightHeight,
        width: 4,
        left: -2,
        top: highlightRelativeY,
      },
    },
    [`&.${overlayClasses.highlightedCenter}`]: {
      border: '4px solid #44EB2D',
    },
  };
});

const EmptySlot = styled('div')({
  alignItems: 'center',
  border: '1px dashed green',
  color: 'green',
  display: 'flex',
  fontSize: 20,
  justifyContent: 'center',
  position: 'absolute',
  opacity: 0.75,
});

const DraggableEdge = styled('div', {
  shouldForwardProp: (prop) => prop !== 'edge' && prop !== 'isResizing',
})<{
  edge: RectangleEdge;
  isResizing: boolean;
}>(({ edge, isResizing }) => {
  let dynamicStyles = {};
  if (edge === RECTANGLE_EDGE_RIGHT) {
    dynamicStyles = {
      top: 0,
      right: 0,
      height: '100%',
      width: 10,
    };
  }
  if (edge === RECTANGLE_EDGE_LEFT) {
    dynamicStyles = {
      top: 0,
      left: 0,
      height: '100%',
      width: 10,
    };
  }

  return {
    ...dynamicStyles,
    cursor: 'ew-resize',
    position: 'absolute',
    pointerEvents: 'initial',
    zIndex: 1,

    '&:hover': {
      backgroundColor: '#44EB2D',
      opacity: `${isResizing ? 0 : 0.5}`,
    },
  };
});

const ResizePreview = styled('div')({
  backgroundColor: '#44EB2D',
  opacity: 0.5,
});

function hasFreeNodeSlots(nodeInfo: NodeInfo): boolean {
  return Object.keys(nodeInfo.slots || []).length > 0;
}

function findAreaAt(areaRects: Record<string, Rectangle>, x: number, y: number): string | null {
  const rectEntries = Object.entries(areaRects);

  // Search deepest nested first
  for (let i = rectEntries.length - 1; i >= 0; i -= 1) {
    const areaRectEntry = rectEntries[i];

    const areaId = areaRectEntry[0];
    const areaRect = areaRectEntry[1];

    if (rectContainsPoint(areaRect, x, y)) {
      return areaId;
    }
  }
  return null;
}

function getRectangleEdgeDropZone(edge: RectangleEdge | null): DropZone | null {
  switch (edge) {
    case RECTANGLE_EDGE_TOP:
      return DROP_ZONE_TOP;
    case RECTANGLE_EDGE_RIGHT:
      return DROP_ZONE_RIGHT;
    case RECTANGLE_EDGE_BOTTOM:
      return DROP_ZONE_BOTTOM;
    case RECTANGLE_EDGE_LEFT:
      return DROP_ZONE_LEFT;
    default:
      return null;
  }
}

function getHighlightedZoneOverlayClass(
  highlightedZone: DropZone,
): typeof overlayClasses[keyof typeof overlayClasses] | null {
  switch (highlightedZone) {
    case DROP_ZONE_TOP:
      return overlayClasses.highlightedTop;
    case DROP_ZONE_RIGHT:
      return overlayClasses.highlightedRight;
    case DROP_ZONE_BOTTOM:
      return overlayClasses.highlightedBottom;
    case DROP_ZONE_LEFT:
      return overlayClasses.highlightedLeft;
    case DROP_ZONE_CENTER:
      return overlayClasses.highlightedCenter;
    default:
      return null;
  }
}

function getChildNodeHighlightedZone(parentFlowDirection: FlowDirection): DropZone | null {
  switch (parentFlowDirection) {
    case 'row':
      return DROP_ZONE_RIGHT;
    case 'column':
      return DROP_ZONE_BOTTOM;
    case 'row-reverse':
      return DROP_ZONE_LEFT;
    case 'column-reverse':
      return DROP_ZONE_TOP;
    default:
      return null;
  }
}

function isHorizontalSlot(slot: SlotState): boolean {
  return slot.flowDirection === 'row' || slot.flowDirection === 'row-reverse';
}

function isVerticalSlot(slot: SlotState): boolean {
  return slot.flowDirection === 'column' || slot.flowDirection === 'column-reverse';
}

function isReverseSlot(slot: SlotState): boolean {
  return slot.flowDirection === 'row-reverse' || slot.flowDirection === 'column-reverse';
}

function getDropAreaId(nodeId: string, parentProp: string): string {
  return `${nodeId}:${parentProp}`;
}

function getDropAreaNodeId(dropAreaId: string): NodeId {
  return dropAreaId.split(':')[0] as NodeId;
}

function getDropAreaParentProp(dropAreaId: string): string | null {
  return dropAreaId.split(':')[1] || null;
}

interface NodeHudProps {
  node: appDom.ElementNode | appDom.PageNode;
  rect: Rectangle;
  selected?: boolean;
  allowInteraction?: boolean;
  onNodeDragStart?: React.DragEventHandler<HTMLElement>;
  draggableEdges?: RectangleEdge[];
  onEdgeDragStart?: (
    node: appDom.ElementNode,
    edge: RectangleEdge,
  ) => React.MouseEventHandler<HTMLElement>;
  onDelete?: React.MouseEventHandler<HTMLElement>;
  isResizing?: boolean;
  resizePreviewElementRef: React.MutableRefObject<HTMLDivElement | null>;
}

function NodeHud({
  node,
  selected,
  allowInteraction,
  rect,
  onNodeDragStart,
  draggableEdges = [],
  onEdgeDragStart,
  onDelete,
  isResizing = false,
  resizePreviewElementRef,
}: NodeHudProps) {
  const dom = useDom();

  const componentId = appDom.isElement(node) ? getElementNodeComponentId(node) : '';
  const component = useToolpadComponent(dom, componentId);

  const handleDelete = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();

      if (onDelete) {
        onDelete(event);
      }
    },
    [onDelete],
  );

  return (
    <NodeHudWrapper
      data-node-id={node.id}
      style={absolutePositionCss(rect)}
      className={clsx({
        [overlayClasses.allowNodeInteraction]: allowInteraction,
      })}
    >
      {selected ? (
        <React.Fragment>
          <span className={overlayClasses.selected} />
          <div draggable className={overlayClasses.selectionHint} onDragStart={onNodeDragStart}>
            {component?.displayName || '<unknown>'}
            <DragIndicatorIcon color="inherit" />
            <IconButton aria-label="Remove element" color="inherit" onMouseUp={handleDelete}>
              <DeleteIcon color="inherit" />
            </IconButton>
          </div>
        </React.Fragment>
      ) : null}
      {onEdgeDragStart
        ? draggableEdges.map((edge) => (
            <DraggableEdge
              key={`${node.id}-edge-${edge}`}
              edge={edge}
              onMouseDown={onEdgeDragStart(node as appDom.ElementNode, edge)}
              isResizing={isResizing}
            />
          ))
        : null}
      {isResizing ? (
        <ResizePreview ref={resizePreviewElementRef} style={absolutePositionCss(rect)} />
      ) : null}
    </NodeHudWrapper>
  );
}

interface NodeSlotProps {
  node: appDom.ElementNode | appDom.PageNode;
  parentInfo: NodeInfo | null;
  layoutRect: Rectangle;
  dropAreaRect: Rectangle;
  slotRect?: Rectangle;
  highlightedZone?: DropZone | null;
  isEmptySlot: boolean;
  isPageChild: boolean;
}

function NodeDropArea({
  node,
  highlightedZone,
  parentInfo,
  layoutRect,
  slotRect,
  dropAreaRect,
  isEmptySlot,
  isPageChild,
}: NodeSlotProps) {
  const highlightedZoneOverlayClass =
    highlightedZone && getHighlightedZoneOverlayClass(highlightedZone);

  const nodeParentProp = node.parentProp;

  const parentSlots = parentInfo?.slots;
  const parentSlot = parentSlots && nodeParentProp && parentSlots[nodeParentProp];

  const parentRect = parentInfo?.rect;

  const isHorizontalContainerChild = parentSlot ? isHorizontalSlot(parentSlot) : false;
  const isVerticalContainerChild = parentSlot ? isVerticalSlot(parentSlot) : false;

  const highlightHeight =
    isHorizontalContainerChild && parentRect ? parentRect.height : layoutRect.height;
  const highlightWidth =
    !isPageChild && isVerticalContainerChild && parentRect ? parentRect.width : layoutRect.width;

  const highlightRelativeX =
    (!isPageChild && isVerticalContainerChild && parentRect ? parentRect.x : layoutRect.x) -
    dropAreaRect.x;
  const highlightRelativeY =
    (isHorizontalContainerChild && parentRect ? parentRect.y : layoutRect.y) - dropAreaRect.y;

  const isHighlightingCenter = highlightedZone === DROP_ZONE_CENTER;

  const highlightRect = isHighlightingCenter && isEmptySlot && slotRect ? slotRect : dropAreaRect;

  return (
    <React.Fragment>
      <StyledNodeDropArea
        style={absolutePositionCss(highlightRect)}
        className={clsx(
          highlightedZoneOverlayClass
            ? {
                [highlightedZoneOverlayClass]: !isHighlightingCenter || isEmptySlot,
              }
            : {},
        )}
        highlightRelativeRect={{
          x: highlightRelativeX,
          y: highlightRelativeY,
          width: highlightWidth,
          height: highlightHeight,
        }}
      />
      {isEmptySlot && slotRect ? (
        <EmptySlot style={absolutePositionCss(slotRect)}>+</EmptySlot>
      ) : null}
    </React.Fragment>
  );
}

export interface RenderPanelProps {
  className?: string;
}

export default function RenderPanel({ className }: RenderPanelProps) {
  const dom = useDom();
  const domApi = useDomApi();
  const api = usePageEditorApi();
  const {
    appId,
    selection,
    newNode,
    viewState,
    nodeId: pageNodeId,
    draggedNodeId,
    isDraggingOver,
    dragOverNodeId,
    dragOverSlotParentProp,
    dragOverZone,
    draggedEdge,
  } = usePageEditorState();

  const { nodes: nodesInfo } = viewState;

  const canvasHostRef = React.useRef<EditorCanvasHostHandle>(null);

  const pageNode = appDom.getNode(dom, pageNodeId, 'page');

  const pageNodes = React.useMemo(() => {
    return [pageNode, ...appDom.getDescendants(dom, pageNode)];
  }, [dom, pageNode]);

  const overlayGridRef = React.useRef<OverlayGridHandle>({
    gridElement: null,
    getMinColumnWidth: () => 0,
    getLeftColumnEdges: () => [],
    getRightColumnEdges: () => [],
  });

  const isEmptyPage = pageNodes.length <= 1;

  const selectedNode = selection && appDom.getNode(dom, selection);

  const handleNodeDragStart = React.useCallback(
    (node: appDom.ElementNode) => (event: React.DragEvent<HTMLDivElement>) => {
      event.stopPropagation();

      event.dataTransfer.dropEffect = 'move';
      api.select(node.id);
      api.existingNodeDragStart(node);
    },
    [api],
  );

  const getCurrentlyDraggedNode = React.useCallback(
    (): appDom.ElementNode | null =>
      newNode || (draggedNodeId && appDom.getNode(dom, draggedNodeId, 'element')),
    [dom, draggedNodeId, newNode],
  );

  const availableDropTargets = React.useMemo((): appDom.AppDomNode[] => {
    const draggedNode = getCurrentlyDraggedNode();

    if (!draggedNode) {
      return [];
    }

    /**
     * Return all nodes that are available for insertion.
     * i.e. Exclude all descendants of the current selection since inserting in one of
     * them would create a cyclic structure.
     */
    const excludedNodes = selectedNode
      ? new Set<appDom.AppDomNode>([selectedNode, ...appDom.getDescendants(dom, selectedNode)])
      : new Set();

    return pageNodes.filter((n) => !excludedNodes.has(n));
  }, [dom, getCurrentlyDraggedNode, pageNodes, selectedNode]);

  const availableDropTargetIds = React.useMemo(
    () => new Set(availableDropTargets.map((n) => n.id)),
    [availableDropTargets],
  );

  const availableDropZones = React.useMemo((): DropZone[] => {
    const draggedNode = getCurrentlyDraggedNode();

    const dragOverNode = dragOverNodeId && appDom.getNode(dom, dragOverNodeId);
    const dragOverNodeInfo = dragOverNodeId && nodesInfo[dragOverNodeId];

    const dragOverNodeSlots = dragOverNodeInfo?.slots;
    const dragOverSlot =
      dragOverNodeSlots && dragOverSlotParentProp && dragOverNodeSlots[dragOverSlotParentProp];

    const dragOverParent = dragOverNode && appDom.getParent(dom, dragOverNode);
    const dragOverParentInfo = dragOverParent && nodesInfo[dragOverParent.id];

    const dragOverParentFreeSlots = dragOverParentInfo?.slots;
    const dragOverParentFreeSlot =
      dragOverParentFreeSlots && dragOverParentFreeSlots[dragOverSlotParentProp || 'children'];

    if (draggedNode && dragOverNode) {
      if (appDom.isPage(dragOverNode)) {
        return [...(isEmptyPage ? [] : [DROP_ZONE_TOP]), DROP_ZONE_CENTER] as DropZone[];
      }

      if (dragOverNodeInfo && !hasFreeNodeSlots(dragOverNodeInfo) && !dragOverParentFreeSlot) {
        return [];
      }

      const isDraggingPageRow = isPageRow(draggedNode);
      const isDraggingPageColumn = isPageColumn(draggedNode);

      const isDraggingOverHorizontalContainer = dragOverSlot && isHorizontalSlot(dragOverSlot);
      const isDraggingOverVerticalContainer = dragOverSlot && isVerticalSlot(dragOverSlot);

      const isDraggingOverPageRow = appDom.isElement(dragOverNode) && isPageRow(dragOverNode);

      if (isDraggingPageRow) {
        return [
          DROP_ZONE_TOP,
          DROP_ZONE_BOTTOM,
          ...((isDraggingOverVerticalContainer ? [DROP_ZONE_CENTER] : []) as DropZone[]),
        ];
      }

      if (isDraggingPageColumn) {
        return [
          DROP_ZONE_RIGHT,
          DROP_ZONE_LEFT,
          ...((isDraggingOverPageRow ? [DROP_ZONE_TOP, DROP_ZONE_BOTTOM] : []) as DropZone[]),
          ...((isDraggingOverHorizontalContainer ? [DROP_ZONE_CENTER] : []) as DropZone[]),
        ];
      }

      if (isDraggingOverHorizontalContainer) {
        const isDraggingOverPageChild = dragOverParent ? appDom.isPage(dragOverParent) : false;

        return [
          DROP_ZONE_TOP,
          DROP_ZONE_BOTTOM,
          DROP_ZONE_CENTER,
          ...((isDraggingOverPageChild ? [DROP_ZONE_LEFT] : []) as DropZone[]),
        ];
      }
      if (isDraggingOverVerticalContainer) {
        return [DROP_ZONE_RIGHT, DROP_ZONE_LEFT, DROP_ZONE_CENTER];
      }
    }

    return [DROP_ZONE_TOP, DROP_ZONE_RIGHT, DROP_ZONE_BOTTOM, DROP_ZONE_LEFT];
  }, [
    dom,
    dragOverNodeId,
    dragOverSlotParentProp,
    getCurrentlyDraggedNode,
    isEmptyPage,
    nodesInfo,
  ]);

  const dropAreaRects = React.useMemo(() => {
    const rects: Record<string, Rectangle> = {};

    pageNodes.forEach((node) => {
      const nodeId = node.id;
      const nodeInfo = nodesInfo[nodeId];

      const nodeRect = nodeInfo?.rect;

      const nodeParentProp = node.parentProp;

      const nodeChildNodes = appDom.getChildNodes(
        dom,
        node,
      ) as appDom.NodeChildren<appDom.ElementNode>;

      const nodeSlots = nodeInfo?.slots || [];
      const nodeSlotEntries = Object.entries(nodeSlots);

      const hasFreeSlots = nodeSlotEntries.length > 0;
      const hasMultipleFreeSlots = nodeSlotEntries.length > 1;

      const baseRects = hasFreeSlots
        ? [
            ...(hasMultipleFreeSlots ? [nodeRect] : []),
            ...nodeSlotEntries.map(([slotParentProp, slot]) => {
              const slotChildNodes = nodeChildNodes[slotParentProp] || [];
              const isEmptySlot = slotChildNodes.length === 0;

              return slot && (isEmptySlot || hasMultipleFreeSlots) ? slot.rect : nodeRect;
            }),
          ]
        : [nodeRect];

      baseRects.forEach((baseRect, baseRectIndex) => {
        const parent = appDom.getParent(dom, node);
        const parentInfo = parent && nodesInfo[parent.id];

        const parentRect = parentInfo?.rect;

        const parentProp = hasFreeSlots
          ? Object.keys(nodeSlots)[hasMultipleFreeSlots ? baseRectIndex - 1 : baseRectIndex]
          : null;

        let parentAwareNodeRect = null;

        const isPageChild = parent ? appDom.isPage(parent) : false;

        if (
          nodeInfo &&
          parentInfo &&
          baseRect &&
          (isPageChild || appDom.isElement(parent)) &&
          hasFreeNodeSlots(parentInfo)
        ) {
          const parentChildren = nodeParentProp
            ? (appDom.getChildNodes(dom, parent) as appDom.NodeChildren<appDom.ElementNode>)[
                nodeParentProp
              ]
            : [];

          const parentChildrenCount = parentChildren.length;

          const isFirstChild = parentChildrenCount > 0 ? parentChildren[0].id === node.id : true;
          const isLastChild =
            parentChildren.length > 0
              ? parentChildren[parentChildrenCount - 1].id === node.id
              : true;

          let gapCount = 2;
          if (isFirstChild || isLastChild) {
            gapCount = 1;
          }
          if (isFirstChild && isLastChild) {
            gapCount = 0;
          }

          const parentSlots = parentInfo?.slots;
          const parentSlot = (parentSlots && nodeParentProp && parentSlots[nodeParentProp]) || null;

          const isParentVerticalContainer = parentSlot ? isVerticalSlot(parentSlot) : false;
          const isParentHorizontalContainer = parentSlot ? isHorizontalSlot(parentSlot) : false;

          const isParentReverseContainer = parentSlot ? isReverseSlot(parentSlot) : false;

          let parentGap = 0;
          if (nodesInfo && gapCount > 0) {
            const firstChildInfo = nodesInfo[parentChildren[0].id];
            const secondChildInfo = nodesInfo[parentChildren[1].id];

            const firstChildRect = firstChildInfo?.rect;
            const secondChildRect = secondChildInfo?.rect;

            if (firstChildRect && secondChildRect) {
              if (isParentHorizontalContainer) {
                parentGap =
                  (isParentReverseContainer
                    ? firstChildRect.x - secondChildRect.x - secondChildRect.width
                    : secondChildRect.x - firstChildRect.x - firstChildRect.width) / 2;
              }
              if (isParentVerticalContainer) {
                parentGap =
                  (isParentReverseContainer
                    ? firstChildRect.y - secondChildRect.y - secondChildRect.height
                    : secondChildRect.y - firstChildRect.y - firstChildRect.height) / 2;
              }
            }
          }

          const hasPositionGap = isParentReverseContainer ? isLastChild : isFirstChild;
          if (isParentVerticalContainer) {
            parentAwareNodeRect = {
              x: isPageChild ? 0 : baseRect.x,
              y: hasPositionGap ? baseRect.y : baseRect.y - parentGap,
              width: isPageChild && parentRect ? parentRect.width : baseRect.width,
              height: baseRect.height + gapCount * parentGap,
            };
          }
          if (isParentHorizontalContainer) {
            parentAwareNodeRect = {
              ...baseRect,
              x: hasPositionGap ? baseRect.x : baseRect.x - parentGap,
              width: baseRect.width + gapCount * parentGap,
            };
          }

          if (parentAwareNodeRect) {
            if (parentProp) {
              rects[getDropAreaId(nodeId, parentProp)] = parentAwareNodeRect;
            } else {
              rects[nodeId] = parentAwareNodeRect;
            }
          }
        } else if (parentProp && baseRect) {
          rects[getDropAreaId(nodeId, parentProp)] = baseRect;
        } else if (baseRect) {
          rects[nodeId] = baseRect;
        }
      });
    });

    return rects;
  }, [dom, nodesInfo, pageNodes]);

  const selectionRects = React.useMemo(() => {
    const rects: Record<string, Rectangle> = {};

    pageNodes.forEach((node) => {
      const nodeInfo = nodesInfo[node.id];
      const nodeRect = nodeInfo?.rect || null;

      if (nodeRect) {
        rects[node.id] = nodeRect;
      }
    });

    return rects;
  }, [nodesInfo, pageNodes]);

  const handleNodeDragOver = React.useCallback(
    (event: React.DragEvent<Element>) => {
      event.preventDefault();

      const cursorPos = canvasHostRef.current?.getViewCoordinates(event.clientX, event.clientY);

      const draggedNode = getCurrentlyDraggedNode();

      if (!cursorPos || !draggedNode) {
        return;
      }

      const activeDropAreaId = findAreaAt(dropAreaRects, cursorPos.x, cursorPos.y);

      const activeDropNodeId: NodeId =
        (activeDropAreaId && getDropAreaNodeId(activeDropAreaId)) || pageNode.id;

      const activeDropNode = appDom.getNode(dom, activeDropNodeId);

      const activeDropNodeInfo = nodesInfo[activeDropNodeId];

      const activeDropNodeRect = activeDropNodeInfo?.rect;

      const isDraggingOverPage = appDom.isPage(activeDropNode);
      const isDraggingOverElement = appDom.isElement(activeDropNode);

      const isDraggingOverContainer = activeDropNodeInfo
        ? hasFreeNodeSlots(activeDropNodeInfo)
        : false;

      const activeDropSlotParentProp = isDraggingOverPage
        ? 'children'
        : activeDropAreaId && getDropAreaParentProp(activeDropAreaId);

      let activeDropZone = null;

      const activeDropNodeSlots = activeDropNodeInfo?.slots || null;
      const activeDropSlot =
        activeDropNodeSlots &&
        activeDropSlotParentProp &&
        activeDropNodeSlots[activeDropSlotParentProp];

      const activeDropNodeChildren =
        (activeDropSlotParentProp &&
          (isDraggingOverPage || appDom.isElement(activeDropNode)) &&
          (appDom.getChildNodes(dom, activeDropNode) as appDom.NodeChildren<appDom.ElementNode>)[
            activeDropSlotParentProp
          ]) ||
        [];

      const isDraggingOverEmptyContainer = activeDropNodeInfo
        ? isDraggingOverContainer && activeDropNodeChildren.length === 0
        : false;

      const activeDropAreaRect =
        isDraggingOverContainer && activeDropSlotParentProp
          ? dropAreaRects[getDropAreaId(activeDropNodeId, activeDropSlotParentProp)]
          : dropAreaRects[activeDropNodeId];

      if (activeDropAreaRect) {
        const relativeX = cursorPos.x - activeDropAreaRect.x;
        const relativeY = cursorPos.y - activeDropAreaRect.y;

        activeDropZone = isDraggingOverEmptyContainer
          ? DROP_ZONE_CENTER
          : getRectangleEdgeDropZone(
              getRectanglePointEdge(activeDropAreaRect, relativeX, relativeY),
            );

        if (isDraggingOverPage) {
          if (activeDropNodeRect && relativeY < 0 && !isEmptyPage) {
            activeDropZone = DROP_ZONE_TOP;
          } else {
            activeDropZone = DROP_ZONE_CENTER;
          }
        }

        const edgeDetectionMargin = 10; // px

        // Detect center in layout containers
        if (isDraggingOverElement && activeDropNodeInfo && activeDropSlot) {
          const activeDropNodeParent = appDom.getParent(dom, activeDropNode);
          const isDraggingOverPageChild = activeDropNodeParent
            ? appDom.isPage(activeDropNodeParent)
            : false;

          if (isHorizontalSlot(activeDropSlot)) {
            if (
              isDraggingOverPageChild &&
              activeDropNodeRect &&
              relativeX <= activeDropNodeRect.x
            ) {
              activeDropZone = DROP_ZONE_LEFT;
            } else if (relativeY <= edgeDetectionMargin) {
              activeDropZone = DROP_ZONE_TOP;
            } else if (activeDropAreaRect.height - relativeY <= edgeDetectionMargin) {
              activeDropZone = DROP_ZONE_BOTTOM;
            } else {
              activeDropZone = DROP_ZONE_CENTER;
            }
          }
          if (isVerticalSlot(activeDropSlot)) {
            if (relativeX <= edgeDetectionMargin) {
              activeDropZone = DROP_ZONE_LEFT;
            } else if (activeDropAreaRect.width - relativeX <= edgeDetectionMargin) {
              activeDropZone = DROP_ZONE_RIGHT;
            } else {
              activeDropZone = DROP_ZONE_CENTER;
            }
          }
        }
      }

      const hasChangedDropArea =
        activeDropNodeId !== dragOverNodeId ||
        activeDropSlotParentProp !== dragOverSlotParentProp ||
        activeDropZone !== dragOverZone;

      if (activeDropZone && hasChangedDropArea && availableDropTargetIds.has(activeDropNodeId)) {
        api.nodeDragOver({
          nodeId: activeDropNodeId,
          parentProp: activeDropSlotParentProp || null,
          zone: activeDropZone as DropZone,
        });
      }
    },
    [
      getCurrentlyDraggedNode,
      dropAreaRects,
      pageNode.id,
      dom,
      nodesInfo,
      dragOverNodeId,
      dragOverSlotParentProp,
      dragOverZone,
      availableDropTargetIds,
      isEmptyPage,
      api,
    ],
  );

  const getNodeSlotFirstChild = React.useCallback(
    (node: appDom.PageNode | appDom.ElementNode, parentProp: string): appDom.ElementNode | null => {
      const nodeChildren =
        (appDom.getChildNodes(dom, node) as appDom.NodeChildren<appDom.ElementNode>)[parentProp] ||
        [];
      return nodeChildren.length > 0 ? nodeChildren[0] : null;
    },
    [dom],
  );

  const getNodeSlotLastChild = React.useCallback(
    (node: appDom.PageNode | appDom.ElementNode, parentProp: string): appDom.ElementNode | null => {
      const nodeChildren =
        (appDom.getChildNodes(dom, node) as appDom.NodeChildren<appDom.ElementNode>)[parentProp] ||
        [];
      return nodeChildren.length > 0 ? nodeChildren[nodeChildren.length - 1] : null;
    },
    [dom],
  );

  const getNodeDropAreaHighlightedZone = React.useCallback(
    (node: appDom.AppDomNode, parentProp: string | null = null): DropZone | null => {
      const nodeInfo = nodesInfo[node.id];

      const parent = appDom.getParent(dom, node);
      const parentNodeInfo = parent && nodesInfo[parent.id];

      const parentParent = parent && appDom.getParent(dom, parent);

      if (dragOverZone && !availableDropZones.includes(dragOverZone)) {
        return null;
      }

      if (dragOverZone === DROP_ZONE_TOP) {
        // Is dragging over page top
        if (parent && parent.id === dragOverNodeId && appDom.isPage(parent)) {
          const pageFirstChild = getNodeSlotFirstChild(parent, 'children');

          const isPageFirstChild = pageFirstChild ? node.id === pageFirstChild.id : false;

          return isPageFirstChild ? DROP_ZONE_TOP : null;
        }
      }

      if (dragOverZone === DROP_ZONE_CENTER) {
        // Is dragging over parent element center
        if (parent && parent.id === dragOverNodeId) {
          const nodeParentProp = node.parentProp;

          const parentLastChild =
            nodeParentProp && (appDom.isPage(parent) || appDom.isElement(parent))
              ? getNodeSlotLastChild(parent, nodeParentProp)
              : null;

          const isParentLastChild = parentLastChild ? node.id === parentLastChild.id : false;

          const nodeSlots = nodeInfo?.slots || null;
          const hasMultipleSlots = nodeSlots && Object.keys(nodeSlots).length > 1;

          const parentSlots = parentNodeInfo?.slots || null;

          const parentFlowDirection =
            parentSlots && nodeParentProp && parentSlots[nodeParentProp]?.flowDirection;

          return parentFlowDirection && isParentLastChild && (!hasMultipleSlots || !parentProp)
            ? getChildNodeHighlightedZone(parentFlowDirection)
            : null;
        }
        // Is dragging over slot center
        if (node.id === dragOverNodeId && parentProp && parentProp === dragOverSlotParentProp) {
          if (appDom.isPage(node)) {
            return DROP_ZONE_CENTER;
          }

          const nodeChildren =
            (parentProp && appDom.isElement(node) && appDom.getChildNodes(dom, node)[parentProp]) ||
            [];
          return nodeChildren.length === 0 ? DROP_ZONE_CENTER : null;
        }
      }

      if (dragOverZone === DROP_ZONE_LEFT) {
        // Is dragging over parent page row left, and parent page row is a child of the page
        if (
          parent &&
          parentParent &&
          parent.id === dragOverNodeId &&
          appDom.isElement(parent) &&
          isPageRow(parent) &&
          appDom.isPage(parentParent)
        ) {
          const nodeParentProp = node.parentProp;

          const parentFirstChild =
            nodeParentProp && (appDom.isPage(parent) || appDom.isElement(parent))
              ? getNodeSlotFirstChild(parent, nodeParentProp)
              : null;

          const isParentFirstChild = parentFirstChild ? node.id === parentFirstChild.id : false;

          return isParentFirstChild ? DROP_ZONE_LEFT : null;
        }

        // Is dragging over page row, and is a child of the page
        if (parent && appDom.isElement(node) && isPageRow(node) && appDom.isPage(parent)) {
          return null;
        }
      }

      return node.id === dragOverNodeId && parentProp === dragOverSlotParentProp
        ? dragOverZone
        : null;
    },
    [
      availableDropZones,
      dom,
      dragOverNodeId,
      dragOverSlotParentProp,
      dragOverZone,
      getNodeSlotFirstChild,
      getNodeSlotLastChild,
      nodesInfo,
    ],
  );

  const deleteOrphanedLayoutComponents = React.useCallback(
    (movedOrDeletedNode: appDom.ElementNode, moveTargetNodeId: NodeId | null = null) => {
      const movedOrDeletedNodeParentProp = movedOrDeletedNode.parentProp;

      const parent = appDom.getParent(dom, movedOrDeletedNode);
      const parentParent = parent && appDom.getParent(dom, parent);
      const parentParentParent = parentParent && appDom.getParent(dom, parentParent);

      const parentChildren =
        parent && movedOrDeletedNodeParentProp
          ? (appDom.getChildNodes(dom, parent) as appDom.NodeChildren<appDom.ElementNode>)[
              movedOrDeletedNodeParentProp
            ]
          : [];

      const isOnlyLayoutContainerChild =
        parent &&
        appDom.isElement(parent) &&
        isPageLayoutComponent(parent) &&
        parentChildren.length === 1;

      const isParentOnlyLayoutContainerChild =
        parentParent &&
        parent.parentProp &&
        appDom.isElement(parentParent) &&
        isPageLayoutComponent(parentParent) &&
        appDom.getChildNodes(dom, parentParent)[parent.parentProp].length === 1;

      const isSecondLastLayoutContainerChild =
        parent &&
        appDom.isElement(parent) &&
        (isPageRow(parent) || isPageColumn(parent)) &&
        parentChildren.length === 2;

      const hasNoLayoutContainerSiblings =
        parentChildren.filter(
          (child) =>
            child.id !== movedOrDeletedNode.id && (isPageRow(child) || isPageColumn(child)),
        ).length === 0;

      if (isSecondLastLayoutContainerChild && hasNoLayoutContainerSiblings) {
        if (parent.parentIndex && parentParent && appDom.isElement(parentParent)) {
          const lastContainerChild = parentChildren.filter(
            (child) => child.id !== movedOrDeletedNode.id,
          )[0];

          if (lastContainerChild.parentProp) {
            if (moveTargetNodeId !== parent.id && moveTargetNodeId !== lastContainerChild.id) {
              domApi.moveNode(
                lastContainerChild,
                parentParent,
                lastContainerChild.parentProp,
                parent.parentIndex,
              );

              if (isPageColumn(parent)) {
                domApi.setNodeNamespacedProp(
                  lastContainerChild,
                  'layout',
                  'columnSize',
                  parent.layout?.columnSize || appDom.createConst(1),
                );
              }

              domApi.removeNode(parent.id);
            }

            if (
              parentParentParent &&
              appDom.isElement(parentParentParent) &&
              isParentOnlyLayoutContainerChild &&
              moveTargetNodeId !== parentParent.id
            ) {
              domApi.moveNode(
                lastContainerChild,
                parentParentParent,
                lastContainerChild.parentProp,
              );

              if (isPageColumn(parentParent)) {
                domApi.setNodeNamespacedProp(
                  lastContainerChild,
                  'layout',
                  'columnSize',
                  parentParent.layout?.columnSize || appDom.createConst(1),
                );
              }

              domApi.removeNode(parentParent.id);
            }
          }
        }
      }

      if (isOnlyLayoutContainerChild) {
        domApi.removeNode(parent.id);

        if (isParentOnlyLayoutContainerChild && moveTargetNodeId !== parentParent.id) {
          domApi.removeNode(parentParent.id);
        }
      }
    },
    [dom, domApi],
  );

  const handleNodeDrop = React.useCallback(
    (event: React.DragEvent<Element>) => {
      const draggedNode = getCurrentlyDraggedNode();
      const cursorPos = canvasHostRef.current?.getViewCoordinates(event.clientX, event.clientY);

      if (!draggedNode || !cursorPos || !dragOverNodeId || !dragOverZone) {
        return;
      }

      const dragOverNode = appDom.getNode(dom, dragOverNodeId);
      const dragOverNodeInfo = nodesInfo[dragOverNodeId];

      const dragOverNodeParentProp =
        (dragOverNode?.parentProp as appDom.ParentPropOf<
          appDom.ElementNode<any>,
          appDom.PageNode | appDom.ElementNode<any>
        >) || null;

      if (!dragOverNodeParentProp) {
        return;
      }

      const dragOverNodeSlots = dragOverNodeInfo?.slots || null;
      const dragOverSlot =
        (dragOverNodeSlots &&
          dragOverSlotParentProp &&
          dragOverNodeSlots[dragOverSlotParentProp]) ||
        null;

      const isDraggingOverPage = dragOverNode ? appDom.isPage(dragOverNode) : false;
      const isDraggingOverElement = appDom.isElement(dragOverNode);

      if (!appDom.isElement(dragOverNode) && !appDom.isPage(dragOverNode)) {
        return;
      }

      let parent = appDom.getParent(dom, dragOverNode);

      const originalParent = parent;
      const originalParentInfo = parent && nodesInfo[parent.id];

      const originalParentSlots = originalParentInfo?.slots || null;
      const originalParentSlot =
        (originalParentSlots && originalParentSlots[dragOverNodeParentProp]) || null;

      let addOrMoveNode = domApi.addNode;
      if (selection) {
        addOrMoveNode = domApi.moveNode;
      }

      if (!availableDropZones.includes(dragOverZone)) {
        return;
      }

      // Drop on page
      if (isDraggingOverPage) {
        const newParentIndex =
          dragOverZone === DROP_ZONE_TOP
            ? appDom.getNewFirstParentIndexInNode(dom, dragOverNode, 'children')
            : appDom.getNewLastParentIndexInNode(dom, dragOverNode, 'children');

        if (!isPageRow(draggedNode)) {
          const rowContainer = appDom.createElement(dom, PAGE_ROW_COMPONENT_ID, {});
          domApi.addNode(rowContainer, dragOverNode, 'children', newParentIndex);
          parent = rowContainer;

          addOrMoveNode(draggedNode, rowContainer, 'children');
        } else {
          addOrMoveNode(draggedNode, dragOverNode, 'children', newParentIndex);
        }
      }

      if (isDraggingOverElement && parent && (appDom.isPage(parent) || appDom.isElement(parent))) {
        const isOriginalParentPage = originalParent ? appDom.isPage(originalParent) : false;

        const isDraggingOverRow = isDraggingOverElement && isPageRow(dragOverNode);

        const isDraggingOverHorizontalContainer = dragOverSlot
          ? isHorizontalSlot(dragOverSlot)
          : false;
        const isDraggingOverVerticalContainer = dragOverSlot ? isVerticalSlot(dragOverSlot) : false;

        if (dragOverZone === DROP_ZONE_CENTER && dragOverSlotParentProp) {
          addOrMoveNode(draggedNode, dragOverNode, dragOverSlotParentProp);
        }

        const isOriginalParentHorizontalContainer = originalParentSlot
          ? isHorizontalSlot(originalParentSlot)
          : false;

        if ([DROP_ZONE_TOP, DROP_ZONE_BOTTOM].includes(dragOverZone)) {
          if (!isDraggingOverVerticalContainer) {
            const newParentIndex =
              dragOverZone === DROP_ZONE_TOP
                ? appDom.getNewParentIndexBeforeNode(dom, dragOverNode, dragOverNodeParentProp)
                : appDom.getNewParentIndexAfterNode(dom, dragOverNode, dragOverNodeParentProp);

            if (isDraggingOverRow && !isPageRow(draggedNode)) {
              if (isOriginalParentPage) {
                const rowContainer = appDom.createElement(dom, PAGE_ROW_COMPONENT_ID, {});
                domApi.addNode(rowContainer, parent, dragOverNodeParentProp, newParentIndex);
                parent = rowContainer;

                addOrMoveNode(draggedNode, parent, dragOverNodeParentProp);
              } else {
                addOrMoveNode(draggedNode, parent, dragOverNodeParentProp, newParentIndex);
              }
            }

            if (isOriginalParentHorizontalContainer) {
              const columnContainer = appDom.createElement(
                dom,
                PAGE_COLUMN_COMPONENT_ID,
                {},
                {
                  columnSize: dragOverNode.layout?.columnSize || appDom.createConst(1),
                },
              );

              domApi.setNodeNamespacedProp(
                dragOverNode,
                'layout',
                'columnSize',
                appDom.createConst(1),
              );

              domApi.addNode(
                columnContainer,
                parent,
                dragOverNodeParentProp,
                appDom.getNewParentIndexAfterNode(dom, dragOverNode, dragOverNodeParentProp),
              );
              parent = columnContainer;

              // Move existing element inside column right away if drag over zone is bottom
              if (dragOverZone === DROP_ZONE_BOTTOM) {
                domApi.moveNode(dragOverNode, parent, dragOverNodeParentProp);
              }
            }

            if (!isDraggingOverRow || isPageRow(draggedNode)) {
              addOrMoveNode(draggedNode, parent, dragOverNodeParentProp, newParentIndex);
            }

            // Only move existing element inside column in the end if drag over zone is top
            if (
              isOriginalParentHorizontalContainer &&
              !isDraggingOverVerticalContainer &&
              dragOverZone === DROP_ZONE_TOP
            ) {
              domApi.moveNode(dragOverNode, parent, dragOverNodeParentProp);
            }
          }

          if (dragOverSlotParentProp && isDraggingOverVerticalContainer) {
            const isDraggingOverDirectionStart =
              dragOverZone ===
              (dragOverSlot?.flowDirection === 'column' ? DROP_ZONE_TOP : DROP_ZONE_BOTTOM);

            const newParentIndex = isDraggingOverDirectionStart
              ? appDom.getNewFirstParentIndexInNode(dom, dragOverNode, dragOverSlotParentProp)
              : appDom.getNewLastParentIndexInNode(dom, dragOverNode, dragOverSlotParentProp);

            addOrMoveNode(draggedNode, dragOverNode, dragOverSlotParentProp, newParentIndex);
          }
        }

        const isOriginalParentNonPageVerticalContainer =
          !isOriginalParentPage && originalParentSlot ? isVerticalSlot(originalParentSlot) : false;

        if ([DROP_ZONE_RIGHT, DROP_ZONE_LEFT].includes(dragOverZone)) {
          if (!isDraggingOverHorizontalContainer) {
            if (isOriginalParentNonPageVerticalContainer) {
              const rowContainer = appDom.createElement(dom, PAGE_ROW_COMPONENT_ID, {
                justifyContent: appDom.createConst(originalParentInfo?.props.alignItems || 'start'),
              });
              domApi.addNode(
                rowContainer,
                parent,
                dragOverNodeParentProp,
                appDom.getNewParentIndexAfterNode(dom, dragOverNode, dragOverNodeParentProp),
              );
              parent = rowContainer;

              // Move existing element inside right away if drag over zone is right
              if (dragOverZone === DROP_ZONE_RIGHT) {
                domApi.moveNode(dragOverNode, parent, dragOverNodeParentProp);
              }
            }

            const newParentIndex =
              dragOverZone === DROP_ZONE_RIGHT
                ? appDom.getNewParentIndexAfterNode(dom, dragOverNode, dragOverNodeParentProp)
                : appDom.getNewParentIndexBeforeNode(dom, dragOverNode, dragOverNodeParentProp);

            addOrMoveNode(draggedNode, parent, dragOverNodeParentProp, newParentIndex);

            // Only move existing element inside column in the end if drag over zone is left
            if (isOriginalParentNonPageVerticalContainer && dragOverZone === DROP_ZONE_LEFT) {
              domApi.moveNode(dragOverNode, parent, dragOverNodeParentProp);
            }
          }

          if (dragOverSlotParentProp && isDraggingOverHorizontalContainer) {
            const isDraggingOverDirectionStart =
              dragOverZone ===
              (dragOverSlot?.flowDirection === 'row' ? DROP_ZONE_LEFT : DROP_ZONE_RIGHT);

            const newParentIndex = isDraggingOverDirectionStart
              ? appDom.getNewFirstParentIndexInNode(dom, dragOverNode, dragOverSlotParentProp)
              : appDom.getNewLastParentIndexInNode(dom, dragOverNode, dragOverSlotParentProp);

            addOrMoveNode(draggedNode, dragOverNode, dragOverSlotParentProp, newParentIndex);
          }
        }

        const draggedNodeParent = appDom.getParent(dom, draggedNode);
        if (
          draggedNode.layout?.columnSize &&
          draggedNodeParent &&
          draggedNodeParent.id !== parent.id
        ) {
          domApi.setNodeNamespacedProp(draggedNode, 'layout', 'columnSize', appDom.createConst(1));
        }
      }

      api.dragEnd();

      if (selection) {
        deleteOrphanedLayoutComponents(draggedNode, dragOverNodeId);
      }

      if (newNode) {
        api.select(newNode.id);
      }
    },
    [
      api,
      availableDropZones,
      deleteOrphanedLayoutComponents,
      dom,
      domApi,
      dragOverNodeId,
      dragOverSlotParentProp,
      dragOverZone,
      getCurrentlyDraggedNode,
      newNode,
      nodesInfo,
      selection,
    ],
  );

  const handleNodeDragEnd = React.useCallback(
    (event: DragEvent | React.DragEvent) => {
      event.preventDefault();
      api.dragEnd();
    },
    [api],
  );

  React.useEffect(() => {
    const handleNodeDragOverDefault = (event: DragEvent) => {
      // Make the whole window a drop target to prevent the return animation happening on dragend
      event.preventDefault();
    };
    window.addEventListener('dragover', handleNodeDragOverDefault);
    window.addEventListener('dragend', handleNodeDragEnd);
    return () => {
      window.removeEventListener('dragover', handleNodeDragOverDefault);
      window.removeEventListener('dragend', handleNodeDragEnd);
    };
  }, [handleNodeDragEnd]);

  const handleNodeMouseUp = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const cursorPos = canvasHostRef.current?.getViewCoordinates(event.clientX, event.clientY);

      if (!cursorPos || draggedNodeId) {
        return;
      }

      const activeAreaId = findAreaAt(selectionRects, cursorPos.x, cursorPos.y);
      const newSelectedNodeId = (activeAreaId && getDropAreaNodeId(activeAreaId)) || null;
      const newSelectedNode = newSelectedNodeId && appDom.getMaybeNode(dom, newSelectedNodeId);
      if (newSelectedNode && appDom.isElement(newSelectedNode)) {
        api.select(newSelectedNodeId);
      } else {
        api.select(null);
      }
    },
    [draggedNodeId, selectionRects, dom, api],
  );

  const handleDelete = React.useCallback(
    (nodeId: NodeId) => (event?: React.MouseEvent<HTMLElement>) => {
      if (event) {
        event.stopPropagation();
      }

      const toRemove = appDom.getNode(dom, nodeId);

      domApi.removeNode(toRemove.id);

      if (appDom.isElement(toRemove)) {
        deleteOrphanedLayoutComponents(toRemove);
      }

      api.deselect();
    },
    [dom, domApi, api, deleteOrphanedLayoutComponents],
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (selection && event.key === 'Backspace') {
        handleDelete(selection)();
      }
    },
    [selection, handleDelete],
  );

  const selectedRect = selectedNode ? nodesInfo[selectedNode.id]?.rect : null;

  const nodesWithInteraction = React.useMemo<Set<NodeId>>(() => {
    if (!selectedNode) {
      return new Set();
    }
    return new Set(
      [...appDom.getPageAncestors(dom, selectedNode), selectedNode].map((node) => node.id),
    );
  }, [dom, selectedNode]);

  const handlePageViewStateUpdate = React.useCallback(() => {
    const rootElm = canvasHostRef.current?.getRootElm();

    if (!rootElm) {
      return;
    }

    api.pageViewStateUpdate(getPageViewState(rootElm));
  }, [api]);

  const navigate = useNavigate();

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
        case 'afterRender': {
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

  const { handleEdgeDragStart, handleEdgeDragOver, handleEdgeDragEnd, resizePreviewElementRef } =
    useNodeResize({
      pageNodes,
      getCurrentlyDraggedNode,
      canvasHostRef,
      overlayGridRef,
    });

  return (
    <RenderPanelRoot className={className}>
      <EditorCanvasHost
        ref={canvasHostRef}
        appId={appId}
        className={classes.view}
        dom={dom}
        pageNodeId={pageNodeId}
        onRuntimeEvent={handleRuntimeEvent}
        onScreenUpdate={handlePageViewStateUpdate}
        overlay={
          <OverlayRoot
            className={clsx({
              [overlayClasses.componentDragging]: isDraggingOver,
              [overlayClasses.resize]: draggedEdge,
            })}
            // Need this to be able to capture key events
            tabIndex={0}
            onKeyDown={handleKeyDown}
            {...(draggedEdge
              ? {
                  onMouseMove: handleEdgeDragOver,
                  onMouseUp: handleEdgeDragEnd,
                }
              : {
                  onDragOver: handleNodeDragOver,
                  onDrop: handleNodeDrop,
                  onDragEnd: handleNodeDragEnd,
                  // This component has `pointer-events: none`, but we will selectively enable pointer-events
                  // for its children. We can still capture the click gobally
                  onMouseUp: handleNodeMouseUp,
                })}
          >
            {pageNodes.map((node) => {
              const nodeInfo = nodesInfo[node.id];

              const parent = appDom.getParent(dom, node);
              const parentInfo = (parent && nodesInfo[parent.id]) || null;

              const freeSlots = nodeInfo?.slots || {};
              const freeSlotEntries = Object.entries(freeSlots) as ExactEntriesOf<SlotsState>;

              const hasFreeSlots = freeSlotEntries.length > 0;
              const hasMultipleFreeSlots = freeSlotEntries.length > 1;

              const isPageNode = appDom.isPage(node);

              const isPageChild = parent ? appDom.isPage(parent) : false;
              const isPageRowChild = parent ? appDom.isElement(parent) && isPageRow(parent) : false;

              const childNodes = appDom.getChildNodes(
                dom,
                node,
              ) as appDom.NodeChildren<appDom.ElementNode>;

              const parentChildNodes =
                parent &&
                (appDom.getChildNodes(dom, parent) as appDom.NodeChildren<appDom.ElementNode>);
              const parentSlotChildNodes =
                parentChildNodes && node.parentProp && parentChildNodes[node.parentProp];

              const isFirstChild = parentSlotChildNodes
                ? parentSlotChildNodes[0].id === node.id
                : false;
              const isLastChild = parentSlotChildNodes
                ? parentSlotChildNodes[parentSlotChildNodes.length - 1].id === node.id
                : false;

              const nodeRect = nodeInfo?.rect || null;
              const hasNodeOverlay = isPageNode || appDom.isElement(node);

              if (!nodeRect || !hasNodeOverlay) {
                return null;
              }

              return (
                <React.Fragment key={node.id}>
                  {!isPageNode ? (
                    <NodeHud
                      node={node}
                      rect={nodeRect}
                      selected={selectedNode?.id === node.id}
                      allowInteraction={nodesWithInteraction.has(node.id) && !draggedEdge}
                      onNodeDragStart={handleNodeDragStart(node)}
                      draggableEdges={
                        isPageRowChild
                          ? [
                              ...(isFirstChild ? [] : [RECTANGLE_EDGE_LEFT as RectangleEdge]),
                              ...(isLastChild ? [] : [RECTANGLE_EDGE_RIGHT as RectangleEdge]),
                            ]
                          : []
                      }
                      onEdgeDragStart={isPageRowChild ? handleEdgeDragStart : undefined}
                      onDelete={handleDelete(node.id)}
                      isResizing={Boolean(draggedEdge) && node.id === draggedNodeId}
                      resizePreviewElementRef={resizePreviewElementRef}
                    />
                  ) : null}
                  {hasFreeSlots
                    ? freeSlotEntries.map(([parentProp, freeSlot]) => {
                        if (!freeSlot) {
                          return null;
                        }

                        const dropAreaRect = dropAreaRects[getDropAreaId(node.id, parentProp)];

                        const slotChildNodes = childNodes[parentProp] || [];
                        const isEmptySlot = slotChildNodes.length === 0;

                        if (isPageNode && !isEmptySlot) {
                          return null;
                        }

                        return (
                          <NodeDropArea
                            key={`${node.id}:${parentProp}`}
                            node={node}
                            parentInfo={parentInfo}
                            layoutRect={nodeRect}
                            dropAreaRect={dropAreaRect}
                            slotRect={freeSlot.rect}
                            highlightedZone={getNodeDropAreaHighlightedZone(node, parentProp)}
                            isEmptySlot={isEmptySlot}
                            isPageChild={isPageChild}
                          />
                        );
                      })
                    : null}
                  {!hasFreeSlots || hasMultipleFreeSlots ? (
                    <NodeDropArea
                      node={node}
                      parentInfo={parentInfo}
                      layoutRect={nodeRect}
                      dropAreaRect={dropAreaRects[node.id]}
                      highlightedZone={getNodeDropAreaHighlightedZone(node)}
                      isEmptySlot={false}
                      isPageChild={isPageChild}
                    />
                  ) : null}
                </React.Fragment>
              );
            })}
            {/* 
            This overlay allows passing through pointer-events through a pinhole
            This allows interactivity on the selected element only, while maintaining
            a reliable click target for the rest of the page
          */}
            <PinholeOverlay className={overlayClasses.hudOverlay} pinhole={selectedRect} />
            {draggedEdge ? <OverlayGrid ref={overlayGridRef} /> : null}
          </OverlayRoot>
        }
      />
    </RenderPanelRoot>
  );
}
