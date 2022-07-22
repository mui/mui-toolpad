import * as React from 'react';
import {
  Skeleton,
  Typography as MuiTypography,
  TypographyProps as MuiTypographyProps,
  Box,
  BoxProps,
} from '@mui/material';
import { createComponent } from '@mui/toolpad-core';

interface TypographyProps extends Omit<MuiTypographyProps, 'children'> {
  value: string;
  loading?: boolean;
  alignItems?: BoxProps['alignItems'];
  justifyContent?: BoxProps['justifyContent'];
}

function Typography({ value, loading, alignItems, justifyContent, sx, ...props }: TypographyProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems,
        justifyContent,
      }}
    >
      <MuiTypography
        sx={{
          minWidth: loading || !value ? 150 : undefined,
          // This will give it height, even when empty.
          // REMARK: Does it make sense to put it in core?
          [`&:empty::before`]: { content: '""', display: 'inline-block' },
          ...sx,
        }}
        {...props}
      >
        {loading ? <Skeleton /> : value}
      </MuiTypography>
    </Box>
  );
}

export default createComponent(Typography, {
  loadingPropSource: ['value'],
  loadingProp: 'loading',
  argTypes: {
    value: {
      typeDef: { type: 'string' },
      defaultValue: 'Text',
    },
    variant: {
      typeDef: {
        type: 'string',
        enum: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle1', 'subtitle2', 'body1', 'body2'],
      },
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
    loading: {
      typeDef: { type: 'boolean' },
      defaultValue: false,
    },
    sx: {
      typeDef: { type: 'object' },
    },
  },
});
