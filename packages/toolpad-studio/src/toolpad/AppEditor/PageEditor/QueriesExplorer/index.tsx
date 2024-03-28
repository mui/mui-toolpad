import * as React from 'react';
import clsx from 'clsx';
import { NodeId } from '@toolpad/studio-runtime';
import invariant from 'invariant';
import {
  styled,
  Box,
  Button,
  IconButton,
  Typography,
  Popover,
  Stack,
  Paper,
  SxProps,
} from '@mui/material';
import { SimpleTreeView, treeItemClasses } from '@mui/x-tree-view';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import useBoolean from '@toolpad/utils/hooks/useBoolean';
import * as appDom from '@toolpad/studio-runtime/appDom';
import dataSources from '../../../../toolpadDataSources/client';
import QueryIcon from '../../QueryIcon';
import { useAppState, useAppStateApi } from '../../../AppState';
import EditableTreeItem, { EditableTreeItemProps } from '../../../../components/EditableTreeItem';
import NodeMenu from '../../NodeMenu';
import ExplorerHeader from '../../ExplorerHeader';

const classes = {
  treeItemMenuButton: 'Toolpad__QueryListItem',
  treeItemMenuOpen: 'Toolpad__QueryListItemMenuOpen',
};

const StyledTreeItem = styled(EditableTreeItem)({
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
  onDeleteNode?: (nodeId: NodeId) => void;
  onDuplicateNode?: (nodeId: NodeId) => void;
  onRenameNode?: (nodeId: NodeId, updatedName: string) => void;
  onSelectNode?: (nodeId: NodeId) => void;
  onCreate?: (event: React.MouseEvent, mode?: appDom.FetchMode) => void;
  labelTextSx?: SxProps;
  labelIconId?: string;
  labelIconSx?: SxProps;
  createLabelText?: string;
  deleteLabelText?: string;
  renameLabelText?: string;
  duplicateLabelText?: string;
  toolpadNodeId?: NodeId;
}

function DataTreeItem(props: StyledTreeItemProps) {
  const {
    itemId,
    labelText,
    labelTextSx,
    labelIconSx,
    labelIconId,
    onCreate,
    onSelectNode,
    onDeleteNode,
    onDuplicateNode,
    onRenameNode,
    createLabelText,
    deleteLabelText = 'Delete',
    duplicateLabelText = 'Duplicate',
    renameLabelText = 'Rename',
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

  const validateEditableQueryName = React.useCallback(
    (newName: string) => {
      if (newName !== labelText && validateItemName) {
        return validateItemName(newName);
      }
      return { isValid: true };
    },
    [labelText, validateItemName],
  );

  const handleClick = React.useCallback(() => {
    invariant(toolpadNodeId, 'DataTreeItem should only be used for nodes with a toolpadNodeId');
    onSelectNode?.(toolpadNodeId);
  }, [onSelectNode, toolpadNodeId]);

  const queryCreationMode = React.useMemo(() => {
    if (props.itemId === ':query') {
      return 'query';
    }
    if (props.itemId === ':mutation') {
      return 'mutation';
    }
    return undefined;
  }, [props.itemId]);

  return (
    <StyledTreeItem
      itemId={itemId}
      labelText={labelText}
      renderLabel={(children) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }} onClick={handleClick}>
          <QueryIcon id={labelIconId || 'query'} sx={{ fontSize: 24, my: 0, ...labelIconSx }} />
          {children}
          {onCreate ? (
            <IconButton
              aria-label={createLabelText}
              onClick={(event) => {
                onCreate(event, queryCreationMode);
              }}
              size="small"
            >
              <AddIcon fontSize="inherit" />
            </IconButton>
          ) : null}
          {toolpadNodeId ? (
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
              nodeId={toolpadNodeId}
              deleteLabelText={deleteLabelText}
              duplicateLabelText={duplicateLabelText}
              renameLabelText={renameLabelText}
              onRenameNode={startEditing}
              onDeleteNode={onDeleteNode}
              onDuplicateNode={onDuplicateNode}
            />
          ) : null}
        </Box>
      )}
      suggestedNewItemName={labelText}
      onCancel={stopEditing}
      isEditing={isEditing}
      {...(onRenameNode ? { onEdit: handleRenameConfirm } : {})}
      validateItemName={validateEditableQueryName}
      {...other}
    />
  );
}

interface CreatePopoverProps {
  anchorEl: Element | null;
  createPopoverOpen: boolean;
  handleCreateNode: (dataSourceId: string) => () => void;
  handleCreateClose: () => void;
  createMode: appDom.FetchMode | undefined;
}

