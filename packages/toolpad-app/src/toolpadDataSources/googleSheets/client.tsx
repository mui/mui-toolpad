import {
  Stack,
  Button,
  Checkbox,
  TextField,
  Autocomplete,
  FormControlLabel,
  Typography,
  Skeleton,
  DialogActions,
  DialogContent,
} from '@mui/material';
import * as React from 'react';
import { inferColumns, parseColumns } from '@mui/toolpad-components';
import { DataGridPro, GridColDef } from '@mui/x-data-grid-pro';
import { UseQueryResult } from '@tanstack/react-query';
import { getObjectKey } from '@mui/toolpad-core/objectKey';
import mitt from 'mitt';
import invariant from 'invariant';
import { useForm } from 'react-hook-form';
import {
  ClientDataSource,
  ConnectionEditorProps,
  ConnectionEditorProps2,
  QueryEditorProps,
} from '../../types';
import {
  GoogleSheetsConnectionParams,
  GoogleSheetsApiQuery,
  GoogleDriveFile,
  GoogleSpreadsheet,
  GoogleSheet,
  GoogleDriveFiles,
  GoogleDriveUser,
  GoogleSheetsPrivateQuery,
  GoogleSheetsResult,
} from './types';
import useDebounced from '../../utils/useDebounced';
import { usePrivateQuery } from '../context';
import ErrorAlert from '../../toolpad/AppEditor/PageEditor/ErrorAlert';
import QueryInputPanel from '../QueryInputPanel';
import SplitPane from '../../components/SplitPane';
import useQueryPreview from '../useQueryPreview';
import useFetchPrivate from '../useFetchPrivate';
import * as appDom from '../../appDom';
import config from '../../config';
import { errorFrom } from '../../utils/errors';
import { validation } from '../../utils/forms';

const EMPTY_ROWS: any[] = [];

function getInitialQueryValue(): GoogleSheetsApiQuery {
  return { ranges: 'A1:Z10', spreadsheetId: '', sheetName: '', headerRow: false };
}

