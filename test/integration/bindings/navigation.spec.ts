import * as path from 'path';
import { ToolpadRuntime } from '../../models/ToolpadRuntime';
import { expect, test } from '../../playwright/localTest';

test.use({
  localAppConfig: {
    template: path.resolve(__dirname, './fixture-navigation'),
    cmd: 'dev',
  },
});

test('navigation action', async ({ page }) => {
  const runtimeModel = new ToolpadRuntime(page);
  await runtimeModel.gotoPage('page1');

  await expect(page.getByText('welcome to page 2')).not.toBeVisible();

  const getPageUrlSearch = (): string => new URL(page.url()).search;

  expect(getPageUrlSearch()).toBe('');

  const testButton = page.getByRole('button', { name: 'test' });
  await testButton.click();

  await expect(page.getByText('welcome to page 2')).toBeVisible();

  expect(getPageUrlSearch()).toBe('?abc=zyx&def=test');
});
