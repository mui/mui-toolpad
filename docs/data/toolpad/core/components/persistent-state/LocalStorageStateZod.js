import * as React from 'react';
import { useLocalStorageState } from '@toolpad/core';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { z } from 'zod';

const schema = z.enum(['foo', 'bar', 'baz']).default('foo');

const CODEC = {
  parse: (value) => {
    try {
      return schema.parse(JSON.parse(value));
    } catch {
      return 'foo';
    }
  },
  stringify: (value) => JSON.stringify(value),
};

export default function LocalStorageStateZod() {
  const [value, setValue] = useLocalStorageState('zod-value', null, {
    codec: CODEC,
  });
  // ...
  // preview-end
  return (
    <Stack direction="row" spacing={2}>
      <Select
        value={value ?? 'foo'}
        onChange={(event) => setValue(event.target.value)}
      >
        <MenuItem value="foo">Foo</MenuItem>
        <MenuItem value="bar">Bar</MenuItem>
        <MenuItem value="baz">Baz</MenuItem>
      </Select>
    </Stack>
  );
}
