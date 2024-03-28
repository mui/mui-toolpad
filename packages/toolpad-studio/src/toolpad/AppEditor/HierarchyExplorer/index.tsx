import * as React from 'react';
import clsx from 'clsx';
import { NodeId } from '@toolpad/studio-runtime';
import { Box, Typography, styled, IconButton } from '@mui/material';
import { SimpleTreeView, TreeItem, TreeItemProps, treeItemClasses } from '@mui/x-tree-view';
import useBoolean from '@toolpad/utils/hooks/useBoolean';
import * as appDom from '@toolpad/studio-runtime/appDom';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import invariant from 'invariant';
import { useAppState, useDomApi, useAppStateApi } from '../../AppState';
import { ComponentIcon } from '../PageEditor/ComponentCatalog/ComponentCatalogItem';
import { DomView } from '../../../utils/domView';
import { removePageLayoutNode } from '../pageLayout';
import EditableTreeItem, { EditableTreeItemProps } from '../../../components/EditableTreeItem';
import ExplorerHeader from '../ExplorerHeader';
import NodeMenu from '../NodeMenu';

const classes = {
  treeItemMenuButton: 'Toolpad__HierarchyListItem',
  treeItemMenuOpen: 'Toolpad__HierarchyListItemMenuOpen',
};

const StyledTreeItem = styled(EditableTreeItem)({
  [`& .${classes.treeItemMenuButton}`]: {
    visibility: 'hidden',
  },
  [`& .${treeItemClasses.content}:hover .${classes.treeItemMenuButton}, & .${classes.treeItemMenuOpen}`]:
    {
      visibility: 'visible',
    },
});

interface CustomTreeItemProps extends TreeItemProps, EditableTreeItemProps {
  ref?: React.RefObject<HTMLLIElement>;
  node: appDom.ElementNode;
}

function CustomTreeItem(props: CustomTreeItemProps) {
  const domApi = useDomApi();
  const { dom } = useAppState();
  const appStateApi = useAppStateApi();

  const { label, node, ...other } = props;

  const {
    value: domNodeEditing,
    setTrue: startDomNodeEditing,
    setFalse: stopDomNodeEditing,
  } = useBoolean(false);

  const existingNames = React.useMemo(() => appDom.getExistingNamesForNode(dom, node), [dom, node]);

  const validateEditableNodeName = React.useCallback(
    (newName: string) => {
      if (newName !== node.name) {
        const validationErrorMessage = appDom.validateNodeName(newName, existingNames, node.type);

        return {
          isValid: !validationErrorMessage,
          ...(validationErrorMessage ? { errorMessage: validationErrorMessage } : {}),
        };
      }
      return { isValid: true };
    },
    [existingNames, node.name, node.type],
  );

  const handleNameSave = React.useCallback(
    (newName: string) => {
      domApi.setNodeName(node.id, newName);
      stopDomNodeEditing();
    },
    [domApi, node.id, stopDomNodeEditing],
  );

  const handleNodeDelete = React.useCallback(
    (nodeId: NodeId) => {
      domApi.update((draft) => {
        const toRemove = appDom.getNode(draft, nodeId);
        if (appDom.isElement(toRemove)) {
          draft = removePageLayoutNode(draft, toRemove);
        }

        return draft;
      });
    },
    [domApi],
  );

  const handleNodeDuplicate = React.useCallback(
    (nodeId: NodeId) => {
      const currentNode = appDom.getNode(dom, nodeId);

      invariant(
        node.parentId && node.parentProp,
        'Duplication should never be called on nodes that are not placed in the dom',
      );

      domApi.update((draft) => {
        draft = appDom.duplicateNode(draft, currentNode);

        return draft;
      });
    },
    [dom, domApi, node.parentId, node.parentProp],
  );

  const handleNodeHover = React.useCallback(
    (event: React.MouseEvent, nodeId: NodeId) => {
      appStateApi.hoverNode(nodeId as NodeId);
    },
    [appStateApi],
  );

  const handleNodeBlur = React.useCallback(() => {
    appStateApi.blurHoverNode();
  }, [appStateApi]);

  return (
    <StyledTreeItem
      key={node.id}
      labelText={node.name}
      renderLabel={(children) => (
        <Box
          sx={{ display: 'flex', alignItems: 'center' }}
          onMouseEnter={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            handleNodeHover?.(event, node.id);
          }}
          onMouseLeave={handleNodeBlur}
        >
          <ComponentIcon
            id={node.attributes.component}
            kind="builtIn"
            sx={{ marginRight: 1, fontSize: 18, opacity: 0.5 }}
          />
          {children}
          {node.id ? (
            <NodeMenu
              renderButton={({ buttonProps, menuProps }) => (
                <IconButton
                  className={clsx(classes.treeItemMenuButton, {
                    [classes.treeItemMenuOpen]: menuProps.open,
                  })}
                  aria-label="Open hierarchy menu"
                  size="small"
                  {...buttonProps}
                >
                  <MoreVertIcon fontSize="inherit" />
                </IconButton>
              )}
              nodeId={node.id}
              onRenameNode={startDomNodeEditing}
              onDuplicateNode={handleNodeDuplicate}
              onDeleteNode={handleNodeDelete}
            />
          ) : null}
        </Box>
      )}
      isEditing={domNodeEditing}
      onEdit={handleNameSave}
      suggestedNewItemName={node.name}
      onCancel={stopDomNodeEditing}
      validateItemName={validateEditableNodeName}
      {...other}
    />
  );
}

