import { Box, Typography } from '@mui/material';
import * as React from 'react';
import QueryEditor from './QueryEditor';
import UrlQueryEditor from './UrlQueryEditor';

export default function NonRenderedPageContent() {
  return (
    <Box sx={{ m: 3 }}>
      <Typography variant="subtitle1">Page State:</Typography>
      <UrlQueryEditor />
      <QueryEditor />
    </Box>
  );
}
