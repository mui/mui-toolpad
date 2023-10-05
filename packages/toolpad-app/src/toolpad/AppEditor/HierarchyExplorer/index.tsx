import * as React from 'react';
import { NodeId } from '@mui/toolpad-core';
import { Box, Typography } from '@mui/material';
import { TreeView, TreeItem, TreeItemProps } from '@mui/x-tree-view';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import * as appDom from '../../../appDom';
import { useAppState, useDomApi, useAppStateApi } from '../../AppState';
import { ComponentIcon } from '../PageEditor/ComponentCatalog/ComponentCatalogItem';
import { DomView } from '../../../utils/domView';
import { removePageLayoutNode } from '../pageLayout';
import EditableTreeItem from '../../../components/EditableTreeItem';
import ExplorerHeader from '../ExplorerHeader';

export interface CustomTreeItemProps extends TreeItemProps {
  ref?: React.RefObject<HTMLLIElement>;
  node: appDom.ElementNode;
}

function CustomTreeItem(props: CustomTreeItemProps) {
  const domApi = useDomApi();
  const { dom } = useAppState();
  const appStateApi = useAppStateApi();

  const [domNodeEditable, setDomNodeEditable] = React.useState(false);
  const { label, node, ...other } = props;

  const handleStopEditing = React.useCallback(() => {
    setDomNodeEditable(false);
  }, []);

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
    },
    [domApi, node.id],
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
    <EditableTreeItem
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
        </Box>
      )}
      isEditing={domNodeEditable}
      onEdit={handleNameSave}
      suggestedNewItemName={node.name}
      onCancel={handleStopEditing}
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
      <CustomTreeItem nodeId={root.id} node={root}>
        {children.map((childNode) => (
          <RecursiveSubTree key={childNode.id} dom={dom} root={childNode} />
        ))}
      </CustomTreeItem>
    );
  }
  if (renderItem.length > 0) {
    return (
      <CustomTreeItem
        nodeId={root.id}
        node={root}
        label={<Typography variant="body2">{root.name}</Typography>}
      >
        <TreeItem
          nodeId={`${root.id}-renderItem`}
          label={<Typography variant="body2">renderItem</Typography>}
        >
          {renderItem.map((childNode) => (
            <RecursiveSubTree key={childNode.id} dom={dom} root={childNode} />
          ))}
        </TreeItem>
      </CustomTreeItem>
    );
  }

  return <CustomTreeItem nodeId={root.id} node={root} />;
}

export default function HierarchyExplorer() {
  const { dom } = useAppState();
  const { currentView } = useAppState();
  const appStateApi = useAppStateApi();
  const [expandedDomNodeIds, setExpandedDomNodeIds] = React.useState<string[]>([]);

  const currentPageId = currentView?.nodeId;
  const currentPageNode = currentPageId ? appDom.getNode(dom, currentPageId, 'page') : null;
  const selectedDomNodeId = (currentView as Extract<DomView, { kind: 'page' }>)?.selectedNodeId;

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
    (event: React.SyntheticEvent, nodeId: string) => {
      appStateApi.selectNode(nodeId as NodeId);
    },
    [appStateApi],
  );

  const handleNodeFocus = React.useCallback(
    (event: React.SyntheticEvent, nodeId: string) => {
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
      <TreeView
        aria-label="Page hierarchy explorer"
        defaultCollapseIcon={<ExpandMoreIcon sx={{ fontSize: '0.9rem', opacity: 0.5 }} />}
        defaultExpandIcon={<ChevronRightIcon sx={{ fontSize: '0.9rem', opacity: 0.5 }} />}
        expanded={Array.from(expandedDomNodeIdSet)}
        selected={selectedDomNodeId as string}
        onNodeSelect={handleNodeSelect}
        onNodeFocus={handleNodeFocus}
        onNodeToggle={handleNodeToggle}
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
      </TreeView>
    </React.Fragment>
  );
}
