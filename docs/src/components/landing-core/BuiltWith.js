import * as React from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import GradientText from 'docs/src/components/typography/GradientText';
import Section from 'docs/src/layouts/Section';
import SectionHeadline from 'docs/src/components/typography/SectionHeadline';
import InfoCard from 'docs/src/components/action/InfoCard';

const content = [
  {
    icon: <img src="/static/toolpad/marketing/react-svgrepo-com.svg" width={24} alt="React" />,
    title: 'React',
    description:
      'Toolpad is a code-centric approach to admin apps. Entire app is accessible and customizable through React code.',
  },
  {
    icon: (
      <img src="/static/toolpad/marketing/typescript-svgrepo-com.svg" width={24} alt="Typesript" />
    ),
    title: 'TypeScript',
    description:
      'TypeScript enhances code maintainability and developer productivity, making it a preferred choice for Toolpad apps.',
  },
  {
    icon: (
      <img src="/static/toolpad/marketing/nextjs-icon-svgrepo-com.svg" width={24} alt="Next.js" />
    ),
    title: 'Next.js',
    description:
      'Next.js sets the industry standard for modern React applications. Building over ﻿it, is a leverage that makes Toolpad efficient.',
  },
  {
    icon: <img src="https://mui.com/static/logo.png" width={30} alt="MUI" />,
    title: 'MUI',
    description:
      'The tight integration with MUI ensures you get all the latest features from our list of MaterialUI components.',
  },
];

export default function BuiltWith() {
  return (
    <Section>
      <SectionHeadline
        overline="Why build with Toolpad?"
        title={
          <Typography variant="h2" sx={{ mt: 1, mb: { xs: 2, sm: 4 } }}>
            Leverage <GradientText>the best</GradientText> <br />
            in the ecosystem...
          </Typography>
        }
      />
      <Grid container>
        {content.map(({ icon, title, description }) => (
          <Grid item key={title} xs={12} sm={6} lg={3} sx={{ padding: 1 }}>
            <InfoCard title={title} icon={icon} description={description} />
          </Grid>
        ))}
      </Grid>
    </Section>
  );
}
