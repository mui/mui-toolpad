import * as React from 'react';
import { styled, SxProps, Box, Divider, Typography } from '@mui/material';
import HierarchyExplorer from './HierarchyExplorer';
import config from '../../config';

const PagePanelRoot = styled('div')({
  display: 'flex',
  flexDirection: 'column',
});

export interface ComponentPanelProps {
  appId: string;
  className?: string;
  sx?: SxProps;
}

export default function PagePanel({ appId, className, sx }: ComponentPanelProps) {
  return (
    <PagePanelRoot className={className} sx={sx}>
      <Box
        sx={{
          pl: 2,
          pr: 1,
          py: 1,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography noWrap>{config.projectDir?.split(/[/\\]/).pop()}</Typography>
      </Box>
      <Divider />
      <HierarchyExplorer appId={appId} />
    </PagePanelRoot>
  );
}
