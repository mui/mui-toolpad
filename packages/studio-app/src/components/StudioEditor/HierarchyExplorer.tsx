import { TreeView } from '@mui/lab';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import * as React from 'react';
import TreeItem, { useTreeItem, TreeItemContentProps } from '@mui/lab/TreeItem';
import clsx from 'clsx';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useQuery } from 'react-query';
import { NodeId } from '../../types';
import * as studioDom from '../../studioDom';
import { useEditorApi, useEditorState } from './EditorProvider';
import { useDom, useDomApi } from '../DomProvider';
import client from '../../api';

const CustomContent = React.forwardRef(function CustomContent(props: TreeItemContentProps, ref) {
  const { classes, className, label, nodeId, icon: iconProp, expansionIcon, displayIcon } = props;

  const {
    disabled,
    expanded,
    selected,
    focused,
    handleExpansion,
    handleSelection,
    preventSelection,
  } = useTreeItem(nodeId);

  const icon = iconProp || expansionIcon || displayIcon;

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    preventSelection(event);
  };

  const handleExpansionClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    handleExpansion(event);
  };

  const handleSelectionClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    handleSelection(event);
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className={clsx(className, classes.root, {
        [classes.expanded]: expanded,
        [classes.selected]: selected,
        [classes.focused]: focused,
        [classes.disabled]: disabled,
      })}
      onMouseDown={handleMouseDown}
      ref={ref as React.Ref<HTMLDivElement>}
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
      <div onClick={handleExpansionClick} className={classes.iconContainer}>
        {icon}
      </div>
      <Typography onClick={handleSelectionClick} component="div" className={classes.label}>
        {label}
      </Typography>
    </div>
  );
});

interface HierarchyExplorerElementItemProps {
  element: studioDom.StudioElementNode;
}

function HierarchyExplorerElementItem({ element }: HierarchyExplorerElementItemProps) {
  const dom = useDom();
  const { children = [], ...namedChildren } = studioDom.getChildNodes(dom, element);

  const defaultChildrenContent = children.map((child) => (
    <HierarchyExplorerElementItem key={child.id} element={child} />
  ));
  const namedChildrenContent = Object.entries(namedChildren).map(() => {
    // TODO: display `namedChildren` in the tree as well
    return null;
  });

  return (
    <TreeItem
      ContentComponent={CustomContent}
      nodeId={element.id}
      label={`${element.name} (${element.id})`}
    >
      {[...defaultChildrenContent, ...namedChildrenContent]}
    </TreeItem>
  );
}

interface HierarchyExplorerPageItemProps {
  page: studioDom.StudioPageNode;
}

function HierarchyExplorerPageItem({ page }: HierarchyExplorerPageItemProps) {
  const dom = useDom();
  const children = studioDom.getChildNodes(dom, page).children ?? [];
  return (
    <TreeItem ContentComponent={CustomContent} nodeId={page.id} label={`${page.name} (${page.id})`}>
      {children.map((child) => (
        <HierarchyExplorerElementItem key={child.id} element={child} />
      ))}
    </TreeItem>
  );
}

interface HierarchyExplorerApiItemProps {
  api: studioDom.StudioApiNode;
}

function HierarchyExplorerApiItem({ api }: HierarchyExplorerApiItemProps) {
  return (
    <TreeItem ContentComponent={CustomContent} nodeId={api.id} label={`${api.name} (${api.id})`} />
  );
}

interface CreateStudioApiDialogProps extends Pick<DialogProps, 'open' | 'onClose'> {}

