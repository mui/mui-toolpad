import * as React from 'react';
import { alpha } from '@mui/material/styles';
// import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
// import List from '@mui/material/List';
// import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
// import CompareIcon from '@mui/icons-material/Compare';
// import StyleRoundedIcon from '@mui/icons-material/StyleRounded';
// import { GlowingIconContainer } from '@mui/docs/InfoCard';
import GetStartedButtons from 'docs/src/components/home/GetStartedButtons';
import Section from 'docs/src/layouts/Section';
import SectionHeadline from 'docs/src/components/typography/SectionHeadline';
import GradientText from 'docs/src/components/typography/GradientText';
// import { Link } from '@mui/docs/Link';
import ROUTES from 'docs/src/route';

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
        <Grid item xs={5}>
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
            primaryUrl={ROUTES.materialDocs}
            primaryLabel="Explore Studio"
            altInstallation="npx create-toolpad-app@latest"
          />
        </Grid>
        <Grid xs={7}>
          <Card
            sx={(theme) => ({
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              px: 2,
              pt: 2,
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

/*
: (
        <Grid container spacing={{ xs: 6, sm: 10 }} alignItems="center">
          <Grid xs={12} sm={6}>
            <SectionHeadline
              overline="Community"
              title={
                <Typography variant="h2">
                  Join our <GradientText>global community</GradientText>
                </Typography>
              }
              description={
                <React.Fragment>
                  Material UI wouldn&apos;t be possible without our global community of
                  contributors. Join us today to get help when you need it, and lend a hand when you
                  can.
                </React.Fragment>
              }
            />
            <GetStartedButtons
              primaryUrl={ROUTES.materialDocs}
              secondaryLabel="View templates"
              secondaryUrl={ROUTES.freeTemplates}
              altInstallation="npm install @mui/material @emotion/react @emotion/styled"
            />
          </Grid>
          <Grid xs={12} sm={6}>
            <List sx={{ '& > li': { alignItems: 'flex-start' } }}>
              <ListItem sx={{ p: 0, mb: 4, gap: 2.5 }}>
                <GlowingIconContainer icon={<CompareIcon color="primary" />} />
                <div>
                  <Typography color="text.primary" fontWeight="semiBold" gutterBottom>
                    Material UI vs. Base UI
                  </Typography>
                  <Typography>
                    Material UI implements Google&apos;s Material Design whereas Base UI features
                    many of the same components, but without the Material Design implementation.
                  </Typography>
                </div>
              </ListItem>
              <ListItem sx={{ p: 0, gap: 2.5 }}>
                <GlowingIconContainer icon={<StyleRoundedIcon color="primary" />} />
                <div>
                  <Typography color="text.primary" fontWeight="semiBold" gutterBottom>
                    Does it support Material Design 3?
                  </Typography>
                  <Typography>
                    The adoption of Material Design 3 is tentatively planned for Material UI v7. See
                    the{' '}
                    <Link href="https://mui.com/versions/#release-schedule">
                      the release schedule
                    </Link>{' '}
                    and follow{' '}
                    <Link href="https://github.com/mui/material-ui/issues/29345">
                      this GitHub issue
                    </Link>{' '}
                    for future updates.
                  </Typography>
                </div>
              </ListItem>
            </List>
          </Grid>
        </Grid>
      )
*/
