import * as React from 'react';
import { SxProps } from '@mui/material/styles';
import Container from '@mui/material/Container';

export default function HeroContainer({
  children,
  sx,
}: {
  children: React.ReactNode;
  sx: SxProps;
}) {
  return (
    <Container
      sx={{
        minHeight: '600px',
        transition: '0.3s',
        py: { xs: 4, sm: 8 },
        mx: 2,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        ...sx,
      }}
    >
      {children}
    </Container>
  );
}
