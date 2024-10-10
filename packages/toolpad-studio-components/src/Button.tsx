import * as React from 'react';
import { LoadingButton as MuiButton, LoadingButtonProps as MuiButtonProps } from '@mui/lab';
import createBuiltin from './createBuiltin';
import { SX_PROP_HELPER_TEXT } from './constants';

interface ButtonProps extends Omit<MuiButtonProps, 'children'> {
  content: string;
}

function Button({ content, ...rest }: ButtonProps) {
  return <MuiButton {...rest}>{content}</MuiButton>;
}

export default createBuiltin(Button, {
  helperText:
    'The Material UI [Button](https://mui.com/material-ui/react-button/) component.\n\nButtons allow users to take actions, and make choices, with a single tap.',
  layoutDirection: 'both',
  argTypes: {
    onClick: {
      helperText: 'Add logic to be executed when the user clicks the button.',
      type: 'event',
    },
    content: {
      helperText: 'Will appear as the text content of the button.',
      type: 'string',
      default: 'Button Text',
    },
    variant: {
      helperText:
        'One of the available Material UI Button [variants](https://mui.com/material-ui/react-button/#basic-button). Possible values are `contained`, `outlined` or `text`',
      type: 'string',
      enum: ['contained', 'outlined', 'text'],
      default: 'contained',
    },
    size: {
      helperText: 'The size of the component. One of `small`, `medium`, or `large`.',
      type: 'string',
      enum: ['small', 'medium', 'large'],
      default: 'small',
    },
    color: {
      helperText: 'The theme color of the component.',
      type: 'string',
      enum: ['primary', 'secondary'],
      default: 'primary',
    },
    fullWidth: {
      helperText: 'Whether the button should occupy all available horizontal space.',
      type: 'boolean',
    },
    loading: {
      helperText: "Displays a loading animation indicating the button isn't interactive yet",
      type: 'boolean',
    },
    disabled: {
      helperText: 'Whether the button is disabled.',
      type: 'boolean',
    },
    sx: {
      helperText: SX_PROP_HELPER_TEXT,
      type: 'object',
    },
  },
});