function QueryEditor({
  value: input,
  onChange: setInput,
}: QueryEditorProps<GoogleSheetsConnectionParams, GoogleSheetsApiQuery>) {
  const [spreadsheetQuery, setSpreadsheetQuery] = React.useState<string | null>(null);

  const debouncedSpreadsheetQuery = useDebounced(spreadsheetQuery, 300);

  const fetchedFiles: UseQueryResult<GoogleDriveFiles> = usePrivateQuery({
    type: 'FILES_LIST',
    spreadsheetQuery: debouncedSpreadsheetQuery,
  });

  const fetchedFile: UseQueryResult<GoogleDriveFile> = usePrivateQuery(
    input.attributes.query.value.spreadsheetId
      ? {
          type: 'FILE_GET',
          spreadsheetId: input.attributes.query.value.spreadsheetId,
        }
      : null,
  );

  const fetchedSpreadsheet: UseQueryResult<GoogleSpreadsheet> = usePrivateQuery(
    input.attributes.query.value.spreadsheetId
      ? {
          type: 'FETCH_SPREADSHEET',
          spreadsheetId: input.attributes.query.value.spreadsheetId,
        }
      : null,
  );

  const selectedSheet = React.useMemo(
    () =>
      fetchedSpreadsheet.data?.sheets?.find(
        (sheet) => sheet.properties?.title === input.attributes.query.value.sheetName,
      ) ?? null,
    [fetchedSpreadsheet, input],
  );

  const handleSpreadsheetChange = React.useCallback(
    (event: React.SyntheticEvent<Element, Event>, newValue: GoogleDriveFile | null) => {
      setInput((existing) => {
        existing = appDom.setQueryProp(existing, 'sheetName', null);
        existing = appDom.setQueryProp(existing, 'spreadsheetId', newValue?.id ?? null);
        return existing;
      });
    },
    [setInput],
  );

  const handleSheetChange = React.useCallback(
    (event: React.SyntheticEvent<Element, Event>, newValue: GoogleSheet | null) => {
      setInput((existing) =>
        appDom.setQueryProp(existing, 'sheetName', newValue?.properties?.title ?? null),
      );
    },
    [setInput],
  );

  const handleRangeChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setInput((existing) => appDom.setQueryProp(existing, 'ranges', event.target.value));
    },
    [setInput],
  );

  const handleTransformChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setInput((existing) => appDom.setQueryProp(existing, 'headerRow', event.target.checked));
    },
    [setInput],
  );

  const handleSpreadsheetInput = React.useCallback(
    (event: React.SyntheticEvent, spreadshetInput: string, reason: string) => {
      if (reason === 'input') {
        setSpreadsheetQuery(spreadshetInput);
      }
    },
    [],
  );

  const fetchPrivate = useFetchPrivate<GoogleSheetsPrivateQuery, GoogleSheetsResult>();
  const fetchServerPreview = React.useCallback(
    (query: GoogleSheetsApiQuery) => fetchPrivate({ type: 'DEBUG_EXEC', query }),
    [fetchPrivate],
  );

  const { preview, runPreview: handleRunPreview } = useQueryPreview(
    fetchServerPreview,
    input.attributes.query.value,
    {},
  );

  const rawRows: any[] = preview?.data || EMPTY_ROWS;
  const columns: GridColDef[] = React.useMemo(() => parseColumns(inferColumns(rawRows)), [rawRows]);
  const rows = React.useMemo(() => rawRows.map((row, id) => ({ id, ...row })), [rawRows]);
  const previewGridKey = React.useMemo(() => getObjectKey(columns), [columns]);

  return (
    <SplitPane split="vertical" size="50%" allowResize>
      <QueryInputPanel onRunPreview={handleRunPreview}>
        <Stack direction="column" gap={2} sx={{ px: 3, pt: 1 }}>
          <Autocomplete
            fullWidth
            value={fetchedFile.data ?? null}
            loading={fetchedFiles.isLoading}
            loadingText={'Loading…'}
            options={fetchedFiles.data?.files ?? []}
            getOptionLabel={(option: GoogleDriveFile) => option.name ?? ''}
            onInputChange={handleSpreadsheetInput}
            onChange={handleSpreadsheetChange}
            isOptionEqualToValue={(option: GoogleDriveFile, val: GoogleDriveFile) =>
              option.id === val.id
            }
            renderInput={(params) => <TextField {...params} label="Select spreadsheet" />}
            renderOption={(props, option) => {
              return (
                <li {...props} key={option.id}>
                  {option.name}
                </li>
              );
            }}
          />
          <Autocomplete
            fullWidth
            loading={fetchedSpreadsheet.isLoading}
            value={selectedSheet}
            loadingText={'Loading…'}
            options={fetchedSpreadsheet.data?.sheets ?? []}
            getOptionLabel={(option: GoogleSheet) => option.properties?.title ?? ''}
            onChange={handleSheetChange}
            renderInput={(params) => <TextField {...params} label="Select sheet" />}
            renderOption={(props, option) => {
              return (
                <li {...props} key={option?.properties?.sheetId}>
                  {option?.properties?.title}
                </li>
              );
            }}
          />
          <TextField
            label="Range"
            helperText={`In the form of A1:Z999`}
            value={input.attributes.query.value.ranges}
            disabled={!input.attributes.query.value.sheetName}
            onChange={handleRangeChange}
          />
          <FormControlLabel
            label="First row contains column headers"
            control={
              <Checkbox
                checked={input.attributes.query.value.headerRow}
                onChange={handleTransformChange}
                inputProps={{ 'aria-label': 'controlled' }}
              />
            }
          />
        </Stack>
      </QueryInputPanel>

      {preview?.error ? (
        <ErrorAlert error={preview?.error} />
      ) : (
        <DataGridPro sx={{ border: 'none' }} columns={columns} key={previewGridKey} rows={rows} />
      )}
    </SplitPane>
  );
}

