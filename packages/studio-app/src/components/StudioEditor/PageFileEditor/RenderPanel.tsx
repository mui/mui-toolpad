import { styled } from '@mui/system';
import * as React from 'react';
import clsx from 'clsx';
import {
  NodeId,
  NodeState,
  NodeLayoutSlots,
  SlotLayout,
  SlotLayoutInsert,
  ViewState,
} from '../../../types';
import * as studioDom from '../../../studioDom';
import PageView, { PageViewHandle } from '../../PageView';
import {
  absolutePositionCss,
  distanceToLine,
  distanceToRect,
  rectContainsPoint,
} from '../../../utils/geometry';
import { PageEditorState } from '../../../editorState';
import { PinholeOverlay } from '../../../PinholeOverlay';
import { useEditorApi, usePageEditorState } from '../EditorProvider';
import { getViewState } from '../../../pageViewState';

const classes = {
  scrollContainer: 'StudioScrollContainer',
  hud: 'StudioHud',
  view: 'StudioView',
  nodeHud: 'StudioNodeHud',
  slotHud: 'StudioSlotHud',
  insertSlotHud: 'StudioInsertSlotHud',
  selected: 'StudioSelected',
  allowNodeInteraction: 'StudioAllowNodeInteraction',
  active: 'StudioActive',
  componentDragging: 'StudioComponentDragging',
  selectionHint: 'StudioSelectionHint',
  hudOverlay: 'StudioHudOverlay',
};

const RenderPanelRoot = styled('div')({
  position: 'relative',
  overflow: 'auto',

  [`& .${classes.scrollContainer}`]: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
  },

  [`& .${classes.hud}`]: {
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  [`& .${classes.view}`]: {},

  [`& .${classes.selectionHint}`]: {
    // capture mouse events
    pointerEvents: 'initial',
    cursor: 'grab',
    display: 'none',
    position: 'absolute',
    right: 0,
    background: 'red',
    color: 'white',
    fontSize: 11,
    padding: `0 4px`,
  },

  [`& .${classes.nodeHud}`]: {
    // capture mouse events
    pointerEvents: 'initial',
    position: 'absolute',
    [`&.${classes.selected}`]: {
      border: '1px solid red',
      [`& .${classes.selectionHint}`]: {
        display: 'block',
      },
    },
    [`&.${classes.allowNodeInteraction}`]: {
      // block pointer-events so we can interact with the selection
      pointerEvents: 'none',
    },
  },

  [`& .${classes.componentDragging}`]: {
    [`& .${classes.insertSlotHud}`]: {
      border: '1px dashed #DDD',
    },
  },

  [`& .${classes.insertSlotHud}`]: {
    position: 'absolute',

    [`&.${classes.active}`]: {
      border: '1px solid green',
    },
  },

  [`& .${classes.slotHud}`]: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    color: 'green',
    border: '1px dashed green',
    opacity: 0.5,
    [`&.${classes.active}`]: {
      border: '1px solid green',
      opacity: 1,
    },
  },

  [`& .${classes.hudOverlay}`]: {
    position: 'absolute',
    inset: '0 0 0 0',
  },
});

function insertSlotAbsolutePositionCss(slot: SlotLayoutInsert): React.CSSProperties {
  return slot.direction === 'horizontal'
    ? {
        left: slot.x,
        top: slot.y,
        height: slot.size,
      }
    : {
        left: slot.x,
        top: slot.y,
        width: slot.size,
      };
}

function findNodeAt(
  nodes: readonly PageOrElementNode[],
  viewLayout: ViewState,
  x: number,
  y: number,
): NodeId | null {
  // Search deepest nested first
  for (let i = nodes.length - 1; i >= 0; i -= 1) {
    const node = nodes[i];
    const nodeLayout = viewLayout[node.id];
    if (nodeLayout && rectContainsPoint(nodeLayout.rect, x, y)) {
      return node.id;
    }
  }
  return null;
}

/**
 * Return all nodes that are available for insertion.
 * i.e. Exclude all descendants of the current selection since inserting in one of
 * them would create a cyclic structure.
 */
function getAvailableNodes(
  nodes: readonly PageOrElementNode[],
  state: PageEditorState,
): readonly PageOrElementNode[] {
  const selection = state.selection && studioDom.getNode(state.dom, state.selection);
  const excludedNodes = new Set<studioDom.StudioNode>(
    selection ? [selection, ...studioDom.getDescendants(state.dom, selection)] : [],
  );
  return nodes.filter((node) => !excludedNodes.has(node));
}

interface SlotIndex {
  nodeId: NodeId;
  slot: string;
  index?: number;
}

/**
 * From an array of slots, returns the index of the closest one to a certain point
 */
