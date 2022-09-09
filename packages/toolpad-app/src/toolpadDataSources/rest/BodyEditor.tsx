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
} from '@mui/material';
import { TabContext } from '@mui/lab';
import { BindableAttrValue, LiveBinding } from '@mui/toolpad-core';
import { Body, RawBody, UrlEncodedBody } from './types';
import { Maybe, WithControlledProp } from '../../utils/types';
import {
  useEvaluateLiveBinding,
  useEvaluateLiveBindingEntries,
} from '../../toolpad/AppEditor/useEvaluateLiveBinding';
import BindableEditor from '../../toolpad/AppEditor/PageEditor/BindableEditor';
import lazyComponent from '../../utils/lazyComponent';
import * as appDom from '../../appDom';
import TabPanel from '../../components/TabPanel';
import ParametersEditor from '../../toolpad/AppEditor/PageEditor/ParametersEditor';
import { HTTP_NO_BODY } from './shared';

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
  globalScope: Record<string, any>;
  renderToolbar: RenderBodyToolbar;
  disabled?: boolean;
}

function RawBodyEditor({
  renderToolbar,
  value: valueProp,
  onChange,
  globalScope,
  disabled,
}: BodyTypeEditorProps<RawBody>) {
  const value: RawBody = React.useMemo(
    () =>
      valueProp ?? {
        kind: 'raw',
        contentType: appDom.createConst('text/plain'),
        content: appDom.createConst(''),
      },
    [valueProp],
  );

  const handleContentTypeChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, contentType: appDom.createConst(event.target.value) });
    },
    [onChange, value],
  );

  const handleValueChange = React.useCallback(
    (newContent: BindableAttrValue<string> | null) => {
      onChange({ ...value, content: newContent || appDom.createConst('') });
    },
    [onChange, value],
  );

  const content = value?.content ?? null;

  const liveContent: LiveBinding = useEvaluateLiveBinding({
    server: true,
    input: content,
    globalScope,
  });

  const { language = 'plaintext' } = RAW_CONTENT_TYPES.get(value.contentType.value) ?? {};

  return (
    <React.Fragment>
      {renderToolbar({
        actions: (
          <React.Fragment>
            <TextField
              select
              value={value?.contentType.value}
              onChange={handleContentTypeChange}
              disabled={disabled}
            >
              {Array.from(RAW_CONTENT_TYPES.entries(), ([contentType, { alias }]) => (
                <MenuItem key={contentType} value={contentType}>
                  {alias}
                </MenuItem>
              ))}
            </TextField>
          </React.Fragment>
        ),
      })}
      <BindableEditor
        sx={{ mt: 1 }}
        liveBinding={liveContent}
        globalScope={globalScope}
        propType={{ type: 'string' }}
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
  disabled,
}: BodyTypeEditorProps<UrlEncodedBody>) {
  const value: UrlEncodedBody = React.useMemo(
    () =>
      valueProp ?? {
        kind: 'urlEncoded',
        contentType: appDom.createConst('text/plain'),
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

  const liveContent = useEvaluateLiveBindingEntries({
    server: true,
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
        liveValue={liveContent}
        disabled={disabled}
      />
    </React.Fragment>
  );
}

type BodyKind = Body['kind'];

export interface BodyEditorProps extends WithControlledProp<Maybe<Body>> {
  globalScope: Record<string, any>;
  sx?: SxProps;
  method?: string;
}

export default function BodyEditor({
  globalScope,
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
        <TextField select value={activeTab} onChange={handleTabChange} disabled={disabled}>
          <MenuItem value="raw">raw</MenuItem>
          <MenuItem value="urlEncoded">x-www-form-urlencoded</MenuItem>
        </TextField>
        {actions}
      </BodyEditorToolbar>
    ),
    [activeTab, disabled],
  );

  return (
    <Box sx={{ ...sx, position: 'relative' }}>
      <TabContext value={activeTab}>
        <TabPanel disableGutters value="raw">
          <RawBodyEditor
            renderToolbar={renderToolbar}
            globalScope={globalScope}
            value={value?.kind === 'raw' ? (value as RawBody) : null}
            onChange={onChange}
            disabled={disabled}
          />
        </TabPanel>
        <TabPanel disableGutters value="urlEncoded">
          <UrlEncodedBodyEditor
            renderToolbar={renderToolbar}
            globalScope={globalScope}
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
    </Box>
  );
}
