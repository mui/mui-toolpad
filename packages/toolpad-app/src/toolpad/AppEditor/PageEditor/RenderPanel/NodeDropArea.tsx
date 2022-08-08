import * as React from 'react';
import clsx from 'clsx';
import { styled } from '@mui/material';

import { FlowDirection } from '../../../../types';
import * as appDom from '../../../../appDom';
import {
  absolutePositionCss,
  isHorizontalFlow,
  isVerticalFlow,
  Rectangle,
} from '../../../../utils/geometry';

import { useDom } from '../../../DomLoader';

import {
  DROP_ZONE_CENTER,
  DROP_ZONE_BOTTOM,
  DROP_ZONE_LEFT,
  DROP_ZONE_RIGHT,
  DROP_ZONE_TOP,
  DropZone,
  usePageEditorState,
} from '../PageEditorProvider';
import { isPageRow } from '../../../../toolpadComponents';

const dropAreaHighlightClasses = {
  highlightedTop: 'DropArea_HighlightedTop',
  highlightedRight: 'DropArea_HighlightedRight',
  highlightedBottom: 'DropArea_HighlightedBottom',
  highlightedLeft: 'DropArea_HighlightedLeft',
  highlightedCenter: 'DropArea_HighlightedCenter',
};

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
    [`&.${dropAreaHighlightClasses.highlightedTop}`]: {
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
    [`&.${dropAreaHighlightClasses.highlightedRight}`]: {
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
    [`&.${dropAreaHighlightClasses.highlightedBottom}`]: {
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
    [`&.${dropAreaHighlightClasses.highlightedLeft}`]: {
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
    [`&.${dropAreaHighlightClasses.highlightedCenter}`]: {
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

function getHighlightedZoneOverlayClass(
  highlightedZone: DropZone,
): typeof dropAreaHighlightClasses[keyof typeof dropAreaHighlightClasses] | null {
  switch (highlightedZone) {
    case DROP_ZONE_TOP:
      return dropAreaHighlightClasses.highlightedTop;
    case DROP_ZONE_RIGHT:
      return dropAreaHighlightClasses.highlightedRight;
    case DROP_ZONE_BOTTOM:
      return dropAreaHighlightClasses.highlightedBottom;
    case DROP_ZONE_LEFT:
      return dropAreaHighlightClasses.highlightedLeft;
    case DROP_ZONE_CENTER:
      return dropAreaHighlightClasses.highlightedCenter;
    default:
      return null;
  }
}

interface NodeDropAreaProps {
  node: appDom.AppDomNode;
  parentProp: string | null;
  dropAreaRect: Rectangle;
  availableDropZones: DropZone[];
}

export default function NodeDropArea({
  node,
  parentProp,
  dropAreaRect,
  availableDropZones,
}: NodeDropAreaProps) {
  const dom = useDom();
  const { dragOverNodeId, dragOverSlotParentProp, dragOverZone, viewState } = usePageEditorState();

  const { nodes: nodesInfo } = viewState;

  const dropAreaNodeInfo = nodesInfo[node.id];
  const dropAreaNodeRect = dropAreaNodeInfo?.rect || null;
  const dropAreaNodeSlots = dropAreaNodeInfo?.slots;

  const dropAreaNodeParent = appDom.getParent(dom, node);
  const dropAreaNodeParentInfo = dropAreaNodeParent && nodesInfo[dropAreaNodeParent.id];
  const dropAreaNodeParentRect = dropAreaNodeParentInfo?.rect || null;
  const dropAreaNodeParentSlots = dropAreaNodeParentInfo?.slots;
  const dropAreaNodeParentSlot =
    dropAreaNodeParentSlots && parentProp && dropAreaNodeParentSlots[parentProp];

  const isPageNode = appDom.isPage(node);
  const isPageChild = dropAreaNodeParent ? appDom.isPage(dropAreaNodeParent) : false;
  const isPageRowChild = dropAreaNodeParent
    ? appDom.isElement(dropAreaNodeParent) && isPageRow(dropAreaNodeParent)
    : false;

  const dropAreaNodeChildNodes = React.useMemo(
    () => appDom.getChildNodes(dom, node) as appDom.NodeChildren<appDom.ElementNode>,
    [dom, node],
  );

  const highlightedZone = React.useMemo((): DropZone | null => {
    const dropAreaParentParent = dropAreaNodeParent && appDom.getParent(dom, dropAreaNodeParent);

    if (dragOverZone && !availableDropZones.includes(dragOverZone)) {
      return null;
    }

    if (isPageNode && parentProp) {
      return null;
    }

    if (dragOverZone === DROP_ZONE_TOP) {
      // Is dragging over page top and is slot
      if (
        dropAreaNodeParent &&
        dropAreaNodeParent.id === dragOverNodeId &&
        appDom.isPage(dropAreaNodeParent) &&
        parentProp
      ) {
        const pageFirstChild = appDom.getNodeFirstChild(dom, dropAreaNodeParent, 'children');

        const isPageFirstChild = pageFirstChild ? node.id === pageFirstChild.id : false;

        return isPageFirstChild ? DROP_ZONE_TOP : null;
      }
    }

    if (dragOverZone === DROP_ZONE_LEFT) {
      // Is dragging beyond the left of parent page row slot, and parent page row is a child of the page
      if (
        dropAreaNodeParent &&
        dropAreaParentParent &&
        dropAreaNodeParent.id === dragOverNodeId &&
        appDom.isElement(dropAreaNodeParent) &&
        isPageRowChild &&
        appDom.isPage(dropAreaParentParent) &&
        !parentProp
      ) {
        const parentHighlightedChild = appDom.getNodeFirstChild(
          dom,
          dropAreaNodeParent,
          'children',
        );

        const isParentHighlightedChild = parentHighlightedChild
          ? node.id === parentHighlightedChild.id
          : false;

        return isParentHighlightedChild ? dragOverZone : null;
      }

      // Is dragging over left, is page row and child of the page
      if (dropAreaNodeParent && appDom.isElement(node) && isPageRow(node) && isPageChild) {
        return null;
      }
    }

    if (dragOverZone === DROP_ZONE_CENTER) {
      let rowAwareParentProp = parentProp;
      if (isPageRowChild) {
        rowAwareParentProp = 'children';
      }

      // Is dragging over parent element center
      if (
        dropAreaNodeParent &&
        dropAreaNodeParent.id === dragOverNodeId &&
        rowAwareParentProp === dragOverSlotParentProp
      ) {
        const parentLastChild =
          rowAwareParentProp &&
          (appDom.isPage(dropAreaNodeParent) || appDom.isElement(dropAreaNodeParent))
            ? appDom.getNodeLastChild(dom, dropAreaNodeParent, rowAwareParentProp)
            : null;

        const isParentLastChild = parentLastChild ? node.id === parentLastChild.id : false;

        const parentSlots = dropAreaNodeParentInfo?.slots || null;

        const parentFlowDirection =
          parentSlots && rowAwareParentProp && parentSlots[rowAwareParentProp]?.flowDirection;

        return parentFlowDirection && isParentLastChild
          ? getChildNodeHighlightedZone(parentFlowDirection)
          : null;
      }
      // Is dragging over slot center
      if (node.id === dragOverNodeId && parentProp && parentProp === dragOverSlotParentProp) {
        if (isPageNode) {
          return DROP_ZONE_CENTER;
        }

        const nodeChildren =
          (parentProp && appDom.isElement(node) && dropAreaNodeChildNodes[parentProp]) || [];
        return nodeChildren.length === 0 ? DROP_ZONE_CENTER : null;
      }
    }

    // Common cases
    return node.id === dragOverNodeId && parentProp === dragOverSlotParentProp
      ? dragOverZone
      : null;
  }, [
    dropAreaNodeParent,
    dom,
    dragOverZone,
    availableDropZones,
    node,
    dragOverNodeId,
    parentProp,
    dragOverSlotParentProp,
    isPageRowChild,
    isPageChild,
    dropAreaNodeParentInfo?.slots,
    isPageNode,
    dropAreaNodeChildNodes,
  ]);

  const slotRect = (dropAreaNodeSlots && parentProp && dropAreaNodeSlots[parentProp]?.rect) || null;

  const dropAreaSlotChildNodes = parentProp ? dropAreaNodeChildNodes[parentProp] || [] : [];
  const isEmptySlot = dropAreaSlotChildNodes.length === 0;

  const highlightedZoneOverlayClass =
    highlightedZone && getHighlightedZoneOverlayClass(highlightedZone);

  const isHorizontalContainerChild = dropAreaNodeParentSlot
    ? isHorizontalFlow(dropAreaNodeParentSlot.flowDirection)
    : false;
  const isVerticalContainerChild = dropAreaNodeParentSlot
    ? isVerticalFlow(dropAreaNodeParentSlot.flowDirection)
    : false;

  const highlightParentRect = slotRect || dropAreaNodeParentRect;

  if (!dropAreaNodeRect) {
    return null;
  }

  const highlightHeight =
    isHorizontalContainerChild && highlightParentRect && dropAreaNodeParentRect
      ? highlightParentRect.height
      : dropAreaNodeRect.height;
  const highlightWidth =
    !isPageChild && isVerticalContainerChild && highlightParentRect && dropAreaNodeParentRect
      ? highlightParentRect.width
      : dropAreaNodeRect.width;

  const highlightRelativeX =
    (!isPageChild && isVerticalContainerChild && highlightParentRect && dropAreaNodeParentRect
      ? highlightParentRect.x
      : dropAreaNodeRect.x) - dropAreaRect.x;
  const highlightRelativeY =
    (isHorizontalContainerChild && highlightParentRect && dropAreaNodeParentRect
      ? highlightParentRect.y
      : dropAreaNodeRect.y) - dropAreaRect.y;

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
