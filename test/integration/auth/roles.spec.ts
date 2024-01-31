import * as path from 'path';
import * as url from 'url';
import { test, expect } from '../../playwright/localTest';
import { tryCredentialsSignIn } from './shared';

const currentDirectory = url.fileURLToPath(new URL('.', import.meta.url));

test.use({
  ignoreConsoleErrors: [
    /Failed to load resource: the server responded with a status of 401 \(Unauthorized\)/,
  ],
});

test.use({
  projectConfig: {
    template: path.resolve(currentDirectory, './fixture-roles'),
  },
  localAppConfig: {
    cmd: 'start',
    env: {
      TOOLPAD_AUTH_SECRET: 'donttellanyone',
      NODE_ENV: 'test',
    },
  },
});

test.only('Must have required roles to access pages', async ({ page, request }) => {
  await page.goto('/prod/signin');

  // Sign in without admin role
  await tryCredentialsSignIn(page, 'test', 'test');

  await expect(page.getByText('Admin Page')).toBeHidden();

  // Access is blocked to API route
  const res = await request.post('/prod/api/data/adminpage/hello');
  expect(res.status()).toBe(401);

  // Sign in with admin role
  await page.getByText('Miss Test').click();
  await page.getByText('Sign out').click();
  await tryCredentialsSignIn(page, 'admin', 'admin');

  await expect(page.getByText('Admin Page')).toBeVisible();
  await expect(page.getByText('message: hello world')).toBeVisible();
});