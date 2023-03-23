import * as path from 'path';
import { ToolpadEditor } from '../../models/ToolpadEditor';
import { ToolpadRuntime } from '../../models/ToolpadRuntime';
import { FrameLocator, Page, test, expect } from '../../playwright/localTest';
import clickCenter from '../../utils/clickCenter';

test.describe('components basics', () => {
  async function waitForComponents(page: Page, frame: Page | FrameLocator = page) {
    const button = frame.locator('text="foo button"');
    await button.waitFor({ state: 'visible' });

    const image = frame.locator('img[alt="foo image"]');
    await image.waitFor({ state: 'attached' });

    const datagrid = frame.locator('text="foo datagrid column"');
    await datagrid.waitFor({ state: 'visible' });

    const customComponent = frame.locator('text="custom component 1"');
    await customComponent.waitFor({ state: 'visible' });

    const textField = frame.locator('label:has-text("foo textfield")');
    await textField.waitFor({ state: 'visible' });

    const text = frame.locator('text="foo typography"');
    await text.waitFor({ state: 'visible' });

    const select = frame.locator('label:has-text("foo select")');
    await select.waitFor({ state: 'visible' });

    const list = frame.locator('text="List Button 3"');
    await list.waitFor({ state: 'visible' });
  }

  test.use({
    localAppConfig: {
      template: path.resolve(__dirname, './fixture-basic'),
      cmd: 'dev',
    },
  });

  test('rendering components in the app runtime', async ({ page }) => {
    const runtimeModel = new ToolpadRuntime(page);
    await runtimeModel.gotoPage('components');

    await waitForComponents(page);
  });

  test('rendering components in the app editor', async ({ page }) => {
    const editorModel = new ToolpadEditor(page);
    editorModel.goto();

    await waitForComponents(page, editorModel.appCanvas);
  });

  test('select component behavior', async ({ page }) => {
    const runtimeModel = new ToolpadRuntime(page);
    await runtimeModel.gotoPage('select');

    const optionsSelect = page.getByRole('button', { name: /select with options/ });
    await optionsSelect.scrollIntoViewIfNeeded();
    await clickCenter(page, optionsSelect);
    await expect(page.getByRole('option', { name: 'one' })).toBeVisible();
    await expect(page.getByRole('option', { name: '2' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'three' })).toBeVisible();
    await expect(page.getByRole('option', { name: '4' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'undefined' })).toBeVisible();
  });
});

test.describe('list component', () => {
  test.use({
    localAppConfig: {
      template: path.resolve(__dirname, './fixture-list'),
      cmd: 'dev',
    },
  });

  test('list component behavior', async ({ page }) => {
    const runtimeModel = new ToolpadRuntime(page);
    await runtimeModel.gotoPage('list');

    const firstInput = page.getByLabel('textField0');
    const secondInput = page.getByLabel('textField1');

    await firstInput.type('one');
    await secondInput.type('two');

    await expect(page.locator('p:text("one")')).toBeVisible();
    await expect(page.locator('p:text("two")')).toBeVisible();

    await expect(page.locator('button:text("one")')).toBeVisible();
  });
});
