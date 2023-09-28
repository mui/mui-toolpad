import * as React from 'react';
import { Typography, styled, Box, IconButton, Tooltip } from '@mui/material';
import { TreeView, treeItemClasses, TreeItem, TreeItemProps } from '@mui/x-tree-view';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import { NodeId } from '@mui/toolpad-core';
import clsx from 'clsx';
import invariant from 'invariant';
import * as appDom from '../../../appDom';
import { useAppStateApi, useAppState } from '../../AppState';
import useLocalStorageState from '../../../utils/useLocalStorageState';
import NodeMenu from '../NodeMenu';
import { DomView } from '../../../utils/domView';
import client from '../../../api';
import useBoolean from '../../../utils/useBoolean';
import CreateTreeItem from '../../../components/CreateTreeItem';

const PagesExplorerRoot = styled('div')({
  overflow: 'auto',
  width: '100%',
});

const classes = {
  treeItemMenuButton: 'Toolpad__PagesExplorerTreeItem',
  treeItemMenuOpen: 'Toolpad__PagesExplorerTreeItemMenuOpen',
};

const StyledTreeItem = styled(TreeItem)({
  [`& .${classes.treeItemMenuButton}`]: {
    visibility: 'hidden',
  },
  [`
    & .${treeItemClasses.content}:hover .${classes.treeItemMenuButton},
    & .${classes.treeItemMenuOpen}
  `]: {
    visibility: 'visible',
  },
});

interface StyledTreeItemProps extends TreeItemProps {
  ref?: React.RefObject<HTMLLIElement>;
  onDeleteNode?: (nodeId: NodeId) => void;
  onDuplicateNode?: (nodeId: NodeId) => void;
  onCreate?: React.MouseEventHandler;
  labelIcon?: React.ReactNode;
  labelText: string;
  createLabelText?: string;
  deleteLabelText?: string;
  duplicateLabelText?: string;
  toolpadNodeId?: NodeId;
}

function PagesExplorerTreeItem(props: StyledTreeItemProps) {
  const {
    labelIcon,
    labelText,
    onCreate,
    onDeleteNode,
    onDuplicateNode,
    createLabelText,
    deleteLabelText = 'Delete',
    duplicateLabelText = 'Duplicate',
    toolpadNodeId,
    ...other
  } = props;

  const handleCreate: React.MouseEventHandler = React.useCallback(
    (event) => {
      event.stopPropagation();
      return onCreate!(event);
    },
    [onCreate],
  );

  return (
    <StyledTreeItem
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', p: 0.1, pr: 0 }}>
          {labelIcon}
          <Typography variant="body2" sx={{ fontWeight: 'inherit', flexGrow: 1 }} noWrap>
            {labelText}
          </Typography>
          {onCreate ? (
            <Tooltip title="Create new page">
              <IconButton aria-label={createLabelText} onClick={handleCreate} size="small">
                <AddIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          ) : null}
          {toolpadNodeId ? (
            <NodeMenu
              renderButton={({ buttonProps, menuProps }) => (
                <IconButton
                  className={clsx(classes.treeItemMenuButton, {
                    [classes.treeItemMenuOpen]: menuProps.open,
                  })}
                  aria-label="Open page explorer menu"
                  size="small"
                  {...buttonProps}
                >
                  <MoreVertIcon fontSize="inherit" />
                </IconButton>
              )}
              nodeId={toolpadNodeId}
              deleteLabelText={deleteLabelText}
              duplicateLabelText={duplicateLabelText}
              onDeleteNode={onDeleteNode}
              onDuplicateNode={onDuplicateNode}
            />
          ) : null}
        </Box>
      }
      {...other}
    />
  );
}

function getNodeEditorDomView(node: appDom.AppDomNode): DomView | undefined {
  switch (node.type) {
    case 'page':
      return { kind: 'page', nodeId: node.id };
    default:
      return undefined;
  }
}

const DEFAULT_NEW_PAGE_NAME = 'page';

export interface PagesExplorerProps {
  className?: string;
}

