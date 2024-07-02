import * as React from 'react';
import { useLocalStorageState } from '@toolpad/core';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

export default function LocalStorageStateString() {
  // preview-start
  const [value, setValue] = useLocalStorageState('string-value', 'Initial Value');
  // preview-end
  return (
    <Stack direction="row" spacing={2}>
      <TextField
        value={value ?? ''}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Type something..."
      />
      <Button onClick={() => setValue(null)}>Clear</Button>
    </Stack>
  );
}
