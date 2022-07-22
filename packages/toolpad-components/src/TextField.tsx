import * as React from 'react';
import {
  Box,
  TextField as MuiTextField,
  TextFieldProps as MuiTextFieldProps,
  BoxProps,
} from '@mui/material';
import { createComponent } from '@mui/toolpad-core';

export type TextFieldProps = MuiTextFieldProps & {
  alignItems?: BoxProps['alignItems'];
  justifyContent?: BoxProps['justifyContent'];
};

function TextField({ alignItems, justifyContent, ...props }: TextFieldProps) {
  return (
    <Box sx={{ display: 'flex', alignItems, justifyContent }}>
      <MuiTextField {...props} />
    </Box>
  );
}

export default createComponent(TextField, {
  argTypes: {
    label: {
      typeDef: { type: 'string' },
    },
    variant: {
      typeDef: { type: 'string', enum: ['outlined', 'filled', 'standard'] },
      defaultValue: 'outlined',
    },
    disabled: {
      typeDef: { type: 'boolean' },
    },
    alignItems: {
      typeDef: {
        type: 'string',
        enum: ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'],
      },
      label: 'Vertical alignment',
      control: { type: 'VerticalAlign' },
      defaultValue: 'center',
    },
    justifyContent: {
      typeDef: {
        type: 'string',
        enum: ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'],
      },
      label: 'Horizontal alignment',
      control: { type: 'HorizontalAlign' },
      defaultValue: 'start',
    },
    fullWidth: {
      typeDef: { type: 'boolean' },
    },
    size: {
      typeDef: { type: 'string', enum: ['small', 'normal'] },
      defaultValue: 'small',
    },
    value: {
      typeDef: { type: 'string' },
      onChangeProp: 'onChange',
      onChangeHandler: (event: React.ChangeEvent<HTMLInputElement>) => event.target.value,
      defaultValue: '',
    },
    sx: {
      typeDef: { type: 'object' },
    },
  },
});
