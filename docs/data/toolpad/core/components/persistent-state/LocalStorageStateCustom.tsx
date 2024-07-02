import * as React from 'react';
import { useLocalStorageState, Codec } from '@toolpad/core';
import dayjs, { Dayjs } from 'dayjs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// preview-start
const DAYJS_CODEC: Codec<Dayjs> = {
  parse: (dateString) => dayjs(dateString),
  stringify: (date) => date.toISOString(),
};

export default function LocalStorageStateCustom() {
  const [value, setValue] = useLocalStorageState('custom-value', null, {
    codec: DAYJS_CODEC,
  });
  // ...
  // preview-end
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack direction="row" spacing={2}>
        <DatePicker
          label="Basic date picker"
          value={value}
          onChange={(newValue) => setValue(newValue)}
        />
        <Button onClick={() => setValue(null)}>Clear</Button>
      </Stack>
    </LocalizationProvider>
  );
}
