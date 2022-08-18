import {
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  DialogActions,
  Checkbox,
  FormControlLabel,
  TextField,
  InputAdornment,
  Divider,
  MenuItem,
  SxProps,
  Alert,
  Box,
} from '@mui/material';
import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import { BindableAttrValue, NodeId } from '@mui/toolpad-core';
import invariant from 'invariant';
import useLatest from '../../../utils/useLatest';
import { usePageEditorState } from './PageEditorProvider';
import * as appDom from '../../../appDom';
import { QueryEditorModel, QueryEditorShellProps } from '../../../types';
import dataSources from '../../../toolpadDataSources/client';
import NodeNameEditor from '../NodeNameEditor';
import { omit, update } from '../../../utils/immutability';
import { useEvaluateLiveBinding } from '../useEvaluateLiveBinding';
import { Maybe, WithControlledProp } from '../../../utils/types';
import { useDom, useDomApi } from '../../DomLoader';
import { ConnectionContextProvider } from '../../../toolpadDataSources/context';
import BindableEditor from './BindableEditor';
import { createProvidedContext } from '../../../utils/react';

export type ConnectionOption = {
  connectionId: NodeId | null;
  dataSourceId: string;
};

const EMPTY_OBJECT = {};

export interface ConnectionSelectProps extends WithControlledProp<ConnectionOption | null> {
  dataSource?: Maybe<string>;
  sx?: SxProps;
}

export function ConnectionSelect({ sx, dataSource, value, onChange }: ConnectionSelectProps) {
  const dom = useDom();

  const app = appDom.getApp(dom);
  const { connections = [] } = appDom.getChildNodes(dom, app);

  const options: ConnectionOption[] = React.useMemo(() => {
    const result: ConnectionOption[] = [];

    for (const [dataSourceId, config] of Object.entries(dataSources)) {
      if (config?.hasDefault) {
        if (!dataSource || dataSource === dataSourceId) {
          result.push({
            dataSourceId,
            connectionId: null,
          });
        }
      }
    }

    for (const connection of connections) {
      const connectionDataSourceId = connection.attributes.dataSource.value;
      if (!dataSource || dataSource === connectionDataSourceId) {
        const connectionDataSource = dataSources[connectionDataSourceId];
        if (connectionDataSource) {
          result.push({
            connectionId: connection.id,
            dataSourceId: connectionDataSourceId,
          });
        }
      }
    }

    return result;
  }, [connections, dataSource]);

  const handleSelectionChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const index = Number(event.target.value);
      onChange(options[index] || null);
    },
    [onChange, options],
  );

  const selection = React.useMemo(() => {
    if (!value) {
      return '';
    }
    return String(
      options.findIndex(
        (option) =>
          option.connectionId === value.connectionId && option.dataSourceId === value.dataSourceId,
      ),
    );
  }, [options, value]);

  return (
    <TextField
      sx={sx}
      select
      fullWidth
      value={selection}
      label="Connection"
      onChange={handleSelectionChange}
    >
      {options.map((option, index) => {
        const config = dataSources[option.dataSourceId];
        const dataSourceLabel = config
          ? config.displayName
          : `<unknown datasource "${option.dataSourceId}">`;

        const connectionLabel = option.connectionId
          ? appDom.getMaybeNode(dom, option.connectionId)?.name
          : '<default>';
        return (
          <MenuItem key={index} value={index}>
            {dataSourceLabel} | {connectionLabel}
          </MenuItem>
        );
      })}
    </TextField>
  );
}

interface RenderDialogActions {
  (params: { isDirty?: boolean; onCommit?: () => void }): React.ReactNode;
}

interface QueryEditorDialogContext {
  renderDialogTitle: () => React.ReactNode;
  renderQueryOptions: () => React.ReactNode;
  renderDialogActions: RenderDialogActions;
}

const [useQueryEditorDialogContext, QueryEditorDialogContextProvider] =
  createProvidedContext<QueryEditorDialogContext>('QueryEditorDialog');

