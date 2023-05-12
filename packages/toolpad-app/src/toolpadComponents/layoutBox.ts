import { BoxProps } from '@mui/material';
import { ArgTypeDefinition } from '@mui/toolpad-core';

export const LAYOUT_DIRECTION_HORIZONTAL = 'horizontal';
export const LAYOUT_DIRECTION_VERTICAL = 'vertical';
export const LAYOUT_DIRECTION_BOTH = 'both';

export const layoutBoxArgTypes: {
  horizontalAlign: ArgTypeDefinition<BoxProps, BoxProps['justifyContent']>;
  verticalAlign: ArgTypeDefinition<BoxProps, BoxProps['alignItems']>;
} = {
  horizontalAlign: {
    type: 'string',
    enum: ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'],
    default: 'start',
    label: 'Horizontal alignment',
    control: { type: 'HorizontalAlign' },
  },
  verticalAlign: {
    type: 'string',
    enum: ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'],
    default: 'center',
    label: 'Vertical alignment',
    control: { type: 'VerticalAlign' },
  },
};
