import * as React from 'react';
import { LoadingButton as MuiButton, LoadingButtonProps as MuiButtonProps } from '@mui/lab';
import { createComponent } from '@mui/toolpad-core';
import { Box, BoxProps } from '@mui/material';

interface ButtonProps extends Omit<MuiButtonProps, 'children'> {
  content: string;
  alignItems?: BoxProps['alignItems'];
  justifyContent?: BoxProps['justifyContent'];
}

function Button({ content, alignItems, justifyContent, ...props }: ButtonProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems,
        justifyContent,
      }}
    >
      <MuiButton {...props}>{content}</MuiButton>
    </Box>
  );
}

export default createComponent(Button, {
  argTypes: {
    content: {
      typeDef: { type: 'string' },
      defaultValue: 'Button Text',
    },
    onClick: {
      typeDef: { type: 'event' },
    },
    variant: {
      typeDef: { type: 'string', enum: ['contained', 'outlined', 'text'] },
      defaultValue: 'contained',
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
    color: {
      typeDef: { type: 'string', enum: ['primary', 'secondary'] },
      defaultValue: 'primary',
    },
    loading: {
      typeDef: { type: 'boolean' },
    },
    sx: {
      typeDef: { type: 'object' },
    },
  },
});
