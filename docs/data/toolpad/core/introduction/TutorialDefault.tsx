import * as React from 'react';
import { createTheme } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';
import { useDemoRouter } from '@toolpad/core/internals';
import type { Navigation } from '@toolpad/core';

const NAVIGATION: Navigation = [
  {
    segment: 'page',
    title: 'Page',
    icon: <DashboardIcon />,
  },
];

const demoTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'data-toolpad-color-scheme',
  },
  colorSchemes: { light: true, dark: true },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 600,
      lg: 1200,
      xl: 1536,
    },
  },
});

function DemoPageContent({ pathname }: { pathname: string }) {
  switch (pathname) {
    case '/page':
      return <PageContainer>Hello world!</PageContainer>;
    default:
      return null;
  }
}

interface DemoProps {
  /**
   * Injected by the documentation to work in an iframe.
   * Remove this when copying and pasting into your project.
   */
  window?: () => Window;
}

export default function TutorialDefault(props: DemoProps) {
  const { window } = props;

  // Remove this const when copying and pasting into your project.
  const demoWindow = window !== undefined ? window() : undefined;

  const demoRouter = useDemoRouter('/page');

  return (
    <AppProvider
      navigation={NAVIGATION}
      router={demoRouter}
      theme={demoTheme}
      window={demoWindow}
    >
      <DashboardLayout>
        <DemoPageContent pathname={demoRouter.pathname} />
      </DashboardLayout>
    </AppProvider>
  );
}
