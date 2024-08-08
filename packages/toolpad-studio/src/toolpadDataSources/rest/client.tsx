import * as React from 'react';
import {
  BindableAttrEntries,
  BindableAttrValue,
  ScopeMeta,
  LiveBinding,
} from '@toolpad/studio-runtime';
import {
  Box,
  Button,
  InputAdornment,
  MenuItem,
  Stack,
  Tab,
  TextField,
  Toolbar,
  Link,
  Typography,
  Alert,
  styled,
  Divider,
  inputLabelClasses,
  inputBaseClasses,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Controller, useForm } from 'react-hook-form';
import { TabContext, TabList } from '@mui/lab';
import { createServerJsRuntime } from '@toolpad/studio-runtime/jsServerRuntime';
import { Maybe } from '@toolpad/utils/types';
import { Panel, PanelGroup, PanelResizeHandle } from '../../components/resizablePanels';
import { ClientDataSource, ConnectionEditorProps, QueryEditorProps } from '../../types';
import {
  FetchPrivateQuery,
  FetchQuery,
  FetchResult,
  RestConnectionParams,
  Body,
  ResponseType,
  IntrospectionResult,
} from './types';
import { getAuthenticationHeaders, parseBaseUrl } from './shared';
import BindableEditor, {
  RenderControlParams,
} from '../../toolpad/AppEditor/PageEditor/BindableEditor';
import {
  useEvaluateLiveBinding,
  useEvaluateLiveBindingEntries,
} from '../../toolpad/AppEditor/useEvaluateLiveBinding';
import MapEntriesEditor from '../../components/MapEntriesEditor';
import AuthenticationEditor from './AuthenticationEditor';
import { isSaveDisabled, validation } from '../../utils/forms';
import { useAppState, useAppStateApi } from '../../toolpad/AppState';
import { QueryEditorTabType, QueryEditorToolsTabType } from '../../utils/domView';
import ParametersEditor from '../../toolpad/AppEditor/PageEditor/ParametersEditor';
import BodyEditor from './BodyEditor';
import TabPanel from '../../components/TabPanel';
import JsonView from '../../components/JsonView';
import useQueryPreview from '../useQueryPreview';
import TransformInput from '../TranformInput';
import Devtools from '../../components/Devtools';
import { createHarLog, mergeHar } from '../../utils/har';
import useFetchPrivate from '../useFetchPrivate';
import QueryPreview from '../QueryPreview';
import { usePrivateQuery } from '../context';
import HelpTooltipIcon from '../../components/HelpTooltipIcon';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

const QUERY_SCOPE_META: ScopeMeta = {
  parameters: {
    description: 'Parameters that can be bound to app scope variables',
  },
};

const ButtonLink = styled('button')(({ theme }) => ({
  background: 'none',
  border: 'none',
  fontSize: 'inherit',
  padding: 0,
  color: theme.palette.primary.main,
  textDecoration: 'underline',
}));

interface UrlControlProps extends RenderControlParams<string> {
  baseUrl: string | null;
}

function UrlControl({ label, disabled, baseUrl, value, onChange }: UrlControlProps) {
  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange],
  );

  return (
    <TextField
      fullWidth
      value={value ?? ''}
      disabled={disabled}
      onChange={handleChange}
      label={label}
      slotProps={{
        input: baseUrl
          ? {
              startAdornment: <InputAdornment position="start">{baseUrl}</InputAdornment>,
            }
          : undefined,
      }}
    />
  );
}

function withDefaults(value: Maybe<RestConnectionParams>): RestConnectionParams {
  return {
    baseUrl: '',
    headers: [],
    authentication: null,
    ...value,
  };
}

