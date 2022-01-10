import Paper from '@mui/material/Paper';
import { createComponent } from '@mui/studio-core';

export default createComponent(Paper, {
  props: {
    elevation: {
      type: 'number',
      defaultValue: 1,
    },
    children: {
      type: 'slot',
      defaultValue: null,
    },
  },
  argTypes: {
    elevation: {
      typeDef: { type: 'number', minimum: 0 },
      defaultValue: 1,
    },
    children: {
      typeDef: { type: 'element' },
      control: { type: 'slot' },
    },
  },
});
