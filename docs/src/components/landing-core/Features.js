import * as React from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import GradientText from 'docs/src/components/typography/GradientText';
import Highlighter from 'docs/src/components/action/Highlighter';
import Card from '@mui/material/Card';
import { alpha } from '@mui/material/styles';
import Section from 'docs/src/layouts/Section';
import SectionHeadline from 'docs/src/components/typography/SectionHeadline';
import Item, { Group } from 'docs/src/components/action/Item';
import AutoAwesomeMosaic from '@mui/icons-material/AutoAwesomeMosaic';
import AutoAwesomeMotion from '@mui/icons-material/AutoAwesomeMotion';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LockOpenIcon from '@mui/icons-material/LockOpen';

export default function Features() {
  const [index, setIndex] = React.useState(0);
  function getSelectedProps(i) {
    return {
      selected: index === i,
      sx: { '& svg': { opacity: index === i ? 1 : 0.5 } },
    };
  }
  return (
    <Section>
      <Grid container alignItems="center">
        <Grid item md={6} sx={{ padding: 2 }}>
          <SectionHeadline
            overline="Features"
            title={
              <Typography variant="h2">
                {' '}
                Fullstack <GradientText> higher UI primitives </GradientText> and components
              </Typography>
            }
            description="Quickly build admin dashboard interfaces with a set of components that are designed to work together."
          />
          <Group sx={{ m: -2, p: 2 }}>
            <Highlighter disableBorder {...getSelectedProps(1)} onClick={() => setIndex(0)}>
              <Item
                icon={<AutoAwesomeMosaic />}
                title="Navigation and layout"
                description="The Layout component provides a standard structure for functional apps, including customizable nav bar, header bar and more."
              />
            </Highlighter>
            <Highlighter disableBorder {...getSelectedProps(3)} onClick={() => setIndex(1)}>
              <Item
                icon={<LockOpenIcon />}
                title="Authentication"
                description="Toolpad simplifies setting authentication through authProvider object, hooks and the Login pages. Check out the supported Identity providers."
              />
            </Highlighter>
            <Highlighter disableBorder {...getSelectedProps(4)} onClick={() => setIndex(2)}>
              <Item
                icon={<NotificationsIcon />}
                title="Dialogs and snackbars"
                description="Native dialogs and snackbar components offer an easy way to setup interactivity in the dashbaord application."
              />
            </Highlighter>
            <Highlighter disableBorder {...getSelectedProps(2)} onClick={() => setIndex(3)}>
              <Item
                icon={<AutoAwesomeMotion />}
                title="Page content"
                description="Various page related assets like breadcrumbs, tabs, title, toolbar and a responsive container can be configured with the Page content component."
              />
            </Highlighter>
          </Group>
        </Grid>
        <Grid item xs={12} md={6} sx={{ padding: 2 }}>
          <Card
            variant="outlined"
            // {...props}
            sx={[
              (theme) => ({
                p: 2,
                minHeight: 800, // To be removed, once we add the demo
                display: 'flex',
                flexWrap: 'wrap',
                zIndex: 1,
                boxShadow: `0px 4px 8px ${alpha(theme.palette.grey[200], 0.6)}`,
                ...theme.applyDarkStyles({
                  bgcolor: 'primaryDark.900',
                  boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.2)',
                }),
              }),
              // ...(Array.isArray(sx) ? sx : [sx]),
            ]}
          />
        </Grid>
      </Grid>
    </Section>
  );
}