function ConnectionParamsInput({ value, onChange }: ConnectionEditorProps<RestConnectionParams>) {
  const { handleSubmit, register, formState, reset, control, watch } = useForm({
    defaultValues: withDefaults(value),
    reValidateMode: 'onChange',
    mode: 'all',
  });
  React.useEffect(() => reset(withDefaults(value)), [reset, value]);

  const doSubmit = handleSubmit((connectionParams) =>
    onChange({
      ...connectionParams,
      baseUrl: connectionParams.baseUrl && parseBaseUrl(connectionParams.baseUrl).href,
    }),
  );

  const baseUrlValue = watch('baseUrl');
  const headersValue = watch('headers');
  const authenticationValue = watch('authentication');
  const authenticationHeaders = getAuthenticationHeaders(authenticationValue);

  const mustHaveBaseUrl: boolean =
    (headersValue && headersValue.length > 0) || !!authenticationValue;

  const headersAllowed = !!baseUrlValue;

  const baseUrlInputProps = {
    label: 'base url',
    ...register('baseUrl', {
      validate(input?: string) {
        if (!input) {
          if (mustHaveBaseUrl) {
            return 'A base url is required when headers are used';
          }
          return true;
        }
        try {
          return !!parseBaseUrl(input);
        } catch (error) {
          return 'Must be an absolute url';
        }
      },
    }),
    ...validation(formState, 'baseUrl'),
  };

  return (
    <Stack direction="column" gap={3} sx={{ py: 3 }}>
      <TextField {...baseUrlInputProps} />
      <Typography>Headers:</Typography>
      <Controller
        name="headers"
        control={control}
        render={({ field: { value: fieldValue = [], onChange: onFieldChange, ref, ...field } }) => {
          const allHeaders = [...authenticationHeaders, ...fieldValue];
          return (
            <MapEntriesEditor
              {...field}
              disabled={!headersAllowed}
              fieldLabel="header"
              value={allHeaders}
              onChange={(headers) => onFieldChange(headers.slice(authenticationHeaders.length))}
              isEntryDisabled={(entry, index) => index < authenticationHeaders.length}
            />
          );
        }}
      />
      <Typography>Authentication:</Typography>
      <Controller
        name="authentication"
        control={control}
        render={({ field: { value: fieldValue, ref, ...field } }) => (
          <AuthenticationEditor {...field} disabled={!headersAllowed} value={fieldValue ?? null} />
        )}
      />

      <Toolbar disableGutters>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" onClick={doSubmit} disabled={isSaveDisabled(formState)}>
          Save
        </Button>
      </Toolbar>
    </Stack>
  );
}

interface ResolvedPreviewProps {
  preview: FetchResult | null;
  onShowTransform: () => void;
}

function ResolvedPreview({
  preview,
  onShowTransform,
}: ResolvedPreviewProps): React.ReactElement | null {
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

  const { data, untransformedData } = preview;
  let alert = null;
  const responseDataKeys = Object.keys(untransformedData);

  if (typeof data === 'undefined' && typeof untransformedData !== 'undefined') {
    alert = (
      <Alert severity="warning" sx={{ m: 1, p: 1, fontSize: 11 }}>
        <Box sx={{ mb: 1 }}>
          Request successfully completed and returned data
          {responseDataKeys.length > 0 ? ' with the following keys:' : '.'}
        </Box>

        {responseDataKeys.map((key) => (
          <Box sx={{ display: 'block' }} key={key}>
            - {key}
          </Box>
        ))}

        <Box sx={{ mt: 1 }}>
          However, it seems that the <ButtonLink onClick={onShowTransform}>transform</ButtonLink>{' '}
          function returned an <code>undefined</code> value.
        </Box>
      </Alert>
    );
  }

  return (
    <React.Fragment>
      {alert}
      <JsonView sx={{ height: '100%' }} src={preview?.data} />
    </React.Fragment>
  );
}

const EMPTY_PARAMS: BindableAttrEntries = [];

