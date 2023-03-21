import * as path from 'path';
import { ToolpadRuntime } from '../../models/ToolpadRuntime';
import { expect, test } from '../../playwright/localTest';
import { APP_ID_LOCAL_MARKER } from '../../../packages/toolpad-app/src/constants';

test.skip(!process.env.LOCAL_MODE_TESTS, 'These are local mode tests');

test.use({
  ignoreConsoleErrors: [
    // Chrome
    /Unexpected token '\)'/,
    // Firefox
    /expected property name, got '\)'/,
  ],
});

test.use({
  localAppConfig: {
    template: path.resolve(__dirname, './fixture'),
    cmd: 'dev',
  },
});

test('bindings', async ({ page }) => {
  const runtimeModel = new ToolpadRuntime(page);
  await runtimeModel.gotoPage(APP_ID_LOCAL_MARKER, 'bindings');

  const test1 = page.getByText('-test1-');
  await expect(test1).toBeVisible();
  const color = await test1.evaluate((elm) =>
    window.getComputedStyle(elm).getPropertyValue('color'),
  );
  expect(color).toBe('rgb(25, 118, 210)');
  await expect(page.getByText('-test2-')).toBeVisible();
});