export function QueryEditorShell({ children, isDirty, onCommit }: QueryEditorShellProps) {
  const { renderDialogTitle, renderQueryOptions, renderDialogActions } =
    useQueryEditorDialogContext();

  return (
    <React.Fragment>
      {renderDialogTitle()}

      <Divider />

      <DialogContent
        sx={{
          // height will be clipped by max-height
          height: '100vh',
          p: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            position: 'relative',
            display: 'flex',
          }}
        >
          {children}
        </Box>

        {renderQueryOptions()}
      </DialogContent>

      {renderDialogActions({ isDirty, onCommit })}
    </React.Fragment>
  );
}

function refetchIntervalInSeconds(maybeInterval?: number) {
  if (typeof maybeInterval !== 'number') {
    return undefined;
  }
  const seconds = Math.floor(maybeInterval / 1000);
  return seconds > 0 ? seconds : undefined;
}

interface DataSourceSelectorProps<Q> {
  open: boolean;
  onClose: () => void;
  onCreated: (newNode: appDom.QueryNode<Q>) => void;
}

function ConnectionSelectorDialog<Q>({ open, onCreated, onClose }: DataSourceSelectorProps<Q>) {
  const dom = useDom();

  const [input, setInput] = React.useState<ConnectionOption | null>(null);

  const handleCreateClick = React.useCallback(() => {
    invariant(input, `Create button should be disabled when there's no input`);

    const { connectionId = null, dataSourceId } = input;

    if (connectionId) {
      const connection = appDom.getMaybeNode(dom, connectionId, 'connection');
      invariant(connection, `Selected non-existing connection "${connectionId}"`);
    }

    const dataSource = dataSources[dataSourceId];
    invariant(dataSource, `Selected non-existing dataSource "${dataSourceId}"`);

    const queryNode = appDom.createNode(dom, 'query', {
      attributes: {
        query: appDom.createConst(dataSource.getInitialQueryValue()),
        connectionId: appDom.createConst(appDom.ref(connectionId)),
        dataSource: appDom.createConst(dataSourceId),
      },
    });

    onCreated(queryNode);
  }, [dom, input, onCreated]);

  return (
    <Dialog fullWidth open={open} onClose={onClose} scroll="body">
      <DialogTitle>Create Query</DialogTitle>
      <DialogContent>
        <ConnectionSelect sx={{ my: 1 }} value={input} onChange={setInput} />
      </DialogContent>
      <DialogActions>
        <Button color="inherit" variant="text" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!input} onClick={handleCreateClick}>
          Create query
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface QueryNodeEditorProps<Q, P> {
  open: boolean;
  onClose: () => void;
  onSave: (newNode: appDom.QueryNode) => void;
  onRemove: (newNode: appDom.QueryNode) => void;
  node: appDom.QueryNode<Q, P>;
}

function QueryNodeEditorDialog<Q, P>({
  open,
  node,
  onClose,
  onRemove,
  onSave,
}: QueryNodeEditorProps<Q, P>) {
  const { appId } = usePageEditorState();
  const dom = useDom();

  const [input, setInput] = React.useState(appDom.fromLegacyQueryNode(node));
  React.useEffect(() => {
    if (open) {
      setInput(appDom.fromLegacyQueryNode(node));
    }
  }, [open, node]);

  const connectionId = input.attributes.connectionId.value
    ? appDom.deref(input.attributes.connectionId.value)
    : null;
  const connection = connectionId ? appDom.getMaybeNode(dom, connectionId, 'connection') : null;
  const inputParams = input.params || EMPTY_OBJECT;
  const dataSourceId = input.attributes.dataSource?.value || null;
  const dataSource = (dataSourceId && dataSources[dataSourceId]) || null;

  const connectionParams = connection?.attributes.params.value;

  const queryModel = React.useMemo(
    () => ({
      query: input.attributes.query.value,
      params: inputParams,
    }),
    [input.attributes.query.value, inputParams],
  );

  const handleQueryModelChange = React.useCallback(
    (model: QueryEditorModel<Q>) => {
      onSave(
        update(input, {
          attributes: update(input.attributes, {
            query: appDom.createConst(model.query),
          }),
          params: model.params,
        }),
      );
    },
    [input, onSave],
  );

  const { pageState } = usePageEditorState();

  const handleConnectionChange = React.useCallback(
    (newConnectionOption: ConnectionOption | null) => {
      if (newConnectionOption) {
        setInput((existing) =>
          update(existing, {
            attributes: update(existing.attributes, {
              connectionId: appDom.createConst(appDom.ref(newConnectionOption.connectionId)),
              dataSource: appDom.createConst(newConnectionOption.dataSourceId),
            }),
          }),
        );
      } else {
        setInput((existing) =>
          update(existing, {
            attributes: update(existing.attributes, {
              connectionId: undefined,
              dataSource: undefined,
            }),
          }),
        );
      }
    },
    [],
  );

  const handleRefetchOnWindowFocusChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setInput((existing) =>
        update(existing, {
          attributes: update(existing.attributes, {
            refetchOnWindowFocus: appDom.createConst(event.target.checked),
          }),
        }),
      );
    },
    [],
  );

  const handleEnabledChange = React.useCallback((newValue: BindableAttrValue<boolean> | null) => {
    setInput((existing) =>
      update(existing, {
        attributes: update(existing.attributes, {
          enabled: newValue || undefined,
        }),
      }),
    );
  }, []);

  const handleRefetchOnReconnectChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setInput((existing) =>
        update(existing, {
          attributes: update(existing.attributes, {
            refetchOnReconnect: appDom.createConst(event.target.checked),
          }),
        }),
      );
    },
    [],
  );

  const handleRefetchIntervalChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const interval = Number(event.target.value);

      setInput((existing) =>
        update(existing, {
          attributes:
            Number.isNaN(interval) || interval <= 0
              ? omit(existing.attributes, 'refetchInterval')
              : update(existing.attributes, {
                  refetchInterval: appDom.createConst(interval * 1000),
                }),
        }),
      );
    },
    [],
  );

  const handleRemove = React.useCallback(() => {
    onRemove(node);
    onClose();
  }, [onRemove, node, onClose]);

  const isInputSaved = node === input;

  const handleClose = React.useCallback(() => {
    const ok = isInputSaved
      ? true
      : // eslint-disable-next-line no-alert
        window.confirm(
          'Are you sure you want to close the editor. All unsaved progress will be lost.',
        );

    if (ok) {
      onClose();
    }
  }, [onClose, isInputSaved]);

  const queryEditorContext = React.useMemo(
    () => (dataSourceId ? { appId, dataSourceId, connectionId } : null),
    [appId, dataSourceId, connectionId],
  );

  const liveEnabled = useEvaluateLiveBinding({
    input: input.attributes.enabled || null,
    globalScope: pageState,
  });

  const renderDialogTitle = React.useCallback(
    () => (
      <DialogTitle>
        <Stack direction="row" gap={2}>
          <NodeNameEditor node={node} />
          <ConnectionSelect
            dataSource={dataSourceId}
            value={
              input.attributes.dataSource
                ? {
                    connectionId: appDom.deref(input.attributes.connectionId.value) || null,
                    dataSourceId: input.attributes.dataSource.value,
                  }
                : null
            }
            onChange={handleConnectionChange}
          />
        </Stack>
      </DialogTitle>
    ),
    [
      dataSourceId,
      handleConnectionChange,
      input.attributes.connectionId.value,
      input.attributes.dataSource,
      node,
    ],
  );

  const renderQueryOptions = React.useCallback(
    () => (
      <Stack direction="row" alignItems="center" sx={{ pt: 2, px: 3, gap: 2 }}>
        <BindableEditor
          liveBinding={liveEnabled}
          globalScope={pageState}
          server
          label="Enabled"
          propType={{ type: 'boolean' }}
          value={input.attributes.enabled ?? appDom.createConst(true)}
          onChange={handleEnabledChange}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={input.attributes.refetchOnWindowFocus?.value ?? true}
              onChange={handleRefetchOnWindowFocusChange}
            />
          }
          label="Refetch on window focus"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={input.attributes.refetchOnReconnect?.value ?? true}
              onChange={handleRefetchOnReconnectChange}
            />
          }
          label="Refetch on network reconnect"
        />
        <TextField
          InputProps={{
            startAdornment: <InputAdornment position="start">s</InputAdornment>,
          }}
          sx={{ maxWidth: 300 }}
          type="number"
          label="Refetch interval"
          value={refetchIntervalInSeconds(input.attributes.refetchInterval?.value) ?? ''}
          onChange={handleRefetchIntervalChange}
        />
      </Stack>
    ),
    [
      input,
      handleEnabledChange,
      handleRefetchIntervalChange,
      handleRefetchOnReconnectChange,
      handleRefetchOnWindowFocusChange,
      liveEnabled,
      pageState,
    ],
  );

  const renderDialogActions: RenderDialogActions = React.useCallback(
    ({ isDirty, onCommit }) => {
      return (
        <DialogActions>
          <Button color="inherit" variant="text" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleRemove}>Remove</Button>
          <Button disabled={isInputSaved && !isDirty} onClick={onCommit}>
            Save
          </Button>
        </DialogActions>
      );
    },
    [handleClose, handleRemove, isInputSaved],
  );

  const queryEditorShellContext: QueryEditorDialogContext = {
    renderDialogTitle,
    renderQueryOptions,
    renderDialogActions,
  };

  return (
    <QueryEditorDialogContextProvider value={queryEditorShellContext}>
      <Dialog fullWidth maxWidth="xl" open={open} onClose={onClose}>
        {dataSourceId && dataSource && queryEditorContext ? (
          <ConnectionContextProvider value={queryEditorContext}>
            <dataSource.QueryEditor
              QueryEditorShell={QueryEditorShell}
              connectionParams={connectionParams}
              value={queryModel}
              onChange={handleQueryModelChange}
              globalScope={pageState}
            />
          </ConnectionContextProvider>
        ) : (
          <Alert severity="error">Datasource &quot;{dataSourceId}&quot; not found</Alert>
        )}
      </Dialog>
    </QueryEditorDialogContextProvider>
  );
}

