import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  styled,
  tooltipClasses,
  TooltipProps,
  TextField,
  MenuItem,
  Tab,
} from '@mui/material';
import * as React from 'react';
import LinkIcon from '@mui/icons-material/Link';
import AddLinkIcon from '@mui/icons-material/AddLink';
import {
  LiveBinding,
  PropValueType,
  BindableAttrValue,
  JsExpressionAttrValue,
  NavigationAction,
  NodeId,
  JsExpressionAction,
} from '@mui/toolpad-core';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Maybe, WithControlledProp } from '../../utils/types';
import { JsExpressionEditor } from './PageEditor/JsExpressionEditor';
import JsonView from '../JsonView';
import { tryFormatExpression } from '../../utils/prettier';
import useLatest from '../../utils/useLatest';
import useDebounced from '../../utils/useDebounced';
import { useEvaluateLiveBinding } from './useEvaluateLiveBinding';
import useShortcut from '../../utils/useShortcut';
import { createProvidedContext } from '../../utils/react';
import { useDom } from '../DomLoader';
import * as appDom from '../../appDom';
import { usePageEditorState } from './PageEditor/PageEditorProvider';

interface BindingEditorContext {
  label: string;
  globalScope: Record<string, unknown>;
  /**
   * Serverside binding, use the QuickJs runtime to evaluate bindings
   */
  server?: boolean;
  disabled?: boolean;
  propType?: PropValueType;
  liveBinding?: LiveBinding;
}

const [useBindingEditorContext, BindingEditorContextProvider] =
  createProvidedContext<BindingEditorContext>('BindingEditor');

const ErrorTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.error.dark,
  },
}));

interface JsExpressionBindingEditorProps extends WithControlledProp<JsExpressionAttrValue | null> {
  globalScope: Record<string, unknown>;
}

function JsExpressionBindingEditor({
  globalScope,
  value,
  onChange,
}: JsExpressionBindingEditorProps) {
  const handleChange = React.useCallback(
    (newValue: string) => onChange({ type: 'jsExpression', value: newValue }),
    [onChange],
  );

  return (
    <JsExpressionEditor
      globalScope={globalScope}
      value={value?.type === 'jsExpression' ? value.value : ''}
      onChange={handleChange}
      autoFocus
    />
  );
}

interface JsExpressionPreviewProps {
  server?: boolean;
  input: BindableAttrValue<any> | null;
  globalScope: Record<string, unknown>;
}

function JsExpressionPreview({ server, input, globalScope }: JsExpressionPreviewProps) {
  const previewValue: LiveBinding = useEvaluateLiveBinding({ server, input, globalScope });

  const lastGoodPreview = useLatest(previewValue?.error ? undefined : previewValue);
  const previewErrorDebounced = useDebounced(previewValue?.error, 500);
  const previewError = previewValue?.error && previewErrorDebounced;

  return (
    <React.Fragment>
      <Toolbar disableGutters>
        <Typography color="error">{previewError?.message}</Typography>
      </Toolbar>
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <JsonView src={lastGoodPreview?.value} />
      </Box>
    </React.Fragment>
  );
}

export interface JsBindingEditorProps extends WithControlledProp<JsExpressionAttrValue | null> {}

