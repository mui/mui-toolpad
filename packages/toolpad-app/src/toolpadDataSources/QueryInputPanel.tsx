import * as React from 'react';
import { Box, Toolbar } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

export interface QueryInputPanelProps {
  children: React.ReactNode;
  onRunPreview: () => void;
}

export default function QueryInputPanel({ children, onRunPreview }: QueryInputPanelProps) {
  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Toolbar>
        <LoadingButton startIcon={<PlayArrowIcon />} onClick={onRunPreview}>
          Preview
        </LoadingButton>
      </Toolbar>
      {children}
    </Box>
  );
}
