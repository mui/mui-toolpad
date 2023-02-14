import { TextField } from '@mui/material';
import * as React from 'react';
import type { EditorProps } from '../../types';

function StringPropEditor({ label, value, onChange, disabled }: EditorProps<string>) {
  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      debugger;
      onChange(event.target.value || undefined);
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
    />
  );
}

export default StringPropEditor;
