import { test, expect } from '@playwright/test';
import { ToolpadHome } from '../../models/ToolpadHome';
import { ToolpadEditor } from '../../models/ToolpadEditor';
import clickCenter from '../../utils/clickCenter';
import domInput from './domInput.json';

test('can place new components from catalog', async ({ page, browserName }) => {
  const homeModel = new ToolpadHome(page);
  const editorModel = new ToolpadEditor(page, browserName);

  await homeModel.goto();
  const app = await homeModel.createApplication({});
  await editorModel.goto(app.id);

  await editorModel.pageRoot.waitFor();

  const canvasInputLocator = editorModel.appCanvas.locator('input');

  await expect(canvasInputLocator).toHaveCount(0);

  const TEXT_FIELD_COMPONENT_ID = 'TextField';

  // Drag in a first component

  await editorModel.dragNewComponentToAppCanvas(TEXT_FIELD_COMPONENT_ID);

  await canvasInputLocator.first().waitFor();

  await expect(canvasInputLocator).toHaveCount(1);
  await expect(canvasInputLocator).toBeVisible();

  // Drag in a second component

  await editorModel.dragNewComponentToAppCanvas(TEXT_FIELD_COMPONENT_ID);

  await expect(canvasInputLocator).toHaveCount(2);
});

test('can move elements in page', async ({ page, browserName }) => {
  const homeModel = new ToolpadHome(page);
  const editorModel = new ToolpadEditor(page, browserName);

  await homeModel.goto();
  const app = await homeModel.createApplication({ dom: domInput });
  await editorModel.goto(app.id);

  await editorModel.pageRoot.waitFor();

  const canvasMoveElementHandleSelector = ':has-text("TextField")[draggable]';

  const canvasInputLocator = editorModel.appCanvas.locator('input');
  const canvasMoveElementHandleLocator = editorModel.appCanvas.locator(
    canvasMoveElementHandleSelector,
  );

  const firstTextFieldLocator = canvasInputLocator.first();
  const secondTextFieldLocator = canvasInputLocator.nth(1);

  await firstTextFieldLocator.focus();
  await firstTextFieldLocator.fill('textField1');

  await secondTextFieldLocator.focus();
  await secondTextFieldLocator.fill('textField2');

  await expect(firstTextFieldLocator).toHaveAttribute('value', 'textField1');
  await expect(secondTextFieldLocator).toHaveAttribute('value', 'textField2');

  await expect(canvasMoveElementHandleLocator).not.toBeVisible();

  // Move first element by dragging it to the right side of second element

  await clickCenter(page, firstTextFieldLocator);

  const secondTextFieldBoundingBox = await secondTextFieldLocator.boundingBox();
  expect(secondTextFieldBoundingBox).toBeDefined();

  const moveTargetX = secondTextFieldBoundingBox!.x + secondTextFieldBoundingBox!.width;
  const moveTargetY = secondTextFieldBoundingBox!.y + secondTextFieldBoundingBox!.height / 2;

  await editorModel.dragToAppCanvas(
    canvasMoveElementHandleSelector,
    true,
    moveTargetX,
    moveTargetY,
  );

  await expect(firstTextFieldLocator).toHaveAttribute('value', 'textField2');
  await expect(secondTextFieldLocator).toHaveAttribute('value', 'textField1');
});

test('can delete elements from page', async ({ page, browserName }) => {
  const homeModel = new ToolpadHome(page);
  const editorModel = new ToolpadEditor(page, browserName);

  await homeModel.goto();
  const app = await homeModel.createApplication({ dom: domInput });
  await editorModel.goto(app.id);

  await editorModel.pageRoot.waitFor();

  const canvasInputLocator = editorModel.appCanvas.locator('input');
  const canvasRemoveElementButtonLocator = editorModel.appCanvas.locator(
    'button[aria-label="Remove element"]',
  );

  await expect(canvasInputLocator).toHaveCount(2);

  // Delete element by clicking

  await expect(canvasRemoveElementButtonLocator).not.toBeVisible();

  const firstTextFieldLocator = canvasInputLocator.first();

  await clickCenter(page, firstTextFieldLocator);
  await canvasRemoveElementButtonLocator.click();

  await expect(canvasInputLocator).toHaveCount(1);

  // Delete element by pressing key

  await clickCenter(page, firstTextFieldLocator);
  await page.keyboard.press('Backspace');

  await expect(canvasInputLocator).toHaveCount(0);
});

test('can create new component', async ({ page, browserName }) => {
  const homeModel = new ToolpadHome(page);
  const editorModel = new ToolpadEditor(page, browserName);

  await homeModel.goto();
  const app = await homeModel.createApplication({});

  await editorModel.goto(app.id);

  await editorModel.createPage('somePage');
  await editorModel.createComponent('someComponent');
});
