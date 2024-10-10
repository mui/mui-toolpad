import * as React from 'react';
import Typography from '@mui/material/Typography';

export default async function HomePage() {
  return (
    <div>
      <Typography variant="h4" component="h1" sx={{ m: 2 }}>
        Public page
      </Typography>
    </div>
  );
}
