const indexPage: TemplateFile = {
  content: `import Link from 'next/link';
import * as React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function HomePage() {
  return (
    <Box
      sx={{
        my: 4,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
        <Typography variant="h4" component="h1">
            Welcome to <Link href="https://mui.com/toolpad/core/introduction">Toolpad Core!</Link>
        </Typography>
    </Box>
  );
}
`,
};

export default indexPage;
