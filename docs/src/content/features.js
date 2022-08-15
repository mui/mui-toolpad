import * as React from 'react';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import CodeIcon from '@mui/icons-material/Code';
import LinkIcon from '@mui/icons-material/Link';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import GppGoodIcon from '@mui/icons-material/GppGood';
import FastForwardIcon from '@mui/icons-material/FastForward';
import EditIcon from '@mui/icons-material/Edit';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Typography from '@mui/material/Typography';
import GradientText from '../components/landing/GradientText';

const features = {
  Headline: (
    <Typography variant="h2" maxWidth={500} marginBottom={3}>
      Build apps <GradientText>fast</GradientText>, visually, and production-ready
    </Typography>
  ),
  cards: [
    {
      icon: <BuildOutlinedIcon fontSize="small" color="primary" />,
      title: 'Build visually',
      wip: false,
      description:
        'Use the drag & drop canvas to build applications fast. Create a beautiful, functional user interface without ever touching the CSS.',
    },
    {
      icon: <CodeIcon fontSize="small" color="primary" />,
      title: 'Extensible with code',
      wip: false,
      description:
        'Build low-code with pro-code extensibility. You can write JavaScript anywhere in Toolpad as soon as you feel limited by the built-in features.',
    },
    {
      icon: <LinkIcon fontSize="small" color="primary" />,
      title: 'Connect any data source',
      wip: true,
      description:
        'Find all the integrations that you need: REST, Google sheets. PostgreSQL, MySQL, GraphQL 🚧, OpenAPI 🚧, and a plugin system to add new ones.',
    },
    {
      icon: <ViewModuleIcon fontSize="small" color="primary" />,
      title: 'MUI component library',
      wip: false,
      description:
        'Access the full suite of pre-built MUI components, including both MUI Core and MUI X—or bring your own custom components to your Toolpad app.',
    },
    {
      icon: <ThumbUpOutlinedIcon fontSize="small" color="primary" />,
      title: 'Collaboration',
      wip: true,
      description:
        'Toolpad enables your team to communicate and collaborate in one seamless building experience—no more shuffling between platforms.',
    },
    {
      icon: <GppGoodIcon fontSize="small" color="primary" />,
      title: 'Self-host for security',
      wip: false,
      description:
        'Host Toolpad on your own infrastructure to keep full control over where your data goes.',
    },
    {
      icon: <FastForwardIcon fontSize="small" color="primary" />,
      title: 'Instant deployment with version control ',
      wip: false,
      description:
        'App deployment in Toolpad is instant and versioning comes by default. Roll back to any older version with ease.',
    },
    {
      icon: <EditIcon fontSize="small" color="primary" />,
      title: 'Git sync',
      wip: true,
      description:
        'Git allows you to push, pull and manage your code. Sync your Toolpad app to work on multiple branches and submit PRs. Toolpad will support GitHub and other providers.',
    },
    {
      icon: <AutoAwesomeIcon fontSize="small" color="primary" />,
      title: 'Custom theming',
      wip: true,
      description:
        "Switch to CSS Flow mode anytime you need to manage the finer details. Take full control of your app's theme, import styles, or define them locally.",
    },
  ],
};

export default features;