function QueryEditor({
  globalScope,
  globalScopeMeta,
  connectionParams: rawConnectionParams,
  value: input,
  settingsTab,
}: QueryEditorProps<RestConnectionParams, FetchQuery>) {
  const appStateApi = useAppStateApi();
  const { currentView } = useAppState();
  const isBrowserSide = input.attributes.query.browser;

  const connectionParams = isBrowserSide ? null : rawConnectionParams;
  const baseUrl = isBrowserSide ? null : (connectionParams?.baseUrl ?? null);

  const urlValue: BindableAttrValue<string> = input.attributes.query.url ?? '';

  const introspection = usePrivateQuery<FetchPrivateQuery, IntrospectionResult>(
    {
      kind: 'introspection',
    },
    { retry: false },
  );

  const updateProp = React.useCallback(
    function updateProp<K extends keyof FetchQuery>(prop: K, value: FetchQuery[K]) {
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

  const env = React.useMemo(() => introspection?.data?.env ?? {}, [introspection?.data?.env]);
  const declaredEnvKeys = React.useMemo(
    () => introspection?.data?.declaredEnvKeys ?? [],
    [introspection?.data?.declaredEnvKeys],
  );
  const handleParamsChange = React.useCallback(
    (newParams: [string, BindableAttrValue<string>][]) => {
      appStateApi.updateQueryDraft((draft) => ({
        ...draft,
        params: newParams,
      }));
    },
    [appStateApi],
  );

  const handleUrlChange = React.useCallback(
    (newUrl: BindableAttrValue<string> | null) => {
      updateProp('url', newUrl ?? '');
    },
    [updateProp],
  );

  const handleMethodChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateProp('method', event.target.value);
    },
    [updateProp],
  );

  const handleTransformEnabledChange = React.useCallback(
    (transformEnabled: boolean) => {
      updateProp('transformEnabled', transformEnabled);
    },
    [updateProp],
  );

  const handleTransformChange = React.useCallback(
    (transform: string) => {
      updateProp('transform', transform);
    },
    [updateProp],
  );

  const handleBodyChange = React.useCallback(
    (newBody: Maybe<Body>) => {
      updateProp('body', newBody || undefined);
    },
    [updateProp],
  );

  const handleSearchParamsChange = React.useCallback(
    (newSearchParams: BindableAttrEntries) => {
      updateProp('searchParams', newSearchParams);
    },
    [updateProp],
  );

  const handleHeadersChange = React.useCallback(
    (newHeaders: BindableAttrEntries) => {
      updateProp('headers', newHeaders);
    },
    [updateProp],
  );

  const handleResponseTypeChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateProp('response', {
        kind: event.target.value,
      } as ResponseType);
    },
    [updateProp],
  );

  const paramsEntries = input.params || EMPTY_PARAMS;
  const jsServerRuntime = React.useMemo(() => createServerJsRuntime(env ?? {}), [env]);

  const paramsEditorLiveValue = useEvaluateLiveBindingEntries({
    jsRuntime: jsServerRuntime,
    input: paramsEntries,
    globalScope,
  });

  const previewParams = React.useMemo(
    () => Object.fromEntries(paramsEditorLiveValue.map(([key, binding]) => [key, binding?.value])),
    [paramsEditorLiveValue],
  );

  const queryScope = React.useMemo(
    () => ({
      parameters: previewParams,
    }),
    [previewParams],
  );

  const liveUrl: LiveBinding = useEvaluateLiveBinding({
    jsRuntime: jsServerRuntime,
    input: urlValue,
    globalScope: queryScope,
  });

  const liveSearchParams = useEvaluateLiveBindingEntries({
    jsRuntime: jsServerRuntime,
    input: input.attributes.query.searchParams || [],
    globalScope: queryScope,
  });

  const liveHeaders = useEvaluateLiveBindingEntries({
    jsRuntime: jsServerRuntime,
    input: input.attributes.query.headers || [],
    globalScope: queryScope,
  });

  const [configTab, setConfigTab] = React.useState('urlQuery');

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

  const handleToolsTabTypeChange = React.useCallback(
    (value: QueryEditorToolsTabType) => {
      appStateApi.updateQueryTab((tab) => ({
        ...tab,
        toolsTabType: value,
      }));
    },
    [appStateApi],
  );

  const fetchPrivate = useFetchPrivate<FetchPrivateQuery, FetchResult>();
  const fetchPreview = React.useCallback(
    (query: FetchQuery, params: Record<string, string>) =>
      fetchPrivate({ kind: 'debugExec', query, params }),
    [fetchPrivate],
  );

  const [previewHar, setPreviewHar] = React.useState(() => createHarLog());
  const { preview, runPreview, isLoading } = useQueryPreview(
    fetchPreview,
    input.attributes.query,
    previewParams as Record<string, string>,
    {
      onPreview: React.useCallback((result: FetchResult) => {
        setPreviewHar((existing) =>
          result.har ? mergeHar(createHarLog(), existing, result.har) : existing,
        );
      }, []),
    },
  );

  const handleHarClear = React.useCallback(() => setPreviewHar(createHarLog()), []);

  const handleConfigTabChange = React.useCallback(
    (event: React.SyntheticEvent, newValue: string) => setConfigTab(newValue),
    [],
  );

  const handleTabTypeChange = React.useCallback(
    (event: React.SyntheticEvent, value: QueryEditorTabType) => {
      appStateApi.updateQueryTab((tab) => ({
        ...tab,
        tabType: value,
      }));
    },
    [appStateApi],
  );

  return currentTab ? (
    <PanelGroup autoSaveId="toolpad/rest-panel" direction="horizontal">
      <Panel id="rest-query-left" defaultSize={50} minSize={40} style={{ overflow: 'auto' }}>
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
                onChange={handleTabTypeChange}
                aria-label="Query editor active tab type"
              >
                <Tab label="Config" value="config" />
                <Tab label="Settings" value="settings" />
              </TabList>
              <HelpTooltipIcon
                helpText={
                  <Typography variant="inherit">
                    To configure a HTTP request, check out the{' '}
                    <Link
                      href="https://mui.com/toolpad/studio/concepts/http-requests/"
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
              <React.Fragment>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr 0.1fr',
                    gap: 1,
                    my: 1.5,
                    ml: 1,
                  }}
                >
                  <TextField
                    select
                    value={input.attributes.query.method || 'GET'}
                    size="small"
                    sx={{
                      '& .MuiSelect-select': {
                        height: (theme) => theme.typography.pxToRem(20),
                      },
                    }}
                    onChange={handleMethodChange}
                    slotProps={{
                      htmlInput: { sx: { fontSize: 12 } },
                    }}
                  >
                    {HTTP_METHODS.map((method) => (
                      <MenuItem key={method} value={method}>
                        {method}
                      </MenuItem>
                    ))}
                  </TextField>
                  <BindableEditor<string>
                    liveBinding={liveUrl}
                    globalScope={queryScope}
                    globalScopeMeta={QUERY_SCOPE_META}
                    sx={{ flex: 1 }}
                    jsRuntime={jsServerRuntime}
                    label="url"
                    propType={{ type: 'string' }}
                    renderControl={(props) => <UrlControl baseUrl={baseUrl} {...props} />}
                    value={urlValue}
                    onChange={handleUrlChange}
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2.5, mx: 0 }}>
                  <TabContext value={configTab}>
                    <Box sx={{ border: 1, borderColor: 'divider' }}>
                      <TabList
                        sx={{ '& button': { fontSize: 12, fontWeight: 'normal' } }}
                        onChange={handleConfigTabChange}
                        aria-label="Fetch options active tab"
                      >
                        <Tab label="URL query" value="urlQuery" />
                        <Tab label="Body" value="body" />
                        <Tab label="Headers" value="headers" />
                        <Tab label="Response" value="response" />
                        <Tab label="Transform" value="transform" />
                      </TabList>
                    </Box>
                    <TabPanel disableGutters value="urlQuery" sx={{ ml: 1 }}>
                      <ParametersEditor
                        value={input.attributes.query.searchParams ?? []}
                        onChange={handleSearchParamsChange}
                        globalScope={queryScope}
                        globalScopeMeta={QUERY_SCOPE_META}
                        liveValue={liveSearchParams}
                        jsRuntime={jsServerRuntime}
                      />
                    </TabPanel>
                    <TabPanel disableGutters value="body" sx={{ ml: 1 }}>
                      <BodyEditor
                        value={input.attributes.query.body}
                        onChange={handleBodyChange}
                        globalScope={queryScope}
                        globalScopeMeta={QUERY_SCOPE_META}
                        method={input.attributes.query.method || 'GET'}
                      />
                    </TabPanel>
                    <TabPanel disableGutters value="headers" sx={{ ml: 1 }}>
                      <ParametersEditor
                        value={input.attributes.query.headers ?? []}
                        onChange={handleHeadersChange}
                        globalScope={queryScope}
                        globalScopeMeta={QUERY_SCOPE_META}
                        liveValue={liveHeaders}
                        jsRuntime={jsServerRuntime}
                        env={env}
                      />
                    </TabPanel>
                    <TabPanel disableGutters value="response" sx={{ ml: 1 }}>
                      <TextField
                        select
                        label="response type"
                        sx={{
                          [`& .${inputLabelClasses.root}`]: { fontSize: 12 },
                          [`& .${inputBaseClasses.root}`]: { fontSize: 12 },
                          width: 200,
                        }}
                        value={input.attributes.query.response?.kind || 'json'}
                        onChange={handleResponseTypeChange}
                      >
                        <MenuItem value="raw">raw</MenuItem>
                        <MenuItem value="json">JSON</MenuItem>
                        <MenuItem value="csv" disabled>
                          🚧 CSV
                        </MenuItem>
                        <MenuItem value="xml" disabled>
                          🚧 XML
                        </MenuItem>
                      </TextField>
                    </TabPanel>
                    <TabPanel disableGutters value="transform" sx={{ ml: 1 }}>
                      <TransformInput
                        value={input.attributes.query.transform ?? 'return data;'}
                        onChange={handleTransformChange}
                        enabled={input.attributes.query.transformEnabled ?? false}
                        onEnabledChange={handleTransformEnabledChange}
                        globalScope={{ data: preview?.untransformedData }}
                        loading={false}
                      />
                    </TabPanel>
                  </TabContext>
                </Box>
              </React.Fragment>
            </TabPanel>
            <TabPanel value="settings" disableGutters>
              {settingsTab}
            </TabPanel>
          </Stack>
        </TabContext>
      </Panel>
      <PanelResizeHandle />
      <Panel id="rest-query-right" defaultSize={50} minSize={20}>
        <PanelGroup autoSaveId="toolpad/rest/params-tools-split" direction="vertical">
          <Panel defaultSize={50} style={{ overflow: 'auto', scrollbarGutter: 'stable' }}>
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
                  <ParametersEditor
                    value={paramsEntries}
                    onChange={handleParamsChange}
                    globalScope={globalScope}
                    globalScopeMeta={globalScopeMeta}
                    liveValue={paramsEditorLiveValue}
                    jsRuntime={jsServerRuntime}
                    env={env}
                    declaredEnvKeys={declaredEnvKeys}
                  />
                </TabPanel>
              </TabContext>
            </Box>
          </Panel>
          <PanelResizeHandle />
          <Panel defaultSize={50} style={{ overflow: 'auto', scrollbarGutter: 'stable' }}>
            <TabContext value={currentTab.toolsTabType}>
              <Box
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'space-between',
                  height: 34,
                }}
              >
                <TabList
                  sx={{ '& button': { fontSize: 12, fontWeight: 'normal' } }}
                  onChange={(event, value) => handleToolsTabTypeChange(value)}
                  aria-label="Query tools active tab"
                >
                  <Tab label={'Preview'} value="preview" />
                  <Tab label="Dev Tools" value="devTools" />
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
                  <ResolvedPreview
                    preview={preview}
                    onShowTransform={() => setConfigTab('transform')}
                  />
                </QueryPreview>
              </TabPanel>
              <TabPanel value="devTools" disableGutters>
                <Devtools sx={{ overflow: 'auto' }} har={previewHar} onHarClear={handleHarClear} />
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

function getInitialQueryValue(): FetchQuery {
  return {
    method: 'GET',
    url: 'https://raw.githubusercontent.com/mui/mui-toolpad/master/public/movies.json',
    headers: [],
    browser: false,
  };
}

const dataSource: ClientDataSource<RestConnectionParams, FetchQuery> = {
  displayName: 'REST API',
  ConnectionParamsInput,
  QueryEditor,
  getInitialQueryValue,
  hasDefault: true,
};

export default dataSource;
