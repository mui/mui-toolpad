import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import * as React from 'react';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { PropValueType } from '@mui/studio-core';
import { StudioBindable } from '../../../types';
import { WithControlledProp } from '../../../utils/types';
import { JsExpressionEditor } from './JsExpressionEditor';
import { usePageEditorState } from './PageEditorProvider';
import RuntimeErrorAlert from './RuntimeErrorAlert';
import JsonView from '../../JsonView';
import { tryFormatExpression } from '../../../utils/prettier';

interface JsExpressionBindingEditorProps<V> extends WithControlledProp<StudioBindable<V> | null> {
  onCommit?: () => void;
}

function JsExpressionBindingEditor<V>({
  value,
  onChange,
  onCommit,
}: JsExpressionBindingEditorProps<V>) {
  const handleChange = React.useCallback(
    (newValue: string) => onChange({ type: 'jsExpression', value: newValue }),
    [onChange],
  );

  return (
    <JsExpressionEditor
      value={value?.type === 'jsExpression' ? value.value : ''}
      onChange={handleChange}
      onCommit={onCommit}
    />
  );
}

export interface BindingEditorProps<V> extends WithControlledProp<StudioBindable<V> | null> {
  disabled?: boolean;
  bindingId: string;
  propType: PropValueType;
}

export function BindingEditor<V>({
  disabled,
  bindingId,
  propType,
  value,
  onChange,
}: BindingEditorProps<V>) {
  const { viewState } = usePageEditorState();
  const liveBinding = viewState.bindings[bindingId];

  const [input, setInput] = React.useState(value);
  React.useEffect(() => setInput(value), [value]);

  const [open, setOpen] = React.useState(false);
  const handleOpen = React.useCallback(() => setOpen(true), []);
  const handleClose = React.useCallback(() => setOpen(false), []);

  const hasBinding = value && value.type !== 'const';

  const handleCommit = React.useCallback(() => {
    let newValue = input;

    if (input?.type === 'jsExpression') {
      newValue = {
        ...input,
        value: tryFormatExpression(input.value),
      };
    }

    onChange(newValue);
  }, [onChange, input]);

  return (
    <React.Fragment>
      <IconButton
        disabled={disabled}
        size="small"
        onClick={handleOpen}
        color={hasBinding ? 'primary' : 'inherit'}
      >
        {hasBinding ? <LinkIcon fontSize="inherit" /> : <LinkOffIcon fontSize="inherit" />}
      </IconButton>
      <Dialog onClose={handleClose} open={open} fullWidth scroll="body">
        <DialogTitle>Bind a property</DialogTitle>
        <DialogContent>
          <div>Type: {propType.type}</div>
          <JsExpressionBindingEditor<V>
            onCommit={handleCommit}
            value={input}
            onChange={(newValue) => setInput(newValue)}
          />
          {/* eslint-disable-next-line no-nested-ternary */}
          {liveBinding ? (
            liveBinding.error ? (
              <RuntimeErrorAlert error={liveBinding.error} />
            ) : (
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                <JsonView src={liveBinding.value} />
              </Box>
            )
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button disabled={!value} onClick={() => onChange(null)}>
            Remove
          </Button>
          <Button disabled={!input} color="primary" onClick={handleCommit}>
            Update binding
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
