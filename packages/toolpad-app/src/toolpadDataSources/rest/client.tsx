import * as React from 'react';
import { BindableAttrEntries, BindableAttrValue, LiveBinding } from '@mui/toolpad-core';
import {
  Box,
  Button,
  InputAdornment,
  MenuItem,
  Stack,
  Tab,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { TabContext, TabList } from '@mui/lab';
import { ClientDataSource, ConnectionEditorProps, QueryEditorProps } from '../../types';
import {
  FetchPrivateQuery,
  FetchQuery,
  FetchResult,
  RestConnectionParams,
  Body,
  ResponseType,
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
import { Maybe, GlobalScopeMeta } from '../../utils/types';
import AuthenticationEditor from './AuthenticationEditor';
import { isSaveDisabled, validation } from '../../utils/forms';
import * as appDom from '../../appDom';
import ParametersEditor from '../../toolpad/AppEditor/PageEditor/ParametersEditor';
import BodyEditor from './BodyEditor';
import TabPanel from '../../components/TabPanel';
import SplitPane from '../../components/SplitPane';
import ErrorAlert from '../../toolpad/AppEditor/PageEditor/ErrorAlert';
import JsonView from '../../components/JsonView';
import useQueryPreview from '../useQueryPreview';
import TransformInput from '../TranformInput';
import Devtools from '../../components/Devtools';
import { createHarLog, mergeHar } from '../../utils/har';
import QueryInputPanel from '../QueryInputPanel';
import DEMO_BASE_URLS from './demoBaseUrls';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'];

const GLOBAL_SCOPE_META: GlobalScopeMeta = {
  query: {
    deprecated: 'Use parameters variable instead',
    description: 'Parameters that can be bound to app scope variables',
  },
  parameters: {
    description: 'Parameters that can be bound to app scope variables',
  },
};

interface UrlControlProps extends RenderControlParams<string> {
  baseUrl?: string;
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
      InputProps={
        baseUrl
          ? {
              startAdornment: <InputAdornment position="start">{baseUrl}</InputAdornment>,
            }
          : undefined
      }
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

  const isDemo = !!process.env.TOOLPAD_DEMO;

  return (
    <Stack direction="column" gap={3} sx={{ py: 3 }}>
      {isDemo ? (
        <TextField select {...baseUrlInputProps} defaultValue="">
          {DEMO_BASE_URLS.map(({ url, name }) => (
            <MenuItem key={url} value={url}>
              {url} ({name})
            </MenuItem>
          ))}
        </TextField>
      ) : (
        <TextField {...baseUrlInputProps} />
      )}
      <Typography>Headers:</Typography>
      <Controller
        name="headers"
        control={control}
        render={({ field: { value: fieldValue = [], onChange: onFieldChange, ref, ...field } }) => {
          const allHeaders = [...authenticationHeaders, ...fieldValue];
          return (
            <MapEntriesEditor
              {...field}
              disabled={!headersAllowed || isDemo}
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
          <AuthenticationEditor
            {...field}
            disabled={!headersAllowed || isDemo}
            value={fieldValue ?? null}
          />
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

function QueryEditor({
  globalScope,
  connectionParams,
  value,
  onChange,
  QueryEditorShell,
}: QueryEditorProps<RestConnectionParams, FetchQuery>) {
  const [input, setInput] = React.useState(value);
  React.useEffect(() => setInput(value), [value]);

  const baseUrl = connectionParams?.baseUrl;

  const handleParamsChange = React.useCallback(
    (newParams: [string, BindableAttrValue<string>][]) => {
      setInput((existing) => ({ ...existing, params: newParams }));
    },
    [],
  );

  const handleUrlChange = React.useCallback((newUrl: BindableAttrValue<string> | null) => {
    setInput((existing) => ({
      ...existing,
      query: { ...existing.query, url: newUrl || appDom.createConst('') },
    }));
  }, []);

  const handleMethodChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setInput((existing) => ({
      ...existing,
      query: { ...existing.query, method: event.target.value },
    }));
  }, []);

  const handleTransformEnabledChange = React.useCallback((transformEnabled: boolean) => {
    setInput((existing) => ({
      ...existing,
      query: { ...existing.query, transformEnabled },
    }));
  }, []);

  const handleTransformChange = React.useCallback((transform: string) => {
    setInput((existing) => ({
      ...existing,
      query: { ...existing.query, transform },
    }));
  }, []);

  const handleBodyChange = React.useCallback((newBody: Maybe<Body>) => {
    setInput((existing) => ({
      ...existing,
      query: { ...existing.query, body: newBody || undefined },
    }));
  }, []);

  const handleSearchParamsChange = React.useCallback((newSearchParams: BindableAttrEntries) => {
    setInput((existing) => ({
      ...existing,
      query: { ...existing.query, searchParams: newSearchParams },
    }));
  }, []);

  const handleHeadersChange = React.useCallback((newHeaders: BindableAttrEntries) => {
    setInput((existing) => ({
      ...existing,
      query: { ...existing.query, headers: newHeaders },
    }));
  }, []);

  const handleResponseTypeChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setInput((existing) => ({
        ...existing,
        query: { ...existing.query, response: { kind: event.target.value } as ResponseType },
      }));
    },
    [],
  );

  const paramsEditorLiveValue = useEvaluateLiveBindingEntries({
    input: input.params,
    globalScope,
  });

  const previewParams = React.useMemo(
    () => Object.fromEntries(paramsEditorLiveValue.map(([key, binding]) => [key, binding?.value])),
    [paramsEditorLiveValue],
  );

  const queryScope = {
    // TODO mark query as @deprecated remove after v1
    query: previewParams,
    parameters: previewParams,
  };

  const liveUrl: LiveBinding = useEvaluateLiveBinding({
    server: true,
    input: input.query.url,
    globalScope: queryScope,
  });

  const liveSearchParams = useEvaluateLiveBindingEntries({
    server: true,
    input: input.query.searchParams || [],
    globalScope: queryScope,
  });

  const liveHeaders = useEvaluateLiveBindingEntries({
    server: true,
    input: input.query.headers || [],
    globalScope: queryScope,
  });

  const [previewHar, setPreviewHar] = React.useState(() => createHarLog());
  const { preview, runPreview: handleRunPreview } = useQueryPreview<FetchPrivateQuery, FetchResult>(
    {
      kind: 'debugExec',
      query: input.query,
      params: previewParams,
    },
    {
      onPreview(result) {
        setPreviewHar((existing) => mergeHar(createHarLog(), existing, result.har));
      },
    },
  );

  const handleHarClear = React.useCallback(() => setPreviewHar(createHarLog()), []);

  const handleCommit = React.useCallback(() => onChange(input), [onChange, input]);

  const isDirty = input !== value;

  const [activeTab, setActiveTab] = React.useState('urlQuery');

  const handleActiveTabChange = React.useCallback(
    (event: React.SyntheticEvent, newValue: string) => setActiveTab(newValue),
    [],
  );

  const isDemo = !!process.env.TOOLPAD_DEMO;

  return (
    <QueryEditorShell onCommit={handleCommit} isDirty={isDirty}>
      <SplitPane split="vertical" size="50%" allowResize>
        <SplitPane split="horizontal" size={85} primary="second" allowResize>
          <QueryInputPanel onRunPreview={handleRunPreview}>
            <Stack gap={2} sx={{ px: 3, pt: 1 }}>
              <Typography>Query</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
                <TextField
                  select
                  value={isDemo ? 'GET' : input.query.method || 'GET'}
                  onChange={handleMethodChange}
                  disabled={isDemo}
                >
                  {HTTP_METHODS.map((method) => (
                    <MenuItem key={method} value={method}>
                      {method}
                    </MenuItem>
                  ))}
                </TextField>
                <BindableEditor
                  liveBinding={liveUrl}
                  globalScope={queryScope}
                  globalScopeMeta={GLOBAL_SCOPE_META}
                  sx={{ flex: 1 }}
                  server
                  label="url"
                  propType={{ type: 'string' }}
                  renderControl={(props) => <UrlControl baseUrl={baseUrl} {...props} />}
                  value={input.query.url}
                  onChange={handleUrlChange}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <TabContext value={activeTab}>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <TabList onChange={handleActiveTabChange} aria-label="Fetch options active tab">
                      <Tab label="URL query" value="urlQuery" />
                      <Tab label="Body" value="body" disabled={isDemo} />
                      <Tab label="Headers" value="headers" disabled={isDemo} />
                      <Tab label="Response" value="response" disabled={isDemo} />
                      <Tab label="Transform" value="transform" />
                    </TabList>
                  </Box>
                  <TabPanel disableGutters value="urlQuery">
                    <ParametersEditor
                      value={input.query.searchParams ?? []}
                      onChange={handleSearchParamsChange}
                      globalScope={queryScope}
                      liveValue={liveSearchParams}
                    />
                  </TabPanel>
                  <TabPanel disableGutters value="body">
                    <BodyEditor
                      globalScope={queryScope}
                      value={input.query.body}
                      onChange={handleBodyChange}
                      method={input.query.method || 'GET'}
                    />
                  </TabPanel>
                  <TabPanel disableGutters value="headers">
                    <ParametersEditor
                      value={input.query.headers ?? []}
                      onChange={handleHeadersChange}
                      globalScope={queryScope}
                      liveValue={liveHeaders}
                    />
                  </TabPanel>
                  <TabPanel disableGutters value="response">
                    <TextField
                      select
                      label="response type"
                      sx={{ width: 200, mt: 1 }}
                      value={input.query.response?.kind || 'json'}
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
                  <TabPanel disableGutters value="transform">
                    <TransformInput
                      value={input.query.transform ?? 'return data;'}
                      onChange={handleTransformChange}
                      enabled={input.query.transformEnabled ?? false}
                      onEnabledChange={handleTransformEnabledChange}
                      globalScope={{ data: preview?.untransformedData }}
                      loading={false}
                    />
                  </TabPanel>
                </TabContext>
              </Box>
            </Stack>
          </QueryInputPanel>

          <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
            <Typography>Parameters</Typography>
            <ParametersEditor
              value={input.params}
              onChange={handleParamsChange}
              globalScope={globalScope}
              liveValue={paramsEditorLiveValue}
            />
          </Box>
        </SplitPane>

        <SplitPane split="horizontal" size="30%" minSize={30} primary="second" allowResize>
          {preview?.error ? (
            <ErrorAlert error={preview?.error} />
          ) : (
            <JsonView sx={{ height: '100%' }} src={preview?.data} />
          )}
          <Devtools
            sx={{ width: '100%', height: '100%' }}
            har={previewHar}
            onHarClear={handleHarClear}
          />
        </SplitPane>
      </SplitPane>
    </QueryEditorShell>
  );
}

function getInitialQueryValue(): FetchQuery {
  return { url: { type: 'const', value: '' }, method: 'GET', headers: [] };
}

const dataSource: ClientDataSource<{}, FetchQuery> = {
  displayName: 'Fetch',
  ConnectionParamsInput,
  QueryEditor,
  getInitialQueryValue,
  hasDefault: true,
};

export default dataSource;
