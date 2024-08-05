import theme from './templates/theme';
import eslintConfig from './templates/eslintConfig';
import nextConfig from './templates/nextConfig';
import nextTypes from './templates/nextTypes';
import tsConfig from './templates/tsConfig';
import packageJson from './templates/packageJson';
import readme from './templates/readme';
import gitignore from './templates/gitignore';

import rootLayout from './templates/rootLayout';
import rootPage from './templates/rootPage';
import NavigateButton from './templates/navigateButton';
import dashboardLayout from './templates/dashboardLayout';
import dashboardPage from './templates/dashboardPage';

import indexPage from './templates/nextjs-pages/indexPage';
import ordersPage from './templates/nextjs-pages/ordersPage';
import app from './templates/nextjs-pages/app';
import document from './templates/nextjs-pages/document';

import providerImport from './templates/auth/providerImport';
import credentialsProvider from './templates/auth/credentialsProvider';
import oAuthProvider from './templates/auth/oAuthProvider';
import providerSetup from './templates/auth/providerSetup';
import callbacks from './templates/auth/callbacks';
import providerMap from './templates/auth/providerMap';
import authImport from './templates/auth/import';
import authEnv from './templates/auth/env';
import authProviderEnv from './templates/auth/providerEnv';
import middleware from './templates/auth/middleware';

import routeHandler from './templates/auth/nextjs-app/route';
import signInPage from './templates/auth/nextjs-app/signInPage';
import packageJsonAuth from './templates/auth/packageJson';
import dashboardPageAuthApp from './templates/auth/nextjs-app/dashboardPage';
import rootLayoutAuthApp from './templates/auth/nextjs-app/rootLayout';

import appAuthPages from './templates/auth/nextjs-pages/app';
import signInPagePagesRouter from './templates/auth/nextjs-pages/signIn';

import { SupportedAuthProvider, SupportedRouter } from './types';

export interface GenerateProjectOptions {
  name: string;
  absolutePath: string;
  router: SupportedRouter;
  auth: boolean;
  authProviders: SupportedAuthProvider[];
}

function generateAuthContent(authProviders: SupportedAuthProvider[]) {
  // Add additional specific to authentication
  let providerImports = '';
  let providerContent = '';
  let envProviderContent = '';

  authProviders.forEach((provider) => {
    providerImports += providerImport(provider).content;
    if (provider === 'Credentials') {
      providerContent += credentialsProvider.content;
      envProviderContent += '';
    } else {
      providerContent += oAuthProvider(provider).content;
      envProviderContent += authProviderEnv(provider).content;
    }
  });

  const authCallbacksContent = authProviders.includes('Credentials') ? callbacks : { content: '' };

  const authContent = `${authImport.content}${providerImports}${providerSetup.content}${providerContent}${providerMap.content}${authCallbacksContent.content}});        
  `;
  const envContent = `${authEnv.content}${envProviderContent}`;

  return {
    authContent,
    envContent,
    authCallbacksContent,
  };
}

export default function generateProject(
  options: GenerateProjectOptions,
): Map<string, { content: string }> {
  // Add app name to package.json
  const packageJsonContent = packageJson(options.name);

  // Default files, common to all apps
  const files = new Map<string, { content: string }>([
    ['theme.ts', { content: theme.content }],
    ['next-env.d.ts', { content: nextTypes.content }],
    ['next.config.mjs', { content: nextConfig.content }],
    ['.eslintrc.json', { content: eslintConfig.content }],
    ['tsconfig.json', { content: tsConfig.content }],
    ['package.json', { content: JSON.stringify(packageJsonContent, null, 2) }],
    ['README.md', { content: readme.content }],
    ['.gitignore', { content: gitignore.content }],
  ]);

  switch (options.router) {
    case 'nextjs-pages': {
      const nextJsPagesRouterStarter = new Map([
        ['pages/index.tsx', { content: indexPage.content }],
        ['pages/orders/index.tsx', { content: ordersPage.content }],
        ['pages/_app.tsx', { content: app.content }],
        ['pages/_document.tsx', { content: document.content }],
      ]);
      if (options.auth) {
        const { authContent, envContent } = generateAuthContent(options.authProviders);
        const packageJsonAuthContent = packageJsonAuth(options.name);
        const authFiles = new Map([
          ['auth.ts', { content: authContent }],
          ['.env.local', { content: envContent }],
          ['middleware.ts', { content: middleware.content }],
          ['app/api/auth/[...nextAuth]/route.ts', { content: routeHandler.content }],
          ['pages/auth/signin.tsx', { content: signInPagePagesRouter.content }],
          ['package.json', { content: JSON.stringify(packageJsonAuthContent, null, 2) }],
          ['pages/_app.tsx', { content: appAuthPages.content }],
        ]);
        return new Map([...files, ...nextJsPagesRouterStarter, ...authFiles]);
      }
      return new Map([...files, ...nextJsPagesRouterStarter]);
    }
    case 'nextjs-app':
    default: {
      const nextJsAppRouterStarter = new Map([
        ['app/(dashboard)/layout.tsx', { content: dashboardLayout.content }],
        ['app/layout.tsx', { content: rootLayout.content }],
        ['app/page.tsx', { content: rootPage.content }],
        ['app/NavigateButton.tsx', { content: NavigateButton.content }],
        ['app/(dashboard)/page/page.tsx', { content: dashboardPage.content }],
      ]);
      if (options.auth) {
        const { authContent, envContent } = generateAuthContent(options.authProviders);
        const packageJsonAuthContent = packageJsonAuth(options.name);

        const authFiles = new Map([
          ['auth.ts', { content: authContent }],
          ['.env.local', { content: envContent }],
          ['middleware.ts', { content: middleware.content }],
          ['app/api/auth/[...nextAuth]/route.ts', { content: routeHandler.content }],
          ['app/auth/signin/page.tsx', { content: signInPage.content }],
          ['package.json', { content: JSON.stringify(packageJsonAuthContent, null, 2) }],
          ['app/(dashboard)/page.tsx', { content: dashboardPageAuthApp.content }],
          ['app/layout.tsx', { content: rootLayoutAuthApp.content }],
        ]);

        nextJsAppRouterStarter.delete('app/page.tsx');
        nextJsAppRouterStarter.delete('app/(dashboard)/page/page.tsx');

        return new Map([...files, ...nextJsAppRouterStarter, ...authFiles]);
      }
      return new Map([...files, ...nextJsAppRouterStarter]);
    }
  }
}
