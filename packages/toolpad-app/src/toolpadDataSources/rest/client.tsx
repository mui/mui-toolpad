import * as React from 'react';
import { ArgTypeDefinitions, BindableAttrValue, LiveBinding } from '@mui/toolpad-core';
import { Button, InputAdornment, Stack, TextField, Toolbar, Typography } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import StringRecordEditor from '../../components/StringRecordEditor';
import { ClientDataSource, ConnectionEditorProps, QueryEditorProps } from '../../types';
import { FetchQuery, RestConnectionParams } from './types';
import { getAuthenticationHeaders } from './shared';
import BindableEditor, {
  RenderControlParams,
} from '../../components/AppEditor/PageEditor/BindableEditor';
import { useEvaluateLiveBinding } from '../../components/AppEditor/useEvaluateLiveBinding';
import MapEntriesEditor from '../../components/MapEntriesEditor';
import { Maybe } from '../../utils/types';
import AuthenticationEditor from './AuthenticationEditor';
import { isSaveDisabled } from '../../utils/forms';

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

  const doSubmit = handleSubmit((connectionParams) => onChange(connectionParams));

  const authentication = watch('authentication');
  const authenticationHeaders = getAuthenticationHeaders(authentication);

  return (
    <Stack direction="column" gap={1}>
      <Toolbar disableGutters>
        <Button onClick={doSubmit} disabled={isSaveDisabled(formState)}>
          Save
        </Button>
      </Toolbar>
      <TextField label="base url" {...register('baseUrl')} />
      <Typography>Headers:</Typography>
      <Controller
        name="headers"
        control={control}
        render={({ field: { value: fieldValue = [], ref, ...field } }) => {
          const allHeaders = [...authenticationHeaders, ...fieldValue];
          return (
            <MapEntriesEditor
              fieldLabel="header"
              {...field}
              value={allHeaders}
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
          <AuthenticationEditor {...field} value={fieldValue ?? null} />
        )}
      />
    </Stack>
  );
}

function QueryEditor({
  globalScope,
  connectionParams,
  value,
  onChange,
}: QueryEditorProps<RestConnectionParams, FetchQuery>) {
  const baseUrl = connectionParams?.baseUrl;

  const handleUrlChange = React.useCallback(
    (newValue: BindableAttrValue<string> | null) => {
      onChange({ ...value, url: newValue || { type: 'const', value: '' } });
    },
    [onChange, value],
  );

  const handleApiQueryChange = React.useCallback(
    (newValue: Record<string, string>) => {
      onChange({
        ...value,
        params: newValue,
      });
    },
    [onChange, value],
  );

  const liveUrl: LiveBinding = useEvaluateLiveBinding({
    server: true,
    input: value.url,
    globalScope: globalScope.query ? globalScope : { query: value.params },
  });

  return (
    <div>
      <BindableEditor
        liveBinding={liveUrl}
        globalScope={globalScope}
        server
        label="url"
        propType={{ type: 'string' }}
        renderControl={(params) => {
          return <UrlControl baseUrl={baseUrl} {...params} />;
        }}
        value={value.url}
        onChange={handleUrlChange}
      />
      {/* TODO: remove this when QueryStateNode is removed */}
      {globalScope.query ? null : (
        <StringRecordEditor
          label="api query"
          fieldLabel="parameter"
          valueLabel="default value"
          value={value.params || {}}
          onChange={handleApiQueryChange}
        />
      )}
    </div>
  );
}

function getInitialQueryValue(): FetchQuery {
  return { url: { type: 'const', value: '' }, method: '', headers: [], params: {} };
}

function getArgTypes(query: FetchQuery): ArgTypeDefinitions {
  return Object.fromEntries(
    Object.entries(query.params).map(([propName, defaultValue]) => [
      propName,
      {
        typeDef: { type: 'string' },
        defaultValue,
      },
    ]),
  );
}

const dataSource: ClientDataSource<{}, FetchQuery> = {
  displayName: 'Fetch',
  ConnectionParamsInput,
  isConnectionValid: () => true,
  QueryEditor,
  getInitialQueryValue,
  getArgTypes,
};

export default dataSource;
