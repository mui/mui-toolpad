import {
  Box,
  Stack,
  TextField,
  InputAdornment,
  Alert,
  MenuItem,
  Typography,
  inputLabelClasses,
  inputBaseClasses,
} from '@mui/material';
import * as React from 'react';
import { BindableAttrValue, LiveBinding } from '@toolpad/studio-runtime';
import { useBrowserJsRuntime } from '@toolpad/studio-runtime/jsBrowserRuntime';
import invariant from 'invariant';
import * as appDom from '@toolpad/studio-runtime/appDom';
import { usePageEditorState } from '../PageEditorProvider';
import dataSources from '../../../../toolpadDataSources/client';
import { useEvaluateLiveBinding } from '../../useEvaluateLiveBinding';
import { useAppState, useAppStateApi } from '../../../AppState';
import { ConnectionContextProvider } from '../../../../toolpadDataSources/context';
import BindableEditor from '../BindableEditor';
import { useProjectApi } from '../../../../projectApi';

interface QueryEditorProps {
  draft: appDom.QueryNode;
  saved?: appDom.QueryNode;
}

function refetchIntervalInSeconds(maybeInterval?: number) {
  if (typeof maybeInterval !== 'number') {
    return undefined;
  }
  const seconds = Math.floor(maybeInterval / 1000);
  return seconds > 0 ? seconds : undefined;
}

interface QuerySettingsTabProps {
  draft: appDom.QueryNode;
  liveEnabled: LiveBinding;
  pageState: any;
  globalScopeMeta: any;
  jsBrowserRuntime: any;
}

function QuerySettingsTab({
  draft,
  liveEnabled,
  pageState,
  globalScopeMeta,
  jsBrowserRuntime,
}: QuerySettingsTabProps) {
  const appStateApi = useAppStateApi();

  const updateAttribute = React.useCallback(
    function updateAttribute<K extends keyof appDom.QueryNode['attributes']>(
      attrName: K,
      attrValue: appDom.QueryNode['attributes'][K],
    ) {
      appStateApi.updateQueryDraft((node) => ({
        ...node,
        attributes: {
          ...node.attributes,
          [attrName]: attrValue,
        },
      }));
    },
    [appStateApi],
  );

  const handleModeChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.value === 'mutation' || event.target.value === 'query') {
        updateAttribute('mode', event.target.value);
      }
    },
    [updateAttribute],
  );

  const handleEnabledChange = React.useCallback(
    (newValue: BindableAttrValue<boolean> | null) => {
      if (newValue !== null) {
        updateAttribute('enabled', newValue);
      }
    },
    [updateAttribute],
  );

  const handleRefetchIntervalChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const interval = Number(event.target.value);

      if (!Number.isNaN(interval) && interval > 0) {
        updateAttribute('refetchInterval', interval * 1000);
      }
    },
    [updateAttribute],
  );
  return (
    <Box
      display={'flex'}
      flexDirection={'column'}
      sx={{
        p: 0.25,
        mt: 1,
        ml: 1,
        mr: 1,
      }}
    >
      <Stack
        display="grid"
        gridTemplateRows="1fr 1fr 1fr"
        gridTemplateColumns={'0.45fr 1fr'}
        rowGap={0.5}
      >
        <Typography fontSize={12} sx={{ alignSelf: 'center' }}>
          Set query mode:
        </Typography>
        <TextField
          select
          label="mode"
          value={draft?.attributes?.mode ?? 'query'}
          onChange={handleModeChange}
          sx={{
            [`& .${inputLabelClasses.root}`]: { fontSize: 12 },
            [`& .${inputBaseClasses.root}`]: { fontSize: 12 },
          }}
        >
          <MenuItem value="query">Fetch at any time to always be available on the page</MenuItem>
          <MenuItem value="mutation">Only fetch on manual action</MenuItem>
        </TextField>
        {draft?.attributes?.mode !== 'mutation' ? (
          <React.Fragment>
            <Typography fontSize={12} sx={{ alignSelf: 'center' }}>
              Set refetch interval:
            </Typography>
            <TextField
              sx={{
                [`& .${inputLabelClasses.root}`]: { fontSize: 12 },
                [`& .${inputBaseClasses.root}`]: { fontSize: 12 },
                maxWidth: 200,
              }}
              type="number"
              label="Refetch interval"
              value={refetchIntervalInSeconds(draft?.attributes?.refetchInterval) ?? ''}
              onChange={handleRefetchIntervalChange}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">s</InputAdornment>,
                },
              }}
            />
            <Typography fontSize={12} sx={{ alignSelf: 'center' }}>
              Set query enabled/disabled:
            </Typography>
            <BindableEditor<boolean>
              liveBinding={liveEnabled}
              globalScope={pageState}
              globalScopeMeta={globalScopeMeta}
              jsRuntime={jsBrowserRuntime}
              label="Enabled"
              propType={{ type: 'boolean' }}
              value={draft?.attributes?.enabled ?? true}
              onChange={handleEnabledChange}
              sx={{ maxWidth: 100 }}
            />
          </React.Fragment>
        ) : null}
      </Stack>
    </Box>
  );
}

export default function QueryEditorPanel({ draft, saved }: QueryEditorProps) {
  const { dom } = useAppState();
  const projectApi = useProjectApi();

  const connectionId =
    appDom.deref(saved ? saved?.attributes?.connectionId : draft?.attributes?.connectionId) ?? null;

  const connection = connectionId ? appDom.getMaybeNode(dom, connectionId, 'connection') : null;
  const dataSourceId = saved ? saved?.attributes?.dataSource : draft?.attributes?.dataSource;
  const dataSource = (dataSourceId && dataSources[dataSourceId]) || null;

  const connectionParams = connection?.attributes?.params;

  const { pageState, globalScopeMeta } = usePageEditorState();

  const queryEditorContext = React.useMemo(
    () => (dataSourceId ? { dataSourceId, connectionId } : null),
    [dataSourceId, connectionId],
  );

  const jsBrowserRuntime = useBrowserJsRuntime();

  const liveEnabled = useEvaluateLiveBinding({
    jsRuntime: jsBrowserRuntime,
    input: draft?.attributes?.enabled || null,
    globalScope: pageState,
  });

  const execPrivate = React.useCallback(
    (method: string, args: any[]) => {
      invariant(dataSourceId, 'dataSourceId must be set');
      return projectApi.methods.dataSourceExecPrivate(dataSourceId, method, args);
    },
    [projectApi, dataSourceId],
  );

  return dataSourceId && dataSource && queryEditorContext ? (
    <ConnectionContextProvider value={queryEditorContext}>
      <Box sx={{ height: '100%', p: 0, overflow: 'hidden' }}>
        <dataSource.QueryEditor
          connectionParams={connectionParams}
          value={draft}
          globalScope={pageState}
          globalScopeMeta={globalScopeMeta}
          execApi={execPrivate}
          settingsTab={
            <QuerySettingsTab
              {...{
                draft,
                liveEnabled,
                pageState,
                globalScopeMeta,
                jsBrowserRuntime,
              }}
            />
          }
        />
      </Box>
    </ConnectionContextProvider>
  ) : (
    <Alert severity="error">Datasource &quot;{dataSourceId}&quot; not found</Alert>
  );
}
