import * as React from 'react';
import { styled, Box, IconButton, Stack, Tooltip } from '@mui/material';
import { SimpleTreeView, treeItemClasses } from '@mui/x-tree-view';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { NodeId } from '@toolpad/studio-runtime';
import clsx from 'clsx';
import invariant from 'invariant';
import { alphabeticComparator, createPropComparator } from '@toolpad/utils/comparators';
import useBoolean from '@toolpad/utils/hooks/useBoolean';
import * as appDom from '@toolpad/studio-runtime/appDom';
import { useAppStateApi, useAppState } from '../../AppState';
import useLocalStorageState from '../../../utils/useLocalStorageState';
import NodeMenu from '../NodeMenu';
import { DomView } from '../../../utils/domView';
import { useProjectApi } from '../../../projectApi';
import EditableTreeItem, { EditableTreeItemProps } from '../../../components/EditableTreeItem';
import { scrollIntoViewIfNeeded } from '../../../utils/dom';
import ExplorerHeader from '../ExplorerHeader';

const PagesExplorerRoot = styled(Stack)({
  height: '100%',
  width: '100%',
});

const classes = {
  treeItemMenuButton: 'Toolpad__PagesExplorerTreeItem',
  treeItemMenuOpen: 'Toolpad__PagesExplorerTreeItemMenuOpen',
};

const StyledEditableTreeItem = styled(EditableTreeItem)({
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

interface StyledTreeItemProps extends EditableTreeItemProps {
  ref?: React.RefObject<HTMLLIElement>;
  onRenameNode?: (nodeId: NodeId, updatedName: string) => void;
  onDeleteNode?: (nodeId: NodeId) => void;
  onDuplicateNode?: (nodeId: NodeId) => void;
  onCreate?: React.MouseEventHandler;
  labelIcon?: React.ReactNode;
  labelText: string;
  createLabelText?: string;
  renameLabelText?: string;
  deleteLabelText?: string;
  duplicateLabelText?: string;
  toolpadNodeId?: NodeId;
}

function PagesExplorerTreeItem(props: StyledTreeItemProps) {
  const {
    itemId,
    labelIcon,
    labelText,
    title,
    onRenameNode,
    onDeleteNode,
    onDuplicateNode,
    renameLabelText = 'Rename',
    deleteLabelText = 'Delete',
    duplicateLabelText = 'Duplicate',
    toolpadNodeId,
    validateItemName,
    ...other
  } = props;

  const { value: isEditing, setTrue: startEditing, setFalse: stopEditing } = useBoolean(false);

  const handleRenameConfirm = React.useCallback(
    (updatedName: string) => {
      if (onRenameNode) {
        onRenameNode(itemId as NodeId, updatedName);
        stopEditing();
      }
    },
    [itemId, onRenameNode, stopEditing],
  );

  const validateEditablePageName = React.useCallback(
    (newName: string) => {
      if (newName !== labelText && validateItemName) {
        return validateItemName(newName);
      }
      return { isValid: true };
    },
    [labelText, validateItemName],
  );

  return (
    <StyledEditableTreeItem
      itemId={itemId}
      labelText={labelText}
      renderLabel={(children) => (
        <Tooltip title={title} placement="right" disableInteractive>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {labelIcon}
            {children}
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
                renameLabelText={renameLabelText}
                deleteLabelText={deleteLabelText}
                duplicateLabelText={duplicateLabelText}
                onRenameNode={startEditing}
                onDeleteNode={onDeleteNode}
                onDuplicateNode={onDuplicateNode}
              />
            ) : null}
          </Box>
        </Tooltip>
      )}
      suggestedNewItemName={labelText}
      onCancel={stopEditing}
      isEditing={isEditing}
      {...(onRenameNode ? { onEdit: handleRenameConfirm } : {})}
      validateItemName={validateEditablePageName}
      {...other}
    />
  );
}

function getNodeEditorDomView(node: appDom.AppDomNode): DomView | undefined {
  switch (node.type) {
    case 'page':
      return { kind: 'page', name: node.name };
    default:
      return undefined;
  }
}

