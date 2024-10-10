import * as React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '../../../auth';

export default async function OrdersPage() {
  const session = await auth();
  const currentUrl = headers().get('referer') || 'http://localhost:3000';

  if (!session) {
    // Get the current URL to redirect to signIn with `callbackUrl`
    const redirectUrl = new URL('/auth/signin', currentUrl);
    redirectUrl.searchParams.set('callbackUrl', currentUrl);

    redirect(redirectUrl.toString());
  }
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
      <Typography sx={{ mb: 2 }}>Welcome to the Toolpad orders!</Typography>
    </Box>
  );
}
