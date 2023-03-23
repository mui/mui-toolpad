import * as React from 'react';
import { Container as MUIContainer, ContainerProps } from '@mui/material';
import { createComponent } from '@mui/toolpad-core';
import { SX_PROP } from './constants.js';

interface Props extends ContainerProps {
  visible: boolean;
}

function Container({ children, visible, sx, ...props }: Props) {
  return visible ? (
    <MUIContainer disableGutters sx={sx} {...props}>
      {children}
    </MUIContainer>
  ) : null;
}

export default createComponent(Container, {
  argTypes: {
    children: {
      typeDef: { type: 'element' },
      control: { type: 'layoutSlot' },
    },
    visible: {
      typeDef: { type: 'boolean', default: true },
      helperText: 'Control whether container element is visible.',
    },
    sx: SX_PROP,
  },
});
