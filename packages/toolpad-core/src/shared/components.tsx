import * as React from 'react';
import { CircularProgress, Typography, styled } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';

const OverlayRoot = styled('div')(({ theme }) => ({
  position: 'absolute',
  inset: '0 0 0 0',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
}));

export interface ErrorOverlayProps {
  error?: unknown;
}

export function ErrorOverlay({ error }: ErrorOverlayProps) {
  return (
    <OverlayRoot>
      <Typography
        variant="h6"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: 1,
          alignItems: 'center',
        }}
      >
        <ErrorIcon color="error" /> Error
      </Typography>
      <Typography textAlign="center">{(error as any)?.message ?? 'Unknown error'}</Typography>
    </OverlayRoot>
  );
}

export function LoadingOverlay() {
  return (
    <OverlayRoot>
      <CircularProgress />
    </OverlayRoot>
  );
}
