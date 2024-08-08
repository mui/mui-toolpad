import * as React from 'react';
import {
  Box,
  Divider,
  MenuItem,
  Skeleton,
  styled,
  SxProps,
  TextField,
  Toolbar,
  ToolbarProps,
  Typography,
  inputLabelClasses,
  inputBaseClasses,
} from '@mui/material';
import { TabContext } from '@mui/lab';
import { BindableAttrValue, LiveBinding, ScopeMeta } from '@toolpad/studio-runtime';
import { useServerJsRuntime } from '@toolpad/studio-runtime/jsServerRuntime';
import { Maybe, WithControlledProp } from '@toolpad/utils/types';
import { Body, RawBody, UrlEncodedBody } from './types';
import {
  useEvaluateLiveBinding,
  useEvaluateLiveBindingEntries,
} from '../../toolpad/AppEditor/useEvaluateLiveBinding';
import BindableEditor from '../../toolpad/AppEditor/PageEditor/BindableEditor';
import lazyComponent from '../../utils/lazyComponent';
import TabPanel from '../../components/TabPanel';
import ParametersEditor from '../../toolpad/AppEditor/PageEditor/ParametersEditor';
import { HTTP_NO_BODY } from './shared';

const BodyEditorRoot = styled('div')({
  position: 'relative',
});

interface ContentTypeSpec {
  alias: string;
  language: string;
}

const RAW_CONTENT_TYPES = new Map<string, ContentTypeSpec>([
  ['text/plain', { alias: 'text', language: 'plaintext' }],
  ['application/json', { alias: 'json', language: 'json' }],
  ['text/javascript', { alias: 'javascript', language: 'typescript' }],
  ['text/csv', { alias: 'csv', language: 'plaintext' }],
  ['text/html', { alias: 'html', language: 'html' }],
  ['text/css', { alias: 'css', language: 'css' }],
  ['application/xml', { alias: 'xml', language: 'plaintext' }],
]);

const BodyEditorToolbar = styled((props: ToolbarProps) => (
  <React.Fragment>
    <Toolbar disableGutters {...props} />
    <Divider />
  </React.Fragment>
))(({ theme }) => ({
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

interface RenderBodyToolbarParams {
  actions?: React.ReactNode;
}

interface RenderBodyToolbar {
  (params?: RenderBodyToolbarParams): React.ReactNode;
}

const MonacoEditor = lazyComponent(() => import('../../components/MonacoEditor'), {
  noSsr: true,
  fallback: <Skeleton variant="rectangular" height="100%" />,
});

interface BodyTypeEditorProps<B = Body> extends WithControlledProp<Maybe<B>> {
  globalScopeMeta: ScopeMeta;
  globalScope: Record<string, any>;
  renderToolbar: RenderBodyToolbar;
  disabled?: boolean;
}

function RawBodyEditor({
  renderToolbar,
  value: valueProp,
  onChange,
  globalScope,
  globalScopeMeta,
  disabled,
}: BodyTypeEditorProps<RawBody>) {
  const value: RawBody = React.useMemo(
    () =>
      valueProp ?? {
        kind: 'raw',
        contentType: 'text/plain',
        content: '',
      },
    [valueProp],
  );

  const handleContentTypeChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, contentType: event.target.value });
    },
    [onChange, value],
  );

  const handleValueChange = React.useCallback(
    (newContent: BindableAttrValue<string> | null) => {
      onChange({ ...value, content: newContent || '' });
    },
    [onChange, value],
  );

  const content = value?.content ?? null;

  const jsServerRuntime = useServerJsRuntime();

  const liveContent: LiveBinding = useEvaluateLiveBinding({
    jsRuntime: jsServerRuntime,
    input: content,
    globalScope,
  });

  const { language = 'plaintext' } = RAW_CONTENT_TYPES.get(value.contentType) ?? {};

  return (
    <React.Fragment>
      {renderToolbar({
        actions: (
          <TextField
            select
            label="content-type"
            sx={{
              [`& .${inputLabelClasses.root}`]: { fontSize: 12 },
              [`& .${inputBaseClasses.root}`]: { fontSize: 12 },
              width: 200,
            }}
            value={value?.contentType}
            onChange={handleContentTypeChange}
            disabled={disabled}
          >
            {Array.from(RAW_CONTENT_TYPES.entries(), ([contentType, { alias }]) => (
              <MenuItem key={contentType} value={contentType}>
                {alias}
              </MenuItem>
            ))}
          </TextField>
        ),
      })}
      <BindableEditor<string>
        sx={{ mt: 1 }}
        liveBinding={liveContent}
        globalScope={globalScope}
        globalScopeMeta={globalScopeMeta}
        propType={{ type: 'string' }}
        jsRuntime={jsServerRuntime}
        renderControl={(props) => (
          <MonacoEditor
            sx={{ flex: 1, height: 250 }}
            language={language}
            value={props.value}
            onChange={props.onChange}
            disabled={props.disabled}
          />
        )}
        value={value?.content || null}
        onChange={handleValueChange}
        label="json"
        disabled={disabled}
      />
    </React.Fragment>
  );
}

