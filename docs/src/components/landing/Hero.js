import * as React from 'react';
import Typography from '@mui/material/Typography';
import SvgToolpadLogo from 'docs/src/icons/SvgToolpadCoreLogo';
import Box from '@mui/material/Box';
import GradientText from 'docs/src/components/typography/GradientText';
import Container from '@mui/material/Container';
import GetStartedButtons from './GetStartedButtons';

export default function Hero() {
  return (
    <Container
      sx={{
        py: { xs: 4, sm: 8 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          padding: 4,
        }}
      >
        <Typography
          fontWeight="bold"
          variant="body2"
          sx={[
            (theme) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: (theme.vars || theme).palette.primary[600],
              ...theme.applyDarkStyles({
                color: (theme.vars || theme).palette.primary[400],
              }),
            }),
          ]}
        >
          <SvgToolpadLogo width={14} height={14} style={{ marginRight: 8 }} />
          Toolpad Core
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center', // Add this line
          }}
        >
          <Typography variant="h1" sx={{ my: 2 }}>
            Open-source dashboard
            <br />
            <GradientText> framework </GradientText> for React
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ maxWidth: 620, mb: 3, textWrap: 'balance', textAlign: 'center' }}
          >
            From the creators of MUI, Toolpad Core offers the components needed for your next admin
            panel and internal tools project. Bootstrap from scratch in our CLI with well chosen
            defaults, or drop Toolpad Core into your existing Next.js or Vite* project.
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: { xs: 'center', md: 'flex-start' },
          }}
        >
          <GetStartedButtons
            primaryLabel={'Get started'}
            primaryUrl="/toolpad/core/introduction/"
            installation={'npx create-toolpad-app@latest'}
            sx={{ width: '100%' }}
          />
        </Box>
      </Box>
    </Container>
  );
}