const DEFAULT_NEW_PAGE_NAME = 'page';

export interface PagesExplorerProps {
  className?: string;
}

export default function PagesExplorer({ className }: PagesExplorerProps) {
  const projectApi = useProjectApi();
  const { dom, currentView } = useAppState();
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

  const activePage = currentView.name ? appDom.getPageByName(dom, currentView.name) : null;

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
        appStateApi.setView({ kind: 'page', name: page.name });
      }
    }

    if (appDom.isPage(node)) {
      appStateApi.setView({ kind: 'page', name: node.name });
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
      const selectedItem = pagesTree.querySelector(`.${treeItemClasses.selected}`);

      if (selectedItem) {
        scrollIntoViewIfNeeded(selectedItem);
      }
    }
  }, [hasMounted, pages]);

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
          authorization: {
            allowAll: true,
          },
        },
      });
      const appNode = appDom.getApp(dom);

      appStateApi.update((draft) => appDom.addNode(draft, newNode, appNode, 'pages'), {
        kind: 'page',
        name: newNode.name,
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
      if (nodeId === activePage?.id) {
        const siblings = appDom.getSiblings(dom, deletedNode);
        const firstSiblingOfType = siblings.find((sibling) => sibling.type === deletedNode.type);
        domViewAfterDelete = firstSiblingOfType
          ? getNodeEditorDomView(firstSiblingOfType)
          : { kind: 'page' };
      }

      await projectApi.methods.deletePage(deletedNode.name);

      appStateApi.update((draft) => appDom.removeNode(draft, nodeId), domViewAfterDelete);
    },
    [projectApi, activePage?.id, appStateApi, dom],
  );

  const handleRenameNode = React.useCallback(
    (nodeId: NodeId, updatedName: string) => {
      appStateApi.update(
        (draft) => {
          const page = appDom.getNode(draft, nodeId, 'page');
          return appDom.setNodeName(draft, page, updatedName);
        },
        {
          kind: 'page',
          name: updatedName,
        },
      );

      const oldNameNode = dom.nodes[nodeId];
      if (oldNameNode.type === 'page' && updatedName !== oldNameNode.name) {
        setTimeout(async () => {
          await projectApi.methods.deletePage(oldNameNode.name);
        }, 300);
      }
    },
    [appStateApi, dom.nodes, projectApi.methods],
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

  const alphabeticSortedPages = React.useMemo(
    () => [...pages].sort(createPropComparator('name', alphabeticComparator)),
    [pages],
  );

  return (
    <PagesExplorerRoot data-testid="pages-explorer" direction="column" className={className}>
      <ExplorerHeader
        headerText="Pages"
        onCreate={handleOpenCreateNewPage}
        createLabelText="Create new page"
      />
      <SimpleTreeView
        ref={pagesTreeRef}
        aria-label="Pages explorer"
        selectedItems={activePage ? [activePage.id] : []}
        onSelectedItemsChange={handleSelect}
        expandedItems={expanded}
        onExpandedItemsChange={handleToggle}
        multiSelect
        sx={{
          overflow: 'auto',
          scrollbarGutter: 'stable',
        }}
      >
        {isCreateNewPageOpen ? (
          <EditableTreeItem
            itemId="::create::"
            isEditing
            suggestedNewItemName={nextProposedName}
            onEdit={handleCreateNewCommit}
            onCancel={handleCloseCreateNewPage}
            validateItemName={validatePageName}
          />
        ) : null}
        {alphabeticSortedPages.map((page) => (
          <PagesExplorerTreeItem
            key={page.id}
            itemId={page.id}
            toolpadNodeId={page.id}
            labelText={page.name}
            title={appDom.getPageDisplayName(page)}
            onRenameNode={handleRenameNode}
            onDuplicateNode={handleDuplicateNode}
            onDeleteNode={handleDeletePage}
            validateItemName={validatePageName}
          />
        ))}
      </SimpleTreeView>
    </PagesExplorerRoot>
  );
}
