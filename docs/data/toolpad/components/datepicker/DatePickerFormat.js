import * as React from 'react';
import { DatePicker } from '@mui/toolpad-components';
import { Stack } from '@mui/material';

const TOOLPAD_PROPS1 = {
  size: 'small',
  variant: 'outlined',
  label: 'MM/dd/yyyy',
  format: 'MM/dd/yyyy',
};

const TOOLPAD_PROPS2 = {
  size: 'small',
  variant: 'outlined',
  label: 'MMMM-YY',
  format: 'MMMM-YY',
  // defaultValue: '2017-05-24',
};

export default function BasicButton() {
  return (
    <Stack spacing={2} direction="row" alignItems="center">
      <DatePicker {...TOOLPAD_PROPS1} />
      <DatePicker {...TOOLPAD_PROPS2} />
    </Stack>
  );
}
