import * as React from 'react';
import { PropValueType } from '@mui/toolpad-core';
import MarkdownTooltip from './MarkdownTooltip';

export interface PropertyControlProps {
  propType: PropValueType;
  children: React.ReactElement;
}

export default function PropertyControl({ propType, children }: PropertyControlProps) {
  return (
    <MarkdownTooltip placement="left" title={propType.helperText ?? ''}>
      {children}
    </MarkdownTooltip>
  );
}
