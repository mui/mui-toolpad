import * as React from 'react';
import { Box } from '@mui/material';
import { createComponent } from '@mui/toolpad-core';

export interface PageRowProps {
  layoutColumnSizes: number[];
  gap?: number;
  children?: React.ReactNode;
}

function PageRow({ layoutColumnSizes = [], gap, children }: PageRowProps) {
  const gridAutoColumns = layoutColumnSizes.reduce(
    (acc, layoutColumnSize) => `${acc}${`${acc && ' '}minmax(0, ${layoutColumnSize || 1}fr)`}`,
    '',
  );

  return (
    <Box
      sx={{
        gap,
        display: 'grid',
        gridAutoFlow: 'column',
        gridAutoColumns,
      }}
    >
      {children}
    </Box>
  );
}

export default createComponent(PageRow, {
  argTypes: {
    gap: {
      typeDef: { type: 'number' },
      defaultValue: 1,
    },
    children: {
      typeDef: { type: 'element' },
      control: { type: 'slots' },
    },
  },
});