function ConnectionParamsInput({
  appId,
  connectionId,
  handlerBasePath,
}: ConnectionEditorProps<GoogleSheetsConnectionParams>) {
  const validatedUser: UseQueryResult<GoogleDriveUser> = usePrivateQuery(
    {
      type: 'CONNECTION_STATUS',
    },
    { retry: false },
  );
  return (
    <Stack direction="column" gap={1}>
      <Button
        component="a"
        disabled={Boolean(validatedUser.data)}
        href={`${handlerBasePath}/auth/login?state=${encodeURIComponent(
          JSON.stringify({ appId, connectionId }),
        )}
        `}
        variant="outlined"
      >
        <Typography variant="button">
          {validatedUser.isLoading ? (
            <Skeleton width={100} />
          ) : (
            `Connect${validatedUser.data ? `ed: ${validatedUser.data.emailAddress}` : ''}`
          )}
        </Typography>
      </Button>
    </Stack>
  );
}

let script: HTMLScriptElement | null = null;
const emitter = mitt();
function useGsi() {
  const client = React.useSyncExternalStore(
    (handler) => {
      emitter.on('load', handler);

      if (!script) {
        script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
          emitter.emit('load');
        };
        script.async = true;
        script.id = 'google-client-script';
        document.body.appendChild(script);
      }

      return () => {
        emitter.off('load', handler);
      };
    },
    () => window.google ?? null,
    () => null,
  );
  return client;
}

function ConnectionParamsInput2({
  value,
  onChange,
  onClose,
}: ConnectionEditorProps2<GoogleSheetsConnectionParams>) {
  const { handleSubmit, register, formState, reset, setValue } = useForm({
    defaultValues: value,
    reValidateMode: 'onChange',
    mode: 'all',
  });
  React.useEffect(() => reset(value), [reset, value]);

  const doSubmit = handleSubmit((connectionParams) => onChange(connectionParams));

  const validatedUser: UseQueryResult<GoogleDriveUser> = usePrivateQuery2(
    {
      type: 'GLOBAL_CONNECTION_STATUS',
      value,
    },
    { globalConnection: true, retry: false, enabled: false },
  );

  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const google = useGsi();

  const fetchPrivate = useFetchPrivate<GoogleSheetsPrivateQuery, any>();

  const handleAuthClick = React.useCallback(() => {
    invariant(
      google && config.googleSheetsClientId,
      'Button should be blocked as long as client is not initialized',
    );

    const client = google.accounts.oauth2.initCodeClient({
      client_id: config.googleSheetsClientId,
      scope: [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/drive.readonly',
      ].join(' '),
      ux_mode: 'popup',
      callback: async (response) => {
        if (response.error) {
          setError(response.error_description);
          return;
        }
        setLoading(true);
        try {
          const { tokens } = await fetchPrivate({ type: 'RECEIVE_CODE', code: response.code });
          setValue('secrets.tokens', { kind: 'set', value: JSON.stringify(tokens) });
        } catch (rawError: unknown) {
          setError(errorFrom(rawError).message);
        } finally {
          setLoading(false);
        }
      },
      error_callback: (err) => {
        setError(err.message);
      },
    });
    client.requestCode();
  }, [fetchPrivate, google, setValue]);

  console.log(validatedUser);

  return (
    <React.Fragment>
      <DialogContent>
        <TextField
          label="name"
          {...register('name', { required: true })}
          {...validation(formState, 'name')}
        />
        <Stack direction="column" sx={{ gap: 1 }}>
          <Button
            disabled={!google || !config.googleSheetsClientId}
            variant="outlined"
            onClick={handleAuthClick}
          >
            Connect
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        {onClose ? (
          <Button color="inherit" variant="text" onClick={onClose}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" onClick={doSubmit} disabled={!formState.isValid}>
          Save
        </Button>
      </DialogActions>
    </React.Fragment>
  );
}

const dataSource: ClientDataSource<GoogleSheetsConnectionParams, GoogleSheetsApiQuery> = {
  displayName: 'Google Sheets',
  ConnectionParamsInput,
  ConnectionParamsInput2,
  QueryEditor,
  getInitialQueryValue,
};

export default dataSource;
