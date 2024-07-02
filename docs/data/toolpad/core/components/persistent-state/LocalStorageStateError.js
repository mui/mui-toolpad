import * as React from 'react';
import { useLocalStorageState } from '@toolpad/core';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

// preview-start
const CODEC_JSON = {
  parse: (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return { _error: 'parse failed' };
    }
  },
  stringify: (value) => JSON.stringify(value),
};
// preview-end

export default function LocalStorageStateError() {
  const [value, setValue] = useLocalStorageState('error-value', null, {
    codec: CODEC_JSON,
  });
  return (
    <Stack spacing={2} alignItems="center">
      <pre>value: {JSON.stringify(value)}</pre>

      <Stack direction="row" spacing={2}>
        <Button onClick={() => setValue({ foo: Math.random() })}>Set JSON</Button>
        <Button
          onClick={() => window.localStorage.setItem('error-value', 'invalid json')}
        >
          Set Invalid JSON
        </Button>
      </Stack>
    </Stack>
  );
}
