import Button from '@mui/material/Button';
import { createComponent } from '@mui/studio-core';

export default createComponent(Button, {
  props: {
    children: { type: 'string', defaultValue: 'Button Text' },
    disabled: { type: 'boolean', defaultValue: false },
    variant: {
      type: 'ButtonVariant',
      defaultValue: 'contained',
    },
    color: {
      type: 'Color',
      defaultValue: 'primary',
    },
  },
  argTypes: {
    children: {
      name: 'content',
      typeDef: { type: 'string' },
      defaultValue: 'Button Text',
    },
    disabled: {
      typeDef: { type: 'boolean' },
    },
    variant: {
      typeDef: { type: 'string', enum: ['contained', 'outlined', 'text'] },
      defaultValue: 'contained',
    },
    color: {
      typeDef: { type: 'string', enum: ['primary', 'secondary'] },
      defaultValue: 'primary',
    },
  },
});
