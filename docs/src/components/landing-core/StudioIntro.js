import * as React from 'react';
import { alpha } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import GetStartedButtons from 'docs/src/components/home/GetStartedButtons';
import Section from 'docs/src/layouts/Section';
import SectionHeadline from 'docs/src/components/typography/SectionHeadline';
import GradientText from 'docs/src/components/typography/GradientText';

export default function StudioIntro() {
  return (
    <Section
      cozy
      data-mui-color-scheme="dark"
      sx={{
        color: 'text.secondary',
        background: (theme) =>
          `linear-gradient(180deg, ${(theme.vars || theme).palette.primaryDark[900]} 50%, 
          ${alpha(theme.palette.primary[800], 0.2)} 100%), ${
            (theme.vars || theme).palette.primaryDark[900]
          }`,
      }}
    >
      <Grid container spacing={4} justifyContent="flex-start">
        <Grid item md={5}>
          <SectionHeadline
            overline="Toolpad Studio"
            title={
              <Typography variant="h2">
                Looking for a <GradientText>low-code app builder</GradientText> instead?
              </Typography>
            }
            description={
              <React.Fragment>
                Empower your team with Toolpad Studio: a drag-and-drop, low-code platform to
                effortlessly build UI, connect data, and self-host custom internal tools.
              </React.Fragment>
            }
          />

          <GetStartedButtons
            primaryUrl="https://mui.com/toolpad-studio"
            primaryLabel="Explore Studio"
            altInstallation="npx create-toolpad-app@latest"
          />
        </Grid>
        <Grid item xs={12} md={7}>
          {' '}
          {/* Added 'item' prop */}
          <Card
            sx={(theme) => ({
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              px: 1,
              pt: 1,
              pb: 1,
              gap: 1.5,
              borderRadius: 1,
              backgroundColor: `${alpha(theme.palette.grey[50], 0.4)}`,
              borderColor: 'divider',
              ...theme.applyStyles('dark', {
                backgroundColor: `${alpha(theme.palette.primary.dark, 0.1)}`,
                borderColor: 'divider',
              }),
            })}
            variant="outlined"
          >
            <CardMedia
              component="a"
              image="https://mui.com/static/toolpad/docs/studio/examples/npm-stats.png"
              href="https://mui-toolpad-npm-stats-production.up.railway.app/prod/pages/page"
              target="_blank"
              rel="nofollow"
              sx={(theme) => ({
                height: 0,
                pt: '65%',
                borderRadius: 0.5,
                bgcolor: 'currentColor',
                border: '1px solid',
                borderColor: 'grey.100',
                color: 'grey.100',
                ...theme.applyStyles('dark', {
                  borderColor: 'grey.900',
                  color: 'primaryDark.900',
                }),
              })}
            />
          </Card>
        </Grid>
      </Grid>
    </Section>
  );
}
