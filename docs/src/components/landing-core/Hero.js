import * as React from 'react';
import Typography from '@mui/material/Typography';
import IconImage from 'docs/src/components/icon/IconImage';
import Box from '@mui/material/Box';
import GradientText from 'docs/src/components/typography/GradientText';
// import Chip from '@mui/material/Chip';
// import { alpha } from '@mui/material/styles';
// import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Container } from '@mui/material';
import GetStartedButtons from './GetStartedButtons';
// import GetStartedButtons from 'docs/src/components/home/GetStartedButtons';

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
          <IconImage width={28} height={28} loading="eager" name="product-toolpad" />
          Toolpad
          {/* <Chip
            label="Read the announcement"
            component="a"
            // href={ROUTES.toolpadBetaBlog}
            color="primary"
            size="small"
            variant="outlined"
            clickable
            onDelete={() => {}}
            deleteIcon={<ChevronRightIcon />}
            sx={[
              (theme) => ({
                pb: 0.15,
                ml: 0.8,
                background: alpha(theme.palette.primary[50], 0.5),
                borderColor: (theme.vars || theme).palette.primary[100],
                ...theme.applyDarkStyles({
                  color: (theme.vars || theme).palette.primary[200],
                  borderColor: (theme.vars || theme).palette.primary[700],
                  background: alpha(theme.palette.primary[800], 0.3),
                }),
              }),
            ]}
          />
        */}
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
            From the creators of MUI, Toolpad offers the components needed for your next admin panel
            and internal tools project. Bootstrap from scratch in our CLI with well chosen defaults,
            or drop Toolpad into your existing Next.js or Vite* project.
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
            primaryUrl="https://mui.com/toolpad/core/introduction/"
            installation={'npx create-toolpad-app@latest --core'}
            sx={{ width: '100%' }}
          />
        </Box>
      </Box>
    </Container>
  );
}