function CreatePopover({
  anchorEl,
  createPopoverOpen,
  handleCreateNode,
  handleCreateClose,
  createMode,
}: CreatePopoverProps) {
  return (
    <Popover
      open={createPopoverOpen}
      anchorEl={anchorEl}
      onClose={handleCreateClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
    >
      <Paper sx={{ p: 2, maxWidth: 500 }}>
        <Typography variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
          {createMode === 'query'
            ? 'Make backend data available as state on the page'
            : 'Run an action on the page'}
        </Typography>
        <Stack direction="row" gap={1} display={'grid'} gridTemplateColumns={'1fr 1fr'}>
          {Object.keys(dataSources).map((dataSourceId) => {
            const dataSource = dataSources[dataSourceId];
            return (
              <Button
                key={dataSourceId}
                sx={{ minHeight: 50, minWidth: 150 }}
                variant="outlined"
                onClick={handleCreateNode(dataSourceId)}
              >
                <QueryIcon id={dataSourceId} sx={{ fontSize: 28 }} />{' '}
                {dataSource?.displayName || dataSourceId}
              </Button>
            );
          })}
        </Stack>
      </Paper>
    </Popover>
  );
}

interface ExplorerProps {
  nodes: appDom.QueryNode[];
  setAnchorEl: (anchorEl: Element | null) => void;
  headerText: string;
  nodeName: string;
}

function Explorer({ nodes, setAnchorEl, nodeName, headerText }: ExplorerProps) {
  const { dom, currentView } = useAppState();
  const appStateApi = useAppStateApi();
  const currentPageName = currentView.name;

  const handleQuerySelect = React.useCallback(
    (selectedQueryId: NodeId) => {
      appStateApi.openQueryTab(selectedQueryId);
    },
    [appStateApi],
  );

  const handleCreateClick = React.useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
    },
    [setAnchorEl],
  );

  const handleDeleteNode = React.useCallback(
    (selectedQueryId: NodeId) => {
      const selectedQueryTabIndex = currentView.queryPanel?.queryTabs?.findIndex(
        (tab) => tab.meta?.id === selectedQueryId,
      );

      appStateApi.closeQueryTab(selectedQueryId, selectedQueryTabIndex, true);
    },
    [appStateApi, currentView],
  );

  const existingNames = React.useMemo(() => {
    if (!currentPageName) {
      return undefined;
    }
    const currentPageNode = appDom.getPageByName(dom, currentPageName);
    if (!currentPageNode) {
      return undefined;
    }
    return appDom.getExistingNamesForChildren(dom, currentPageNode);
  }, [currentPageName, dom]);

  const handleDuplicateNode = React.useCallback(
    (nodeId: NodeId) => {
      const node = appDom.getNode(dom, nodeId, 'query');
      invariant(
        currentPageName,
        'handleDuplicateNode should only be used for queries, which should always belong to a page',
      );
      const currentPageNode = appDom.getPageByName(dom, currentPageName);

      const newName = appDom.proposeName(node.name, existingNames);
      const copy = appDom.createNode(dom, 'query', { ...node, name: newName });
      if (!currentPageNode) {
        return;
      }
      appStateApi.update((draft) => appDom.addNode(draft, copy, currentPageNode, 'queries'), {
        kind: 'page',
        name: currentPageName,
        view: { kind: 'query', nodeId: copy.id },
      });
    },
    [dom, currentPageName, existingNames, appStateApi],
  );

  const validateName = React.useCallback(
    (queryName: string) => {
      if (!existingNames) {
        return {
          isValid: true,
        };
      }

      const validationErrorMessage = appDom.validateNodeName(queryName, existingNames, 'query');
      return {
        isValid: !validationErrorMessage,
        ...(validationErrorMessage ? { errorMessage: validationErrorMessage } : {}),
      };
    },
    [existingNames],
  );

  const handleRenameNode = React.useCallback(
    (nodeId: NodeId, updatedName: string) => {
      const node = appDom.getNode(dom, nodeId, 'query');
      appStateApi.update((draft) => appDom.setNodeName(draft, node, updatedName), {
        ...currentView,
        queryPanel: {
          ...currentView.queryPanel,
          queryTabs: currentView.queryPanel?.queryTabs?.map((tab) => {
            if (tab?.meta?.id === nodeId && tab.draft && tab.saved) {
              const updatedNode = { ...tab.draft, name: updatedName };
              return {
                ...tab,
                meta: {
                  ...tab.meta,
                  name: updatedName,
                },
                draft: updatedNode,
                saved: updatedNode,
              };
            }
            return tab;
          }),
        },
      });
    },
    [dom, appStateApi, currentView],
  );

  return (
    <Stack data-testid={`${nodeName}-explorer`} sx={{ height: '100%', width: '100%' }}>
      <ExplorerHeader
        headerIcon={<QueryIcon mode={nodeName} />}
        headerText={headerText}
        onCreate={handleCreateClick}
        createLabelText={`Create new ${nodeName}`}
      />
      <SimpleTreeView
        aria-label={`${nodeName} explorer`}
        defaultExpandedItems={[`:queries`]}
        selectedItems={
          currentView.kind === 'page' && currentView.view?.kind === 'query'
            ? currentView.view.nodeId
            : ''
        }
        sx={{
          flexGrow: 1,
          maxWidth: 400,
          overflowY: 'auto',
          scrollbarGutter: 'stable',
        }}
      >
        {nodes.map((node) => (
          <DataTreeItem
            key={node.id}
            itemId={node.id}
            toolpadNodeId={node.id}
            aria-level={1}
            aria-label={node.name}
            labelText={node.name}
            labelTextSx={{ fontSize: 13 }}
            labelIconId={node.attributes?.dataSource}
            onDuplicateNode={handleDuplicateNode}
            onDeleteNode={handleDeleteNode}
            onSelectNode={handleQuerySelect}
            onRenameNode={handleRenameNode}
            validateItemName={validateName}
          />
        ))}
      </SimpleTreeView>
    </Stack>
  );
}

