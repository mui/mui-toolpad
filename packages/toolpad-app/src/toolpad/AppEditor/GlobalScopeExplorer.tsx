import { Typography } from '@mui/material';
import { Box, SxProps } from '@mui/system';
import * as React from 'react';
import ObjectInspector from '../../components/ObjectInspector';

export interface GlobalScopeExplorerProps {
  value?: Record<string, unknown>;
  sx?: SxProps;
}

export default function GlobalScopeExplorer({ value, sx }: GlobalScopeExplorerProps) {
  return (
    <Box sx={{ ...sx, width: 200, display: 'flex', flexDirection: 'column' }}>
      <Typography sx={{ mb: 1 }} variant="subtitle2">
        Scope
      </Typography>
      <Box sx={{ overflow: 'auto', whiteSpace: 'nowrap' }}>
        {Object.entries(value ?? {}).map(([key, content]) => {
          return (
            <Box sx={{ display: 'flex', flexDirection: 'row' }}>
              <ObjectInspector name={key} expandLevel={0} data={content} />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