export function JsBindingEditor({ value, onChange }: JsBindingEditorProps) {
  const { label, globalScope, server, propType } = useBindingEditorContext();
  return (
    <Stack direction="row" sx={{ height: 400, gap: 2 }}>
      <Box sx={{ width: 200, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Typography sx={{ mb: 1 }} variant="subtitle2">
          Scope
        </Typography>
        <Box sx={{ flex: 1, width: '100%', overflow: 'auto' }}>
          <JsonView src={globalScope} />
        </Box>
      </Box>

      <Box sx={{ height: '100%', display: 'flex', flex: 1, flexDirection: 'column' }}>
        <Typography sx={{ mb: 2 }}>
          Make the &quot;{label}&quot; property dynamic with a JavaScript expression. This property
          expects a type: <code>{propType?.type || 'any'}</code>.
        </Typography>

        <JsExpressionBindingEditor globalScope={globalScope} value={value} onChange={onChange} />

        <JsExpressionPreview server={server} input={value} globalScope={globalScope} />
      </Box>
    </Stack>
  );
}

export interface JsExpressionActionEditorProps
  extends WithControlledProp<JsExpressionAction | null> {}

function JsExpressionActionEditor({ value, onChange }: JsExpressionActionEditorProps) {
  const { globalScope } = useBindingEditorContext();
  const handleCodeChange = React.useCallback(
    (newValue: string) => onChange({ type: 'jsExpressionAction', value: newValue }),
    [onChange],
  );
  return (
    <Box sx={{ my: 1 }}>
      <Typography>Run code when this event fires</Typography>
      <JsExpressionEditor
        sx={{ my: 3 }}
        globalScope={globalScope}
        value={value?.value || ''}
        onChange={handleCodeChange}
      />
    </Box>
  );
}

export interface NavigationActionEditorProps extends WithControlledProp<NavigationAction | null> {}

function NavigationActionEditor({ value, onChange }: NavigationActionEditorProps) {
  const dom = useDom();
  const root = appDom.getApp(dom);
  const { pages = [] } = appDom.getChildNodes(dom, root);
  const { nodeId: currentPageNodeId } = usePageEditorState();

  const handlePageChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ type: 'navigationAction', value: { page: event.target.value as NodeId } });
    },
    [onChange],
  );

  const availablePages = React.useMemo(
    () => pages.filter((page) => page.id !== currentPageNodeId),
    [pages, currentPageNodeId],
  );

  const hasPagesAvailable = availablePages.length > 0;

  return (
    <Box sx={{ my: 1 }}>
      <Typography>Navigate to a page on this event</Typography>
      <TextField
        fullWidth
        sx={{ my: 3 }}
        label="page"
        select
        value={value?.value?.page || ''}
        onChange={handlePageChange}
        disabled={!hasPagesAvailable}
        helperText={hasPagesAvailable ? null : 'No other pages available'}
      >
        {availablePages.map((page) => (
          <MenuItem key={page.id} value={page.id}>
            {page.name}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
}

type BindableType = BindableAttrValue<any>['type'];

function getActionTab(value: Maybe<BindableAttrValue<any>>) {
  return value?.type || 'jsExpressionAction';
}

export interface ActionEditorProps extends WithControlledProp<BindableAttrValue<any> | null> {}

function ActionEditor({ value, onChange }: ActionEditorProps) {
  const [activeTab, setActiveTab] = React.useState<BindableType>(getActionTab(value));
  React.useEffect(() => setActiveTab(getActionTab(value)), [value]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: BindableType) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <TabContext value={activeTab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleTabChange} aria-label="lab API tabs example">
            <Tab label="JS expression" value="jsExpressionAction" />
            <Tab label="Navigation" value="navigationAction" />
          </TabList>
        </Box>
        <TabPanel value="jsExpressionAction">
          <JsExpressionActionEditor
            value={value?.type === 'jsExpressionAction' ? value : null}
            onChange={onChange}
          />
        </TabPanel>
        <TabPanel value="navigationAction">
          <NavigationActionEditor
            value={value?.type === 'navigationAction' ? value : null}
            onChange={onChange}
          />
        </TabPanel>
      </TabContext>
    </Box>
  );
}

export interface BindingEditorDialogProps<V>
  extends WithControlledProp<BindableAttrValue<V> | null> {
  open: boolean;
  onClose: () => void;
}

export function BindingEditorDialog<V>({
  value,
  onChange,
  open,
  onClose,
}: BindingEditorDialogProps<V>) {
  const { propType } = useBindingEditorContext();

  const [input, setInput] = React.useState(value);
  React.useEffect(() => setInput(value), [value]);

  const committedInput = React.useRef<BindableAttrValue<V> | null>(null);

  const handleSave = React.useCallback(() => {
    let newValue = input;

    if (input?.type === 'jsExpression') {
      newValue = {
        ...input,
        value: tryFormatExpression(input.value),
      };
    }

    committedInput.current = newValue;
    onChange(newValue);
  }, [onChange, input]);

  const handleCommit = React.useCallback(() => {
    handleSave();
    onClose();
  }, [handleSave, onClose]);

  const handleRemove = React.useCallback(() => {
    onChange(null);
    onClose();
  }, [onChange, onClose]);

  useShortcut({ code: 'KeyS', metaKey: true, disabled: !open }, handleSave);

  const hasUnsavedChanges = input && input !== committedInput.current;

  return (
    <Dialog onClose={onClose} open={open} fullWidth scroll="body" maxWidth="lg">
      <DialogTitle>Bind a property</DialogTitle>
      <DialogContent>
        {propType?.type === 'event' ? (
          <ActionEditor value={input} onChange={(newValue) => setInput(newValue)} />
        ) : (
          <JsBindingEditor
            value={input?.type === 'jsExpression' ? input : null}
            onChange={(newValue) => setInput(newValue)}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button color="inherit" variant="text" onClick={onClose}>
          {hasUnsavedChanges ? 'Cancel' : 'Close'}
        </Button>
        <Button color="inherit" disabled={!value} onClick={handleRemove}>
          Remove binding
        </Button>
        <Button disabled={!hasUnsavedChanges} color="primary" onClick={handleCommit}>
          Update binding
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export interface BindingEditorProps<V> extends WithControlledProp<BindableAttrValue<V> | null> {
  label: string;
  globalScope: Record<string, unknown>;
  /**
   * Uses the QuickJs runtime to evaluate bindings, just like on the server
   */
  server?: boolean;
  disabled?: boolean;
  propType?: PropValueType;
  liveBinding?: LiveBinding;
}

export function BindingEditor<V>({
  label,
  globalScope,
  server,
  disabled,
  propType,
  value,
  onChange,
  liveBinding,
}: BindingEditorProps<V>) {
  const [open, setOpen] = React.useState(false);

  const handleOpen = React.useCallback(() => setOpen(true), []);
  const handleClose = React.useCallback(() => setOpen(false), []);

  const hasBinding: boolean = !!value && value.type !== 'const';

  const error: string | undefined = liveBinding?.error?.message;

  const bindingButton = (
    <Checkbox
      aria-label="Bind property"
      checked={hasBinding}
      disabled={disabled}
      icon={<AddLinkIcon />}
      checkedIcon={<LinkIcon />}
      onClick={handleOpen}
      color={error ? 'error' : undefined}
    />
  );

  const TooltipComponent = error ? ErrorTooltip : Tooltip;
  const tooltipTitle: string =
    error ?? (hasBinding ? `Update "${label}" binding…` : `Bind "${label}"…`);
  const bindingButtonWithTooltip = disabled ? (
    bindingButton
  ) : (
    <TooltipComponent disableInteractive placement="top" title={tooltipTitle}>
      {bindingButton}
    </TooltipComponent>
  );

  const bindingEditorContext: BindingEditorContext = {
    label,
    globalScope,
    server,
    disabled,
    propType,
    liveBinding,
  };

  return (
    <BindingEditorContextProvider value={bindingEditorContext}>
      {bindingButtonWithTooltip}
      <BindingEditorDialog open={open} onClose={handleClose} value={value} onChange={onChange} />
    </BindingEditorContextProvider>
  );
}
