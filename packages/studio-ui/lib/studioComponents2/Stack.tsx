import { Stack, StackProps } from '@mui/material';
import { createComponent } from '@mui/studio-core';
import React from 'react';

interface StackComponentProps extends StackProps {
  gap?: number;
  direction?: 'row' | 'column';
}

function StackComponent({ children, ...props }: StackComponentProps) {
  return <Stack {...props}>{children}</Stack>;
}

export default createComponent(StackComponent, {
  props: {
    gap: { type: 'number', defaultValue: 2 },
    direction: {
      type: 'Direction',
      defaultValue: 'row',
    },
    alignItems: {
      type: 'StackAlignment',
      defaultValue: 'center',
    },
  },
});