function findClosestSlot(slots: NodeLayoutSlots, x: number, y: number): SlotLayout | null {
  let closestDistance = Infinity;
  let closestSlot: SlotLayout | null = null;
  const namedSlotArrays = Object.values(slots);

  for (let i = 0; i < namedSlotArrays.length; i += 1) {
    const namedSlots = namedSlotArrays[i] || [];
    for (let j = 0; j < namedSlots.length; j += 1) {
      const slotLayout = namedSlots[j];
      let distance: number;
      if (slotLayout.type === 'slot') {
        distance = distanceToRect(slotLayout.rect, x, y);
      } else {
        distance =
          slotLayout.direction === 'horizontal'
            ? distanceToLine(
                slotLayout.x,
                slotLayout.y,
                slotLayout.x,
                slotLayout.y + slotLayout.size,
                x,
                y,
              )
            : distanceToLine(
                slotLayout.x,
                slotLayout.y,
                slotLayout.x + slotLayout.size,
                slotLayout.y,
                x,
                y,
              );
      }

      if (distance <= 0) {
        // We can bail out early
        return slotLayout;
      }
      if (distance < closestDistance) {
        closestDistance = distance;
        closestSlot = slotLayout;
      }
    }
  }

  return closestSlot;
}

function findActiveSlotInNode(nodeLayout: NodeState, x: number, y: number): SlotIndex | null {
  const { nodeId } = nodeLayout;
  const slots = nodeLayout.slots ?? [];
  const closestSlot = findClosestSlot(slots, x, y);
  if (closestSlot) {
    return { slot: closestSlot.name, nodeId, index: closestSlot.index };
  }
  return null;
}

function findActiveSlotAt(
  nodes: readonly studioDom.StudioNode[],
  viewLayout: ViewState,
  x: number,
  y: number,
): SlotIndex | null {
  // Search deepest nested first
  let nodeLayout: NodeState | undefined;
  for (let i = nodes.length - 1; i >= 0; i -= 1) {
    const node = nodes[i];
    nodeLayout = viewLayout[node.id];
    if (nodeLayout && rectContainsPoint(nodeLayout.rect, x, y)) {
      // Initially only consider slots of the node we're hovering
      const slotIndex = findActiveSlotInNode(nodeLayout, x, y);
      if (slotIndex) {
        return slotIndex;
      }
    }
  }
  // One last attempt, using the most shallow nodeLayout we found, regardless of
  // whether we are hovering it
  if (nodeLayout) {
    return findActiveSlotInNode(nodeLayout, x, y);
  }
  return null;
}

type PageOrElementNode = studioDom.StudioPageNode | studioDom.StudioElementNode;

export interface RenderPanelProps {
  className?: string;
}

