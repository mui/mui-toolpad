const rootLayout: TemplateFile = {
  content: `  
  import { AppProvider } from "@toolpad/core/nextjs";
  import DashboardIcon from "@mui/icons-material/Dashboard";
  import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
  import type { Navigation } from "@toolpad/core";
  import theme from '../theme';

  const NAVIGATION: Navigation = [
    {
      kind: 'header',
      title: 'Main items',
    },
    {
      segment: 'page',
      title: 'Page',
      icon: <DashboardIcon />,
    },
  ];
  
  export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {      
    return (
      <html lang="en" data-toolpad-color-scheme="light">
        <body>
          <AppRouterCacheProvider options={{ enableCssLayer: true }}>
            <AppProvider theme={theme} navigation={NAVIGATION}>
              {children}
            </AppProvider>
          </AppRouterCacheProvider>
        </body>
      </html>
    );
  }
  `,
};

export default rootLayout;
