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
        transition: '0.3s',
        py: { xs: 4, sm: 16 },
        display: 'flex',
        justifyContent: 'space-between',
        // gap: 10,
        overflow: 'hidden',
        ...sx,
      }}
    >
      {children}
    </Container>
  );
}