function CreateStudioApiDialog({ onClose, ...props }: CreateStudioApiDialogProps) {
  const [connectionId, setConnectionID] = React.useState('');
  const dom = useDom();
  const domApi = useDomApi();
  const editorApi = useEditorApi();

  const connectionsQuery = useQuery('connections', client.query.getConnections);

  const handleSelectionChange = React.useCallback((event: SelectChangeEvent<string>) => {
    setConnectionID(event.target.value);
  }, []);

  return (
    <Dialog {...props} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const newApiNode = studioDom.createNode(dom, 'api', {
            props: {},
            connectionId,
          });
          const appNode = studioDom.getApp(dom);
          domApi.addNode(newApiNode, appNode.id, 'children');
          onClose?.(e, 'backdropClick');
          console.log(newApiNode.id);
          editorApi.openApiEditor(newApiNode.id);
        }}
        style={{
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <DialogTitle>Create a new MUI Studio API</DialogTitle>
        <DialogContent>
          <Typography>Please select a connection for your API</Typography>
          <FormControl size="small" fullWidth>
            <InputLabel id="select-connection-type">Connection</InputLabel>
            <Select
              size="small"
              fullWidth
              value={connectionId}
              labelId="select-connection-type"
              label="Connection"
              onChange={handleSelectionChange}
            >
              {(connectionsQuery.data || []).map(({ id, type, name }) => (
                <MenuItem key={id} value={id}>
                  {name} | {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button type="submit" disabled={!connectionId}>
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

interface CreateStudioPageDialogProps extends Pick<DialogProps, 'open' | 'onClose'> {}

function CreateStudioPageDialog({ onClose, ...props }: CreateStudioPageDialogProps) {
  const dom = useDom();
  const domApi = useDomApi();
  const editorApi = useEditorApi();
  const [title, setTitle] = React.useState('');

  return (
    <Dialog {...props} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const newPageNode = studioDom.createNode(dom, 'page', {
            title,
            state: {},
            props: {},
          });
          const appNode = studioDom.getApp(dom);
          domApi.addNode(newPageNode, appNode.id, 'children');
          onClose?.(e, 'backdropClick');
          editorApi.openPageEditor(newPageNode.id);
        }}
        style={{
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <DialogTitle>Create a new MUI Studio API</DialogTitle>
        <DialogContent>
          <TextField
            sx={{ my: 1 }}
            autoFocus
            fullWidth
            label="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button type="submit" disabled={!title}>
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export interface HierarchyExplorerProps {
  className?: string;
}

export default function HierarchyExplorer({ className }: HierarchyExplorerProps) {
  const state = useEditorState();
  const dom = useDom();
  const api = useEditorApi();

  const app = studioDom.getApp(dom);
  const pages = studioDom.getPages(dom, app);
  const apis = studioDom.getApis(dom, app);

  const [expanded, setExpanded] = React.useState<('' | NodeId)[]>([
    '',
    ...apis.map((apiNode) => apiNode.id),
    ...pages.map((pageNode) => pageNode.id),
  ]);

  const selected = state.selection ? [state.selection] : [];

  const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds as NodeId[]);
  };

  const handleSelect = (event: React.SyntheticEvent, nodeIds: string[]) => {
    const selectedNodeId: NodeId | undefined = nodeIds[0] as NodeId | undefined;
    if (selectedNodeId) {
      api.select(selectedNodeId);

      let node = studioDom.getNode(dom, selectedNodeId);
      if (studioDom.isElement(node)) {
        const page = studioDom.getElementPage(dom, node);
        if (page) {
          if (state.editor?.type === 'page' && page.id === state.editor.nodeId) {
            api.select(selectedNodeId);
          } else {
            node = page;
          }
        }
      }

      if (studioDom.isPage(node)) {
        if (state.editor?.type === 'page' && node.id === state.editor.nodeId) {
          api.deselect();
          return;
        }
        api.openPageEditor(node.id);
      }

      if (studioDom.isApi(node)) {
        if (state.editor?.type === 'api' && node.id === state.editor.nodeId) {
          return;
        }
        api.openApiEditor(node.id);
      }
    }
  };

  const [createApiDialogOpen, setCreateApiDialogOpen] = React.useState(0);
  const handleCreateApiDialogOpen = React.useCallback(
    () => setCreateApiDialogOpen(Math.random()),
    [],
  );
  const handleCreateApiDialogClose = React.useCallback(() => setCreateApiDialogOpen(0), []);

  const [createPageDialogOpen, setCreatePageDialogOpen] = React.useState(0);
  const handleCreatePageDialogOpen = React.useCallback(
    () => setCreatePageDialogOpen(Math.random()),
    [],
  );
  const handleCreatepageDialogClose = React.useCallback(() => setCreatePageDialogOpen(0), []);

  return (
    <div className={className}>
      <Button onClick={handleCreateApiDialogOpen}>New Api</Button>
      <Button onClick={handleCreatePageDialogOpen}>New Page</Button>
      <CreateStudioApiDialog
        key={createApiDialogOpen || undefined}
        open={!!createApiDialogOpen}
        onClose={handleCreateApiDialogClose}
      />
      <CreateStudioPageDialog
        key={createPageDialogOpen || undefined}
        open={!!createPageDialogOpen}
        onClose={handleCreatepageDialogClose}
      />
      <Typography>App Hierarchy</Typography>
      <TreeView
        aria-label="hierarchy explorer"
        selected={selected}
        onNodeSelect={handleSelect}
        expanded={expanded}
        onNodeToggle={handleToggle}
        multiSelect
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
      >
        <TreeItem ContentComponent={CustomContent} nodeId="" label="Apis">
          {apis.map((apiNode) => (
            <HierarchyExplorerApiItem key={apiNode.id} api={apiNode} />
          ))}
        </TreeItem>
        <TreeItem ContentComponent={CustomContent} nodeId="" label="Pages">
          {pages.map((page) => (
            <HierarchyExplorerPageItem key={page.id} page={page} />
          ))}
        </TreeItem>
      </TreeView>
    </div>
  );
}
