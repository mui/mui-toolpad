import * as React from 'react';
import LoadingButton from '@mui/lab/LoadingButton';
import { BindableAttrEntries } from '@toolpad/studio-runtime';
import { Alert, Box, Divider, Stack, Tab, Link, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { TabContext, TabList } from '@mui/lab';
import { useBrowserJsRuntime } from '@toolpad/studio-runtime/jsBrowserRuntime';
import { errorFrom } from '@toolpad/utils/errors';
import { useQuery } from '@tanstack/react-query';
import Grid from '@mui/material/Grid2';
import TabPanel from '../../components/TabPanel';
import { ClientDataSource, QueryEditorProps } from '../../types';
import { LocalPrivateApi, LocalQuery, LocalConnectionParams } from './types';
import {
  useEvaluateLiveBindingEntries,
  useEvaluateLiveBindings,
} from '../../toolpad/AppEditor/useEvaluateLiveBinding';
import { useAppState, useAppStateApi } from '../../toolpad/AppState';
import { QueryEditorTabType, QueryEditorToolsTabType } from '../../utils/domView';
import { Panel, PanelGroup, PanelResizeHandle } from '../../components/resizablePanels';
import JsonView from '../../components/JsonView';
import OpenCodeEditorButton from '../../toolpad/OpenCodeEditor';
import useQueryPreview from '../useQueryPreview';
import QueryPreview from '../QueryPreview';
import BindableEditor from '../../toolpad/AppEditor/PageEditor/BindableEditor';
import { getDefaultControl, usePropControlsContext } from '../../toolpad/propertyControls';
import { parseLegacyFunctionId, serializeFunctionId, transformLegacyFunctionId } from './shared';
import FunctionSelector from './FunctionSelector';
import HelpTooltipIcon from '../../components/HelpTooltipIcon';

const EMPTY_PARAMS: BindableAttrEntries = [];

interface ResolvedPreviewProps {
  preview: any;
}

function ResolvedPreview({ preview }: ResolvedPreviewProps): React.ReactElement | null {
  if (!preview) {
    return (
      <Alert
        severity="info"
        sx={(theme) => ({
          my: theme.spacing(2),
          mx: 'auto',
          p: theme.spacing(1),
          fontSize: theme.typography.pxToRem(11),
          width: 'fit-content',
        })}
      >
        No request has been sent yet. <br />
        Click Run
        <PlayArrowIcon
          aria-label="Run preview"
          sx={{ verticalAlign: 'middle', fontSize: '12px', mr: 0.25 }}
        />
        to preview the response here.
      </Alert>
    );
  }

  const { data } = preview;

  return <JsonView sx={{ height: '100%' }} src={data} copyToClipboard />;
}

function QueryEditor({
  globalScope,
  globalScopeMeta,
  value: input,
  settingsTab,
  execApi,
}: QueryEditorProps<LocalConnectionParams, LocalQuery, LocalPrivateApi>) {
  const appStateApi = useAppStateApi();
  const { currentView } = useAppState();
  const introspection = useQuery({
    queryKey: ['introspection'],
    queryFn: () => execApi('introspection', []),
    retry: false,
  });

  const updateProp = React.useCallback(
    function updateProp<K extends keyof LocalQuery>(prop: K, value: LocalQuery[K]) {
      appStateApi.updateQueryDraft((draft) => ({
        ...draft,
        attributes: {
          ...draft.attributes,
          query: {
            ...draft.attributes.query,
            [prop]: value,
          },
        },
      }));
    },
    [appStateApi],
  );

  const currentTab = React.useMemo(() => {
    if (
      currentView.kind === 'page' &&
      currentView.view?.kind === 'query' &&
      currentView.queryPanel?.currentTabIndex !== undefined
    ) {
      return currentView.queryPanel?.queryTabs?.[currentView.queryPanel?.currentTabIndex];
    }
    return null;
  }, [currentView]);

  const propTypeControls = usePropControlsContext();

  const { file: selectedFile = undefined, handler: selectedFunction = undefined } = input.attributes
    .query.function
    ? parseLegacyFunctionId(input.attributes.query.function)
    : {};

  const selectedOption = React.useMemo(() => {
    return introspection.data?.files
      .find((file) => file.name === selectedFile)
      ?.handlers.find((handler) => handler.name === selectedFunction);
  }, [introspection.data?.files, selectedFile, selectedFunction]);

  const parameterDefs = React.useMemo(
    () => Object.fromEntries(selectedOption?.parameters || []),
    [selectedOption?.parameters],
  );

  const paramsEntries = React.useMemo(
    () => input.params?.filter(([key]) => !!parameterDefs[key]) || EMPTY_PARAMS,
    [input.params, parameterDefs],
  );

  const paramsObject = Object.fromEntries(paramsEntries);

  const jsBrowserRuntime = useBrowserJsRuntime();

  const paramsEditorLiveValue = useEvaluateLiveBindingEntries({
    jsRuntime: jsBrowserRuntime,
    input: paramsEntries,
    globalScope,
  });

  const previewParams = React.useMemo(
    () => Object.fromEntries(paramsEditorLiveValue.map(([key, binding]) => [key, binding?.value])),
    [paramsEditorLiveValue],
  );

  const handleToolsTabTypeChange = React.useCallback(
    (value: QueryEditorToolsTabType) => {
      appStateApi.updateQueryTab((tab) => ({
        ...tab,
        toolsTabType: value,
      }));
    },
    [appStateApi],
  );

  const fetchServerPreview = React.useCallback(
    async (query: LocalQuery, params: Record<string, string>) => {
      return execApi('debugExec', [query, params]);
    },
    [execApi],
  );

  const { preview, runPreview, isLoading } = useQueryPreview(
    fetchServerPreview,
    input.attributes.query,
    previewParams as Record<string, string>,
  );

  const handleRunPreview = React.useCallback(() => {
    runPreview();
  }, [runPreview]);

  React.useEffect(() => {
    appStateApi.updateQueryTab((tab) => ({
      ...tab,
      previewHandler: handleRunPreview,
      isPreviewLoading: isLoading,
    }));
  }, [handleRunPreview, appStateApi, isLoading]);

  const liveBindings = useEvaluateLiveBindings({
    jsRuntime: jsBrowserRuntime,
    input: paramsObject,
    globalScope,
  });

  const handleSelectFunction = React.useCallback(
    (functionId: string) => {
      updateProp('function', functionId);
    },
    [updateProp],
  );

  const proposedFileName = React.useMemo(() => {
    const existingNames = new Set(introspection.data?.files.map((file) => file.name) || []);
    const baseName = 'functions';
    let counter = 2;

    while (existingNames.has(`${baseName}${counter}.ts`)) {
      counter += 1;
    }

    return `${baseName}${counter}.ts`;
  }, [introspection.data?.files]);

  const handleCreateNewCommit = React.useCallback(async () => {
    try {
      await execApi('createNew', [proposedFileName]);
      await introspection.refetch();
    } catch (error) {
      console.error(errorFrom(error).message);
    }
    return serializeFunctionId({ file: proposedFileName, handler: 'default' });
  }, [execApi, introspection, proposedFileName]);

  const handleTabTypeChange = React.useCallback(
    (value: QueryEditorTabType) => {
      appStateApi.updateQueryTab((tab) => ({
        ...tab,
        tabType: value,
      }));
    },
    [appStateApi],
  );

  return currentTab ? (
    <PanelGroup autoSaveId="toolpad/local-panel" direction="horizontal">
      <Panel
        defaultSize={50}
        minSize={40}
        style={{ overflow: 'auto', scrollbarGutter: 'stable' }}
        id="local-query-left"
      >
        <TabContext value={currentTab?.tabType ?? 'config'}>
          <Stack direction="column" gap={0}>
            <Stack
              direction={'row'}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pr: 0.5,
              }}
            >
              <TabList
                sx={{ '& button': { fontSize: 12, fontWeight: 'normal' } }}
                onChange={(event, value) => handleTabTypeChange(value)}
                aria-label="Query editor active tab type"
              >
                <Tab label="Config" value="config" />
                <Tab label="Settings" value="settings" />
              </TabList>
              <HelpTooltipIcon
                helpText={
                  <Typography variant="inherit">
                    To configure a custom function, check out the{' '}
                    <Link
                      href="https://mui.com/toolpad/studio/concepts/custom-functions/"
                      target="_blank"
                      rel="noopener"
                    >
                      docs
                    </Link>
                    .
                  </Typography>
                }
              />
            </Stack>

            <Divider />
            <TabPanel value="config" disableGutters>
              <Stack
                display="flex"
                flexDirection={'row'}
                sx={{
                  alignItems: 'flex-start',
                  mt: 2,
                  mx: 2,
                }}
              >
                <FunctionSelector
                  files={introspection.data?.files || []}
                  selectedFunctionId={transformLegacyFunctionId(
                    input.attributes.query.function || '',
                  )}
                  onCreateNew={handleCreateNewCommit}
                  onSelect={handleSelectFunction}
                />
                <OpenCodeEditorButton
                  filePath={selectedFile ?? ''}
                  fileType="resource"
                  disableRipple
                  disabled={!selectedFile}
                  sx={(theme) => ({
                    marginTop: theme.spacing(1),
                    marginLeft: theme.spacing(1),
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                  })}
                />
                {introspection.error ? (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: '0 0 0 0',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {errorFrom(introspection.error).message}
                  </Box>
                ) : null}
              </Stack>
            </TabPanel>
            <TabPanel value="settings" disableGutters>
              {settingsTab}
            </TabPanel>
          </Stack>
        </TabContext>
      </Panel>
      <PanelResizeHandle />
      <Panel id="local-query-right" defaultSize={50} minSize={20}>
        <PanelGroup autoSaveId="toolpad/local/params-tools-split" direction="vertical">
          <Panel
            id="parameters-editor"
            defaultSize={50}
            style={{ overflow: 'auto', scrollbarGutter: 'stable' }}
          >
            <Box display={'flex'} flexDirection={'column'}>
              <TabContext value="parameters">
                <TabList
                  sx={{
                    '& button': { fontSize: 12, fontWeight: 'normal', cursor: 'default' },
                  }}
                  aria-label="Query editor parameters"
                >
                  <Tab label="Parameters" value="parameters" />
                </TabList>

                <Divider sx={{ mb: 1.5 }} />
                <TabPanel value="parameters" disableGutters sx={{ ml: 1 }}>
                  <Grid display="grid" gridTemplateColumns={'1fr 1fr 1fr'} gap={2}>
                    {Object.entries(parameterDefs).map(([name, definiton]) => {
                      const Control = getDefaultControl(propTypeControls, definiton, liveBindings);
                      return Control ? (
                        <BindableEditor
                          key={name}
                          liveBinding={liveBindings[name]}
                          globalScope={globalScope}
                          globalScopeMeta={globalScopeMeta}
                          label={name}
                          propType={definiton}
                          jsRuntime={jsBrowserRuntime}
                          renderControl={(renderControlParams) => (
                            <Control {...renderControlParams} propType={definiton} />
                          )}
                          value={paramsObject[name]}
                          onChange={(newValue) => {
                            const paramKeys = Object.keys(parameterDefs);
                            const newParams: BindableAttrEntries = paramKeys.flatMap((key) => {
                              const paramValue = key === name ? newValue : paramsObject[key];
                              return paramValue ? [[key, paramValue]] : [];
                            });
                            appStateApi.updateQueryDraft((draft) => ({
                              ...draft,
                              params: newParams,
                            }));
                          }}
                        />
                      ) : null;
                    })}
                  </Grid>
                </TabPanel>
              </TabContext>
            </Box>
          </Panel>
          <PanelResizeHandle />

          <Panel
            id="preview"
            defaultSize={50}
            style={{ overflow: 'auto', scrollbarGutter: 'stable' }}
          >
            <TabContext value={currentTab.toolsTabType}>
              <Box
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  height: 32,
                  justifyContent: 'space-between',
                }}
              >
                <TabList
                  sx={{ '& button': { fontSize: 12, fontWeight: 'normal' } }}
                  onChange={(event, value) => handleToolsTabTypeChange(value)}
                  aria-label="Query tools active tab"
                >
                  <Tab label="Preview" value="preview" />
                </TabList>
                <LoadingButton
                  variant="text"
                  size="small"
                  loading={isLoading}
                  disabled={isLoading}
                  onClick={runPreview}
                  endIcon={<PlayArrowIcon aria-label="Run preview" onClick={runPreview} />}
                >
                  Run
                </LoadingButton>
              </Box>
              <TabPanel value="preview" disableGutters>
                <QueryPreview isLoading={currentTab.isPreviewLoading} error={preview?.error}>
                  <ResolvedPreview preview={preview} />
                </QueryPreview>
              </TabPanel>
            </TabContext>
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  ) : (
    <Alert severity="error">
      An error occurred while rendering this tab. Please refresh and try again.
    </Alert>
  );
}

function getInitialQueryValue(): LocalQuery {
  return {};
}

const dataSource: ClientDataSource<LocalConnectionParams, LocalQuery, LocalPrivateApi> = {
  displayName: 'Custom',
  QueryEditor,
  getInitialQueryValue,
  hasDefault: true,
};

export default dataSource;
