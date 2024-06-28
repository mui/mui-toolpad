import path from 'path';
import { PackageJson } from './packageType';

interface GenerateProjectOptions {
  name: string;
}

export default function generateProject(
  options: GenerateProjectOptions,
): Map<string, { content: string }> {
  const rootLayoutContent = `  
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
      slug: '/page',
      title: 'Page',
      icon: <DashboardIcon />,
    },
  ];
  
  export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {      
    return (
      <html lang="en" data-mui-color-scheme="light">
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
    `;

  const dashboardLayoutContent = `
  import { DashboardLayout } from '@toolpad/core/DashboardLayout';

  export default function Layout({
    children,
  }: Readonly<{ children: React.ReactNode }>) {
    return (
      <DashboardLayout>{children}</DashboardLayout>
    );
  }
  `;

  const rootPageContent = `
  import Link from "next/link";
  import { Button, Container, Typography, Box } from "@mui/material";

  export default function Home() {
    return (
      <Container>
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome to{" "}
            <Link href="https://mui.com/toolpad/core/introduction">
              Toolpad Core!
            </Link>
          </Typography>

          <Typography variant="body1">
            Get started by editing <code>(dashboard)/page/page.tsx</code>
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Link href="/page">
              <Button variant="contained" color="primary">
                Go to Page
              </Button>
            </Link>
          </Box>
        </Box>
      </Container>
    );
  }
  `;

  const dashboardPageContent = `
  import { Typography, Container } from "@mui/material";
  export default function Home() {
    return (
      <main>
        <Container sx={{ mx: 4 }}>
          <Typography variant="h6" color="grey.800">
            Dashboard content!
          </Typography>
        </Container>
      </main>
    );
  }
  `;

  const themeContent = `
  "use client";
  import { createTheme } from "@mui/material/styles";

  const defaultTheme = createTheme();

  const theme = createTheme(defaultTheme, {
    palette: {
      background: {
        default: defaultTheme.palette.grey['50'],
      },
    },
    typography: {
      h6: {
        fontWeight: '700',
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            borderWidth: 0,
            borderBottomWidth: 1,
            borderStyle: 'solid',
            borderColor: defaultTheme.palette.divider,
            boxShadow: 'none',
          },
        },
      },
      MuiList: {
        styleOverrides: {
          root: {
            padding: 0,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: defaultTheme.palette.primary.dark,
            padding: 8,
          },
        },
      },
      MuiListSubheader: {
        styleOverrides: {
          root: {
            color: defaultTheme.palette.grey['600'],
            fontSize: 12,
            fontWeight: '700',
            height: 40,
            paddingLeft: 32,
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            paddingTop: 0,
            paddingBottom: 0,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '&.Mui-selected': {
              '& .MuiListItemIcon-root': {
                color: defaultTheme.palette.primary.dark,
              },
              '& .MuiTypography-root': {
                color: defaultTheme.palette.primary.dark,
              },
              '& .MuiSvgIcon-root': {
                color: defaultTheme.palette.primary.dark,
              },
              '& .MuiTouchRipple-child': {
                backgroundColor: defaultTheme.palette.primary.dark,
              },
            },
            '& .MuiSvgIcon-root': {
              color: defaultTheme.palette.action.active,
            },
          },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          root: {
            '& .MuiTypography-root': {
              fontWeight: '500',
            },
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            minWidth: 34,
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderBottomWidth: 2,
            marginLeft: '16px',
            marginRight: '16px',
          },
        },
      },
    },
  });

  export default theme;
  `;

  const eslintConfigContent = `{    
    "extends": "next/core-web-vitals"        
  }
  `;

  const nextTypesContent = `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
  `;

  const nextConfigContent = `
  /** @type {import('next').NextConfig} */
  const nextConfig = {};
  export default nextConfig;
  `;

  const tsConfigContent = `{
    "compilerOptions": {
      "lib": ["dom", "dom.iterable", "esnext"],
      "allowJs": true,
      "skipLibCheck": true,
      "strict": true,
      "noEmit": true,
      "esModuleInterop": true,
      "module": "esnext",
      "moduleResolution": "bundler",
      "resolveJsonModule": true,
      "isolatedModules": true,
      "jsx": "preserve",
      "incremental": true,
      "plugins": [
        {
          "name": "next"
        }
      ],
      "paths": {
        "@/*": ["./*"]
      }
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules"]
  }
  `;

  const packageJson: PackageJson = {
    name: path.basename(options.name),
    version: '0.1.0',
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
    },
    dependencies: {
      react: '^18',
      'react-dom': '^18',
      next: '^14',
      '@toolpad/core': 'latest',
      '@mui/material': '^5',
      '@mui/material-nextjs': '^5',
      '@mui/icons-material': '^5',
      '@emotion/react': '^11',
      '@emotion/styled': '^11',
      '@emotion/cache': '^11',
    },
    devDependencies: {
      typescript: '^5',
      '@types/node': '^20',
      '@types/react': '^18',
      '@types/react-dom': '^18',
      eslint: '^8',
      'eslint-config-next': '^14',
    },
  };

  const gitignoreTemplate = `
  # Logs
  logs
  *.log
  npm-debug.log*
  yarn-debug.log*
  yarn-error.log*
  lerna-debug.log*
  .pnpm-debug.log*
  
  # Diagnostic reports (https://nodejs.org/api/report.html)
  report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json
  
  # Runtime data
  pids
  *.pid
  *.seed
  *.pid.lock
  
  # Directory for instrumented libs generated by jscoverage/JSCover
  lib-cov
  
  # Coverage directory used by tools like istanbul
  coverage
  *.lcov
  
  # nyc test coverage
  .nyc_output
  
  # Grunt intermediate storage (https://gruntjs.com/creating-plugins#storing-task-files)
  .grunt
  
  # Bower dependency directory (https://bower.io/)
  bower_components
  
  # node-waf configuration
  .lock-wscript
  
  # Compiled binary addons (https://nodejs.org/api/addons.html)
  build/Release
  
  # Dependency directories
  node_modules/
  jspm_packages/
  
  # Snowpack dependency directory (https://snowpack.dev/)
  web_modules/
  
  # TypeScript cache
  *.tsbuildinfo
  
  # Optional npm cache directory
  .npm
  
  # Optional eslint cache
  .eslintcache
  
  # Optional stylelint cache
  .stylelintcache
  
  # Microbundle cache
  .rpt2_cache/
  .rts2_cache_cjs/
  .rts2_cache_es/
  .rts2_cache_umd/
  
  # Optional REPL history
  .node_repl_history
  
  # Output of 'npm pack'
  *.tgz
  
  # Yarn Integrity file
  .yarn-integrity
  
  # dotenv environment variable files
  .env
  .env.development.local
  .env.test.local
  .env.production.local
  .env.local
  
  # parcel-bundler cache (https://parceljs.org/)
  .cache
  .parcel-cache
  
  # Next.js build output
  .next
  out
  
  # Nuxt.js build / generate output
  .nuxt
  dist
  
  # Gatsby files
  .cache/
  # Comment in the public line in if your project uses Gatsby and not Next.js
  # https://nextjs.org/blog/next-9-1#public-directory-support
  # public
  
  # vuepress build output
  .vuepress/dist
  
  # vuepress v2.x temp and cache directory
  .temp
  .cache
  
  # Docusaurus cache and generated files
  .docusaurus
  
  # Serverless directories
  .serverless/
  
  # FuseBox cache
  .fusebox/
  
  # DynamoDB Local files
  .dynamodb/
  
  # TernJS port file
  .tern-port
  
  # Stores VSCode versions used for testing VSCode extensions
  .vscode-test
  
  # yarn v2
  .yarn/cache
  .yarn/unplugged
  .yarn/build-state.yml
  .yarn/install-state.gz
  `;

  // Define all files to be created up front
  return new Map([
    ['app/api/auth/[...nextAuth]/route.ts', { content: '' }],
    ['app/auth/[...path]/page.tsx', { content: '' }],
    ['app/(dashboard)/page/page.tsx', { content: dashboardPageContent }],
    ['app/(dashboard)/layout.tsx', { content: dashboardLayoutContent }],
    ['app/layout.tsx', { content: rootLayoutContent }],
    ['app/page.tsx', { content: rootPageContent }],
    ['theme.ts', { content: themeContent }],
    ['next-env.d.ts', { content: nextTypesContent }],
    ['next.config.mjs', { content: nextConfigContent }],
    ['.eslintrc.json', { content: eslintConfigContent }],
    ['tsconfig.json', { content: tsConfigContent }],
    ['package.json', { content: JSON.stringify(packageJson, null, 2) }],
    ['.gitignore', { content: gitignoreTemplate }],
    // ...
  ]);
}