export function QueriesExplorer() {
  const { dom, currentView } = useAppState();
  const appStateApi = useAppStateApi();
  const currentPageName = currentView.name;
  const queryNodes = React.useMemo(() => {
    if (!currentPageName) {
      return [];
    }
    if (currentPageName) {
      const currentPageNode = appDom.getPageByName(dom, currentPageName);
      if (currentPageNode) {
        return appDom.getChildNodes(dom, currentPageNode).queries ?? [];
      }
    }
    return [];
  }, [currentPageName, dom]);

  const queries = React.useMemo(() => {
    return queryNodes.filter(
      (query) => query.attributes?.mode === 'query' || !query.attributes?.mode,
    );
  }, [queryNodes]);

  const [anchorEl, setAnchorEl] = React.useState<Element | null>(null);
  const createPopoverOpen = Boolean(anchorEl);
  const handleCreateClose = () => {
    setAnchorEl(null);
  };

  const handleCreateNode = React.useCallback(
    (dataSourceId: string) => () => {
      const dataSource = dataSources[dataSourceId];
      invariant(dataSource, `Selected non-existing dataSource "${dataSourceId}"`);
      invariant(
        currentPageName,
        'handleCreateNode should only be used for queries, which should always belong to a page',
      );

      appStateApi.createQueryTab(dataSource, dataSourceId, 'query');
      setAnchorEl(null);
    },
    [currentPageName, appStateApi],
  );

  return (
    <React.Fragment>
      <Explorer nodes={queries} setAnchorEl={setAnchorEl} headerText="Queries" nodeName="query" />
      <CreatePopover
        anchorEl={anchorEl}
        createPopoverOpen={createPopoverOpen}
        handleCreateNode={handleCreateNode}
        handleCreateClose={handleCreateClose}
        createMode={'query'}
      />
    </React.Fragment>
  );
}

export function ActionsExplorer() {
  const { dom, currentView } = useAppState();
  const appStateApi = useAppStateApi();
  const currentPageName = currentView.name;
  const queryNodes = React.useMemo(() => {
    if (!currentPageName) {
      return [];
    }
    if (currentPageName) {
      const currentPageNode = appDom.getPageByName(dom, currentPageName);
      if (currentPageNode) {
        return appDom.getChildNodes(dom, currentPageNode).queries ?? [];
      }
    }
    return [];
  }, [currentPageName, dom]);

  const actions = React.useMemo(() => {
    return queryNodes.filter((query) => query.attributes?.mode === 'mutation');
  }, [queryNodes]);

  const [anchorEl, setAnchorEl] = React.useState<Element | null>(null);
  const createPopoverOpen = Boolean(anchorEl);
  const handleCreateClose = () => {
    setAnchorEl(null);
  };

  const handleCreateNode = React.useCallback(
    (dataSourceId: string) => () => {
      const dataSource = dataSources[dataSourceId];
      invariant(dataSource, `Selected non-existing dataSource "${dataSourceId}"`);
      invariant(
        currentPageName,
        'handleCreateNode should only be used for queries, which should always belong to a page',
      );

      appStateApi.createQueryTab(dataSource, dataSourceId, 'mutation');
      setAnchorEl(null);
    },
    [currentPageName, appStateApi],
  );

  return (
    <React.Fragment>
      <Explorer nodes={actions} setAnchorEl={setAnchorEl} headerText="Actions" nodeName="action" />
      <CreatePopover
        anchorEl={anchorEl}
        createPopoverOpen={createPopoverOpen}
        handleCreateNode={handleCreateNode}
        handleCreateClose={handleCreateClose}
        createMode={'mutation'}
      />
    </React.Fragment>
  );
}