export default function PagesExplorer({ className }: PagesExplorerProps) {
  const { dom } = useAppState();
  const { currentView } = useAppState();

  const appStateApi = useAppStateApi();

  const app = appDom.getApp(dom);
  const { pages = [] } = appDom.getChildNodes(dom, app);

  const existingNames = React.useMemo(
    () => appDom.getExistingNamesForChildren(dom, appDom.getApp(dom), 'pages'),
    [dom],
  );

  const [expanded, setExpanded] = useLocalStorageState<string[]>(
    `editor/${app.id}/pages-explorer-expansion`,
    [':pages'],
  );

  const activeNode = currentView.nodeId || null;

  const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds as NodeId[]);
  };

  const handleSelect = (event: React.SyntheticEvent, nodeIds: string[]) => {
    if (nodeIds.length <= 0) {
      return;
    }

    const rawNodeId = nodeIds[0];
    if (rawNodeId.startsWith(':')) {
      return;
    }

    const selectedNodeId: NodeId = rawNodeId as NodeId;
    const node = appDom.getNode(dom, selectedNodeId);
    if (appDom.isElement(node)) {
      // TODO: sort out in-page selection
      const page = appDom.getPageAncestor(dom, node);
      if (page) {
        appStateApi.setView({ kind: 'page', nodeId: page.id });
      }
    }

    if (appDom.isPage(node)) {
      appStateApi.setView({ kind: 'page', nodeId: node.id });
    }
  };

  const pagesTreeRef = React.useRef<HTMLUListElement | null>(null);

  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  React.useEffect(() => {
    const pagesTree = pagesTreeRef.current;
    if (pagesTree && hasMounted) {
      pagesTree.querySelector(`.${treeItemClasses.selected}`)?.scrollIntoView();
    }
  }, [hasMounted]);

  const {
    value: isCreateNewPageOpen,
    setTrue: handleOpenCreateNewPage,
    setFalse: handleCloseCreateNewPage,
  } = useBoolean(false);

  const nextProposedName = React.useMemo(
    () => appDom.proposeName(DEFAULT_NEW_PAGE_NAME, existingNames),
    [existingNames],
  );

  const handleCreateNewCommit = React.useCallback(
    async (newPageName: string) => {
      const newNode = appDom.createNode(dom, 'page', {
        name: newPageName,
        attributes: {
          title: newPageName,
          display: 'shell',
        },
      });
      const appNode = appDom.getApp(dom);

      appStateApi.update((draft) => appDom.addNode(draft, newNode, appNode, 'pages'), {
        kind: 'page',
        nodeId: newNode.id,
      });

      handleCloseCreateNewPage();
    },
    [appStateApi, dom, handleCloseCreateNewPage],
  );

  const validatePageName = React.useCallback(
    (pageName: string) => {
      const validationErrorMessage = appDom.validateNodeName(pageName, existingNames, 'page');

      return {
        isValid: !validationErrorMessage,
        ...(validationErrorMessage ? { errorMessage: validationErrorMessage } : {}),
      };
    },
    [existingNames],
  );

  const handleDeletePage = React.useCallback(
    async (nodeId: NodeId) => {
      const deletedNode = appDom.getNode(dom, nodeId);

      let domViewAfterDelete: DomView | undefined;
      if (nodeId === activeNode) {
        const siblings = appDom.getSiblings(dom, deletedNode);
        const firstSiblingOfType = siblings.find((sibling) => sibling.type === deletedNode.type);
        domViewAfterDelete = firstSiblingOfType && getNodeEditorDomView(firstSiblingOfType);
      }

      await client.mutation.deletePage(deletedNode.name);

      appStateApi.update(
        (draft) => appDom.removeNode(draft, nodeId),
        domViewAfterDelete || { kind: 'page' },
      );
    },
    [activeNode, appStateApi, dom],
  );

  const handleDuplicateNode = React.useCallback(
    (nodeId: NodeId) => {
      const node = appDom.getNode(dom, nodeId);

      invariant(
        node.parentId && node.parentProp,
        'Duplication should never be called on nodes that are not placed in the dom',
      );

      const fragment = appDom.cloneFragment(dom, nodeId);

      const newNode = appDom.getNode(fragment, fragment.root);
      const editorDomView = getNodeEditorDomView(newNode);

      appStateApi.update(
        (draft) => appDom.addFragment(draft, fragment, node.parentId!, node.parentProp!),
        editorDomView || { kind: 'page' },
      );
    },
    [appStateApi, dom],
  );

  return (
    <PagesExplorerRoot
      sx={{
        height: '100%',
        overflow: 'auto',
      }}
      data-testid="pages-explorer"
      className={className}
    >
      <TreeView
        ref={pagesTreeRef}
        aria-label="pages explorer"
        selected={activeNode ? [activeNode] : []}
        onNodeSelect={handleSelect}
        expanded={expanded}
        onNodeToggle={handleToggle}
        multiSelect
        defaultCollapseIcon={<ExpandMoreIcon sx={{ fontSize: '0.9rem', opacity: 0.5 }} />}
        defaultExpandIcon={<ChevronRightIcon sx={{ fontSize: '0.9rem', opacity: 0.5 }} />}
      >
        <PagesExplorerTreeItem
          nodeId=":pages"
          aria-level={1}
          labelText="Pages"
          createLabelText="Create page"
          onCreate={handleOpenCreateNewPage}
        >
          <CreateTreeItem
            treeRef={pagesTreeRef}
            open={isCreateNewPageOpen}
            suggestedNewItemName={nextProposedName}
            onCreate={handleCreateNewCommit}
            onClose={handleCloseCreateNewPage}
            validateItemName={validatePageName}
            inputProps={{ sx: { fontSize: 14 } }}
          />
          {pages.map((page) => (
            <PagesExplorerTreeItem
              key={page.id}
              nodeId={page.id}
              toolpadNodeId={page.id}
              aria-level={2}
              labelText={page.name}
              onDuplicateNode={handleDuplicateNode}
              onDeleteNode={handleDeletePage}
            />
          ))}
        </PagesExplorerTreeItem>
      </TreeView>
    </PagesExplorerRoot>
  );
}