export default function RenderPanel({ className }: RenderPanelProps) {
  const state = usePageEditorState();
  const api = useEditorApi();

  const viewRef = React.useRef<PageViewHandle>(null);
  const overlayRef = React.useRef<HTMLDivElement>(null);

  const { viewState, dom, pageNodeId, highlightedSlot, selection } = state;

  const [isFocused, setIsFocused] = React.useState(false);

  const pageNode = studioDom.getNode(dom, pageNodeId);
  studioDom.assertIsPage(pageNode);

  const pageNodes: readonly PageOrElementNode[] = React.useMemo(() => {
    return [pageNode, ...studioDom.getDescendants(dom, pageNode)];
  }, [dom, pageNode]);

  const selectedNode = selection && studioDom.getNode(state.dom, selection);
  if (selectedNode) {
    studioDom.assertIsElement(selectedNode);
  }

  const availableNodes = React.useMemo(
    () => getAvailableNodes(pageNodes, state),
    [pageNodes, state],
  );

  const handleRender = React.useCallback(() => {
    const rootElm = viewRef.current?.getRootElm();
    if (rootElm) {
      api.pageViewStateUpdate(getViewState(rootElm));
    }
  }, [api]);

  const getViewCoordinates = React.useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const rootElm = overlayRef.current;
      if (!rootElm) {
        return null;
      }
      const rect = rootElm.getBoundingClientRect();
      if (rectContainsPoint(rect, clientX, clientY)) {
        return { x: clientX - rect.x, y: clientY - rect.y };
      }
      return null;
    },
    [],
  );

  const handleDragStart = React.useCallback(
    (event: React.DragEvent<Element>) => {
      const cursorPos = getViewCoordinates(event.clientX, event.clientY);

      if (!cursorPos) {
        return;
      }

      event.dataTransfer.dropEffect = 'move';

      const nodeId = findNodeAt(pageNodes, viewState, cursorPos.x, cursorPos.y);

      if (nodeId) {
        api.nodeDragStart(nodeId);
      }
    },
    [api, getViewCoordinates, pageNodes, viewState],
  );

  React.useEffect(() => {
    const handleDragOver = (event: DragEvent) => {
      const cursorPos = getViewCoordinates(event.clientX, event.clientY);

      if (!cursorPos) {
        api.addComponentDragOver(null);
        return;
      }

      const slotIndex = findActiveSlotAt(availableNodes, viewState, cursorPos.x, cursorPos.y);

      const activeSlot =
        slotIndex &&
        viewState[slotIndex.nodeId]?.slots?.[slotIndex.slot]?.find(
          (slot) => slot.name === slotIndex.slot && slot.index === slotIndex.index,
        );

      event.preventDefault();
      if (activeSlot) {
        api.addComponentDragOver({
          nodeId: slotIndex.nodeId,
          slot: activeSlot.name,
          index: activeSlot.index,
        });
      } else {
        api.addComponentDragOver(null);
      }
    };

    const handleDrop = (event: DragEvent) => {
      const cursorPos = getViewCoordinates(event.clientX, event.clientY);

      if (!cursorPos) {
        return;
      }

      const slotIndex = findActiveSlotAt(availableNodes, viewState, cursorPos.x, cursorPos.y);

      const activeSlot =
        slotIndex &&
        viewState[slotIndex.nodeId]?.slots?.[slotIndex.slot]?.find(
          (slot) => slot.name === slotIndex.slot && slot.index === slotIndex.index,
        );

      if (activeSlot) {
        api.addComponentDrop({
          nodeId: slotIndex.nodeId,
          slot: activeSlot.name,
          index: activeSlot.index,
        });
      } else {
        api.addComponentDrop(null);
      }
    };

    const handleDragEnd = (event: DragEvent) => {
      event.preventDefault();
      api.addComponentDragEnd();
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    window.addEventListener('dragend', handleDragEnd);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
      window.removeEventListener('dragend', handleDragEnd);
    };
  }, [availableNodes, getViewCoordinates, viewState, api]);

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const cursorPos = getViewCoordinates(event.clientX, event.clientY);

      if (!cursorPos) {
        return;
      }

      const newSelectedNodeId = findNodeAt(pageNodes, viewState, cursorPos.x, cursorPos.y);
      api.select(newSelectedNodeId);
    },
    [api, getViewCoordinates, pageNodes, viewState],
  );

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isFocused && event.key === 'Backspace') {
        api.selectionRemove();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [api, isFocused]);

  const selectedRect = selectedNode ? viewState[selectedNode.id]?.rect : null;

  const nodesWithInteraction = React.useMemo<Set<NodeId>>(() => {
    if (!selectedNode) {
      return new Set();
    }
    return new Set(
      [...studioDom.getAncestors(dom, selectedNode), selectedNode].map((node) => node.id),
    );
  }, [dom, selectedNode]);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const handleFocus = React.useCallback((event: React.FocusEvent<HTMLDivElement>) => {
    if (event.target === rootRef.current) {
      setIsFocused(true);
    }
  }, []);
  const handleBlur = React.useCallback(() => setIsFocused(false), []);

  return (
    <RenderPanelRoot
      ref={rootRef}
      className={className}
      tabIndex={0}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <div className={classes.scrollContainer}>
        <PageView
          className={classes.view}
          ref={viewRef}
          dom={state.dom}
          pageNodeId={state.pageNodeId}
          onUpdate={handleRender}
        />
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
        <div
          className={clsx(classes.hud, {
            [classes.componentDragging]: state.highlightLayout,
          })}
          // This component has `pointer-events: none`, but we will slectively enable pointer-events
          // for its children. We can still capture the click gobally
          onClick={handleClick}
        >
          {pageNodes.map((node) => {
            const nodeId = node.id;
            const nodeLayout = viewState[nodeId];
            if (!nodeLayout) {
              return null;
            }
            const selectable = studioDom.isElement(node);
            return node ? (
              <React.Fragment key={nodeId}>
                <div
                  draggable
                  onDragStart={handleDragStart}
                  style={absolutePositionCss(nodeLayout.rect)}
                  className={clsx(classes.nodeHud, {
                    [classes.selected]: selectedNode?.id === nodeId,
                    [classes.allowNodeInteraction]: nodesWithInteraction.has(nodeId),
                  })}
                >
                  {selectable ? (
                    <div className={classes.selectionHint}>{node.component}</div>
                  ) : null}
                  {Object.values(nodeLayout.slots).map((nodeSlots = []) =>
                    nodeSlots.map((slotLayout, index) =>
                      slotLayout.type === 'insert' ? (
                        <div
                          key={`${slotLayout.name}:${slotLayout.index}`}
                          style={insertSlotAbsolutePositionCss(slotLayout)}
                          className={clsx(classes.insertSlotHud, {
                            [classes.active]:
                              highlightedSlot?.nodeId === nodeId &&
                              highlightedSlot?.slot === slotLayout.name &&
                              highlightedSlot?.index === index,
                          })}
                        />
                      ) : (
                        <div
                          key={slotLayout.name}
                          style={absolutePositionCss(slotLayout.rect)}
                          className={clsx(classes.slotHud, {
                            [classes.active]:
                              highlightedSlot?.nodeId === nodeId &&
                              highlightedSlot?.slot === slotLayout.name,
                          })}
                        >
                          Insert Here
                        </div>
                      ),
                    ),
                  )}
                </div>
              </React.Fragment>
            ) : null;
          })}
          {/* 
            This overlay allows passing through pointer-events through a pinhole
            This allows interactivity on the selected element only, while maintaining
            a reliable click target for the rest of the page
          */}
          <PinholeOverlay
            ref={overlayRef}
            className={classes.hudOverlay}
            onClick={handleClick}
            pinhole={selectedRect}
          />
        </div>
      </div>
    </RenderPanelRoot>
  );
}
