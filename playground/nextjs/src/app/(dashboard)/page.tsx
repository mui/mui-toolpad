import * as React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { auth } from '../../auth';

export default async function HomePage() {
  const session = await auth();

  return (
    <Box
      sx={{
        my: 4,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <Typography sx={{ mb: 2 }}>Welcome to Toolpad, {session?.user?.name || 'User'}!</Typography>
    </Box>
  );
}
