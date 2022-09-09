import * as path from 'path';
import { ToolpadHome } from '../../models/ToolpadHome';
import { ToolpadRuntime } from '../../models/ToolpadRuntime';
import { test, expect } from '../../playwright/test';
import { readJsonFile } from '../../utils/fs';

test('input basics', async ({ page }) => {
  const dom = await readJsonFile(path.resolve(__dirname, './basicDom.json'));

  const homeModel = new ToolpadHome(page);
  await homeModel.goto();
  const app = await homeModel.createApplication({ dom });

  const runtimeModel = new ToolpadRuntime(page);
  await runtimeModel.gotoPage(app.id, 'page1');

  const textField1 = page.locator('label:has-text("textField1")');
  const textField2 = page.locator('label:has-text("textField2")');
  const textField3 = page.locator('label:has-text("textField3")');

  await page.locator('text="foo  bar"').waitFor({ state: 'visible' });

  await textField1.fill('hello');

  await page.locator('text="foo hello bar"').waitFor({ state: 'visible' });

  expect(await textField2.inputValue()).toBe('hello1');

  expect(await textField3.inputValue()).toBe('hello2');

  await page.goto(`${page.url()}?msg=hello3`);

  expect(await textField3.inputValue()).toBe('hello3');
});