function UrlEncodedBodyEditor({
  renderToolbar,
  value: valueProp,
  onChange,
  globalScope,
  globalScopeMeta,
  disabled,
}: BodyTypeEditorProps<UrlEncodedBody>) {
  const value: UrlEncodedBody = React.useMemo(
    () =>
      valueProp ?? {
        kind: 'urlEncoded',
        contentType: 'text/plain',
        content: [],
      },
    [valueProp],
  );

  const handleParamsChange = React.useCallback(
    (newContent: [string, BindableAttrValue<any>][]) => {
      onChange({ ...value, content: newContent });
    },
    [onChange, value],
  );

  const jsServerRuntime = useServerJsRuntime();
  const liveContent = useEvaluateLiveBindingEntries({
    jsRuntime: jsServerRuntime,
    input: value.content,
    globalScope,
  });

  return (
    <React.Fragment>
      {renderToolbar()}
      <ParametersEditor
        sx={{ mt: 1 }}
        value={value.content}
        onChange={handleParamsChange}
        globalScope={globalScope}
        globalScopeMeta={globalScopeMeta}
        liveValue={liveContent}
        disabled={disabled}
        jsRuntime={jsServerRuntime}
      />
    </React.Fragment>
  );
}

type BodyKind = Body['kind'];

export interface BodyEditorProps extends WithControlledProp<Maybe<Body>> {
  globalScopeMeta: ScopeMeta;
  globalScope: Record<string, any>;
  sx?: SxProps;
  method?: string;
}

export default function BodyEditor({
  globalScope,
  globalScopeMeta,
  value,
  onChange,
  sx,
  method: methodProp,
}: BodyEditorProps) {
  const [activeTab, setActiveTab] = React.useState<BodyKind>(value?.kind || 'raw');
  React.useEffect(() => setActiveTab(value?.kind || 'raw'), [value?.kind]);

  const handleTabChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setActiveTab(event.target.value as BodyKind);
  };

  const method = methodProp || 'GET';
  const disabled = HTTP_NO_BODY.has(method);

  const renderToolbar = React.useCallback<RenderBodyToolbar>(
    ({ actions } = {}) => (
      <BodyEditorToolbar>
        <TextField
          label="body"
          // sx={{ width: 200 }}
          select
          value={activeTab}
          onChange={handleTabChange}
          disabled={disabled}
          sx={{
            [`& .${inputLabelClasses.root}`]: { fontSize: 12 },
            [`& .${inputBaseClasses.root}`]: { fontSize: 12 },
            width: 200,
          }}
          slotProps={{
            htmlInput: { sx: { fontSize: 12 } },
          }}
        >
          <MenuItem value="raw">raw</MenuItem>
          <MenuItem value="urlEncoded">x-www-form-urlencoded</MenuItem>
        </TextField>
        {actions}
      </BodyEditorToolbar>
    ),
    [activeTab, disabled],
  );

  return (
    <BodyEditorRoot sx={sx}>
      <TabContext value={activeTab}>
        <TabPanel disableGutters value="raw">
          <RawBodyEditor
            renderToolbar={renderToolbar}
            globalScope={globalScope}
            globalScopeMeta={globalScopeMeta}
            value={value?.kind === 'raw' ? (value as RawBody) : null}
            onChange={onChange}
            disabled={disabled}
          />
        </TabPanel>
        <TabPanel disableGutters value="urlEncoded">
          <UrlEncodedBodyEditor
            renderToolbar={renderToolbar}
            globalScope={globalScope}
            globalScopeMeta={globalScopeMeta}
            value={value?.kind === 'urlEncoded' ? (value as UrlEncodedBody) : null}
            onChange={onChange}
            disabled={disabled}
          />
        </TabPanel>
      </TabContext>
      {HTTP_NO_BODY.has(method) ? (
        <Box
          sx={{
            position: 'absolute',
            inset: '0 0 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography color="info" variant="body2">
            &quot;{method}&quot; requests can&apos;t have a body
          </Typography>
        </Box>
      ) : null}
    </BodyEditorRoot>
  );
}