type DialogState = {
  nodeId?: NodeId;
};

export default function QueryEditor() {
  const dom = useDom();
  const state = usePageEditorState();
  const domApi = useDomApi();

  const [dialogState, setDialogState] = React.useState<DialogState | null>(null);

  const handleEditStateDialogClose = React.useCallback(() => setDialogState(null), []);

  const page = appDom.getNode(dom, state.nodeId, 'page');
  const { queries = [] } = appDom.getChildNodes(dom, page) ?? [];

  const handleCreate = React.useCallback(() => {
    setDialogState({});
  }, []);

  const handleCreated = React.useCallback(
    (node: appDom.QueryNode) => {
      domApi.addNode(node, page, 'queries');
      setDialogState({ nodeId: node.id });
    },
    [domApi, page],
  );

  const handleSave = React.useCallback(
    (node: appDom.QueryNode) => {
      domApi.saveNode(node);
    },
    [domApi],
  );

  const handleRemove = React.useCallback(
    (node: appDom.QueryNode) => {
      domApi.removeNode(node.id);
    },
    [domApi],
  );

  const editedNode = dialogState?.nodeId
    ? appDom.getMaybeNode(dom, dialogState.nodeId, 'query')
    : null;

  // To keep it around during closing animation
  const lastEditednode = useLatest(editedNode);

  return (
    <Stack spacing={1} alignItems="start">
      <Button color="inherit" startIcon={<AddIcon />} onClick={handleCreate}>
        Add query
      </Button>
      <List>
        {queries.map((queryNode) => {
          return (
            <ListItem
              key={queryNode.id}
              button
              onClick={() => setDialogState({ nodeId: queryNode.id })}
            >
              {queryNode.name}
            </ListItem>
          );
        })}
      </List>
      {dialogState?.nodeId && lastEditednode ? (
        <QueryNodeEditorDialog
          open={!!dialogState}
          node={lastEditednode}
          onSave={handleSave}
          onRemove={handleRemove}
          onClose={handleEditStateDialogClose}
        />
      ) : (
        <ConnectionSelectorDialog
          open={!!dialogState}
          onCreated={handleCreated}
          onClose={handleEditStateDialogClose}
        />
      )}
    </Stack>
  );
}