function RecursiveSubTree({ dom, root }: { dom: appDom.AppDom; root: appDom.ElementNode }) {
  const { children = [], renderItem = [] } = React.useMemo(
    () => appDom.getChildNodes(dom, root),
    [dom, root],
  );

  if (children.length > 0) {
    return (
      <CustomTreeItem itemId={root.id} node={root}>
        {children.map((childNode) => (
          <RecursiveSubTree key={childNode.id} dom={dom} root={childNode} />
        ))}
      </CustomTreeItem>
    );
  }
  if (renderItem.length > 0) {
    return (
      <CustomTreeItem
        itemId={root.id}
        node={root}
        label={<Typography variant="body2">{root.name}</Typography>}
      >
        <TreeItem
          itemId={`${root.id}-renderItem`}
          label={<Typography variant="body2">renderItem</Typography>}
        >
          {renderItem.map((childNode) => (
            <RecursiveSubTree key={childNode.id} dom={dom} root={childNode} />
          ))}
        </TreeItem>
      </CustomTreeItem>
    );
  }

  return <CustomTreeItem itemId={root.id} node={root} />;
}

export default function HierarchyExplorer() {
  const { dom, currentView } = useAppState();
  const appStateApi = useAppStateApi();
  const [expandedDomNodeIds, setExpandedDomNodeIds] = React.useState<string[]>([]);

  const currentPageNode = currentView?.name ? appDom.getPageByName(dom, currentView.name) : null;
  const selectedDomNodeId = currentView?.selectedNodeId;

  const selectedNodeAncestorIds = React.useMemo(() => {
    if (!selectedDomNodeId) {
      return [];
    }
    const selectedNode = appDom.getMaybeNode(dom, selectedDomNodeId);
    if (selectedNode) {
      return appDom.getAncestors(dom, selectedNode).map((node) => node.id);
    }
    return [];
  }, [dom, selectedDomNodeId]);

  const { children: rootChildren = [] } = React.useMemo(() => {
    if (!currentPageNode) {
      return { children: [] };
    }
    return appDom.getChildNodes(dom, currentPageNode);
  }, [dom, currentPageNode]);

  const handleNodeSelect = React.useCallback(
    (event: React.SyntheticEvent, itemIds: string | null) => {
      if (!itemIds) {
        return;
      }
      appStateApi.selectNode(itemIds as NodeId);
    },
    [appStateApi],
  );

  const handleNodeFocus = React.useCallback(
    (event: React.SyntheticEvent | null, nodeId: string) => {
      appStateApi.hoverNode(nodeId as NodeId);
    },
    [appStateApi],
  );

  const handleNodeToggle = React.useCallback(
    (event: React.SyntheticEvent, nodeIds: string[]) => {
      setExpandedDomNodeIds(nodeIds);
    },
    [setExpandedDomNodeIds],
  );

  const deleteNode = React.useCallback(() => {
    if (!selectedDomNodeId) {
      return;
    }
    appStateApi.update(
      (draft) => {
        const toRemove = appDom.getMaybeNode(dom, selectedDomNodeId);
        if (toRemove && appDom.isElement(toRemove)) {
          draft = removePageLayoutNode(draft, toRemove);
        }
        return draft;
      },
      {
        ...(currentView as Extract<DomView, { kind: 'page' }>),
        selectedNodeId: null,
      },
    );
  }, [selectedDomNodeId, appStateApi, currentView, dom]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLUListElement>) => {
      // delete selected node if event.key is Backspace
      if (event.key === 'Backspace') {
        deleteNode();
      }
    },
    [deleteNode],
  );

  const expandedDomNodeIdSet = React.useMemo(() => {
    return new Set([...selectedNodeAncestorIds, ...expandedDomNodeIds]);
  }, [selectedNodeAncestorIds, expandedDomNodeIds]);

  return (
    <React.Fragment>
      <ExplorerHeader headerText="Page hierarchy" />
      <SimpleTreeView
        aria-label="Page hierarchy explorer"
        expandedItems={Array.from(expandedDomNodeIdSet)}
        selectedItems={selectedDomNodeId}
        onSelectedItemsChange={handleNodeSelect}
        onItemFocus={handleNodeFocus}
        onExpandedItemsChange={handleNodeToggle}
        onKeyDown={handleKeyDown}
        sx={{
          flexGrow: 1,
          maxWidth: 400,
          maxHeight: '85%',
          overflowY: 'auto',
          scrollbarGutter: 'stable',
        }}
      >
        {rootChildren.map((childNode) => (
          <RecursiveSubTree key={childNode.id} dom={dom} root={childNode} />
        ))}
      </SimpleTreeView>
    </React.Fragment>
  );
}
