import * as path from 'path';
import * as fs from 'fs/promises';
import { fileReplace } from '../../../packages/toolpad-utils/src/fs';
import { test, expect } from '../../playwright/localTest';
import { ToolpadRuntime } from '../../models/ToolpadRuntime';
import { ToolpadEditor } from '../../models/ToolpadEditor';
import { waitForMatch } from '../../utils/streams';
import { expectBasicPageContent } from './shared';
import { setPageHidden } from '../../utils/page';

const BASIC_TESTS_PAGE_ID = '5q1xd0t';
const EXTRACTED_TYPES_PAGE_ID = 'dt1T4rY';

test.use({
  ignoreConsoleErrors: [
    // Chrome:
    /Cannot read properties of null/,
    // firefox:
    /throws\.error is null/,
    // Intentionally thrown
    /BOOM!/,
  ],
});

test.use({
  localAppConfig: {
    template: path.resolve(__dirname, './fixture'),
    cmd: 'dev',
    env: {
      SECRET_BAZ: 'Some baz secret',
    },
  },
});

async function withTemporaryEdits<T = void>(
  filePath: string,
  doWork: () => Promise<T>,
): Promise<T> {
  const envOriginal = await fs.readFile(filePath, 'utf-8');
  try {
    return await doWork();
  } finally {
    await fs.writeFile(filePath, envOriginal);
  }
}

test('functions basics', async ({ page }) => {
  const runtimeModel = new ToolpadRuntime(page);
  await runtimeModel.gotoPage('basic');

  await expectBasicPageContent(page);
});

test('function editor reload', async ({ page, localApp }) => {
  const editorModel = new ToolpadEditor(page);
  await editorModel.goToPageById(BASIC_TESTS_PAGE_ID);

  const functionsFilePath = path.resolve(localApp.dir, './toolpad/resources/functions.ts');
  await withTemporaryEdits(functionsFilePath, async () => {
    await expect(editorModel.appCanvas.getByText('edited hello')).toBeVisible();
    await fileReplace(functionsFilePath, "'edited hello'", "'edited goodbye!!!'");
    await expect(editorModel.appCanvas.getByText('edited goodbye!!!')).toBeVisible();
  });

  const envFilePath = path.resolve(localApp.dir, './.env');
  await withTemporaryEdits(envFilePath, async () => {
    await expect(editorModel.appCanvas.getByText('echo, secret: Some bar secret')).toBeVisible();
    await fileReplace(envFilePath, 'SECRET_BAR="Some bar secret"', 'SECRET_BAR="Some quux secret"');
    await expect(editorModel.appCanvas.getByText('echo, secret: Some quux secret')).toBeVisible();
  });
});

test('function editor parameters update', async ({ page, localApp }) => {
  const editorModel = new ToolpadEditor(page);
  await editorModel.goToPageById(BASIC_TESTS_PAGE_ID);

  await editorModel.componentEditor.getByRole('button', { name: 'withParams' }).click();

  const queryEditor = page.getByRole('dialog', { name: 'withParams' });
  await expect(queryEditor).toBeVisible();
  await expect(queryEditor.getByLabel('foo', { exact: true })).toBeVisible();
  await expect(queryEditor.getByLabel('bar', { exact: true })).not.toBeVisible();

  await setPageHidden(page, true); // simulate page hidden

  const functionsFilePath = path.resolve(localApp.dir, './toolpad/resources/functions.ts');
  await Promise.all([
    fileReplace(functionsFilePath, '// __NEW_PARAMETER__', "bar: { type: 'string' },"),
    waitForMatch(localApp.stdout, /built functions\.ts/),
  ]);

  await setPageHidden(page, false); // simulate page restored

  await expect(queryEditor.getByLabel('bar', { exact: true })).toBeVisible();
});

test('bound parameters are preserved on manual call', async ({ page }) => {
  const runtimeModel = new ToolpadRuntime(page);
  await runtimeModel.gotoPage('basic');

  await page.getByRole('button', { name: 'Run Manual Query' }).click();

  await expect(page.getByText('destination: checksum', { exact: true })).toBeVisible();
});

test('global variables are retained in function runtime', async ({ page }) => {
  const runtimeModel = new ToolpadRuntime(page);
  await runtimeModel.gotoPage('basic');

  await expect(page.getByText('global value: 1', { exact: true })).toBeVisible();
  await expect(page.getByText('global value: 2', { exact: true })).not.toBeVisible();

  await page.getByRole('button', { name: 'increment' }).click();

  await expect(page.getByText('global value: 2', { exact: true })).toBeVisible();
});

test('Query serialization', async ({ page }) => {
  const runtimeModel = new ToolpadRuntime(page);
  await runtimeModel.gotoPage('serialization');

  await expect(page.getByText('Circlular property: [Circular]', { exact: true })).toBeVisible();
  await expect(page.getByText('Non-circular: hello:hello', { exact: true })).toBeVisible();
  await expect(page.getByText('Invalid error: undefined', { exact: true })).toBeVisible();
});

test('Extracted types', async ({ page }) => {
  const runtimeModel = new ToolpadRuntime(page);
  await runtimeModel.gotoPage('extractedTypes');

  await expect(
    page.getByText(
      'bare function with parameters: foo: bar; typeof bar: number; quux: true; baz.hello: 5',
      {
        exact: true,
      },
    ),
  ).toBeVisible();
  await expect(
    page.getByText("synchronous function: hello I'm synchronous", { exact: true }),
  ).toBeVisible();
});

test('function editor extracted parameters', async ({ page, localApp }) => {
  const editorModel = new ToolpadEditor(page);
  await editorModel.goToPageById(EXTRACTED_TYPES_PAGE_ID);

  await editorModel.componentEditor.getByRole('button', { name: 'bareWithParams' }).click();
  const queryEditor = page.getByRole('dialog', { name: 'bareWithParams' });

  await queryEditor.getByRole('button', { name: 'Preview', exact: true }).click();
  await queryEditor
    .getByTestId('query-preview')
    .getByText(
      'bare function with parameters: foo: bar; typeof bar: number; quux: true; baz.hello: 5',
    );

  await expect(queryEditor).toBeVisible();
  await expect(queryEditor.getByRole('checkbox', { name: 'quux', exact: true })).toBeVisible();
  await expect(queryEditor.getByRole('textbox', { name: 'foo', exact: true })).toBeVisible();
  await expect(queryEditor.getByRole('textbox', { name: 'foo', exact: true })).toBeVisible();
  await expect(queryEditor.getByRole('button', { name: 'baz', exact: true })).toBeVisible();
  await expect(queryEditor.getByRole('spinbutton', { name: 'bar', exact: true })).toBeVisible();

  const fizzCombobox = queryEditor.getByRole('button', { name: 'fizz', exact: true });
  await expect(fizzCombobox).toBeVisible();

  await fizzCombobox.click();
  await expect(page.getByRole('option', { name: 'hello', exact: true })).toBeVisible();
  await expect(page.getByRole('option', { name: 'world', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');

  await expect(queryEditor.getByRole('textbox', { name: 'buzz', exact: true })).not.toBeVisible();

  await setPageHidden(page, true); // simulate page hidden

  const functionsFilePath = path.resolve(localApp.dir, './toolpad/resources/functions.ts');
  await Promise.all([
    fileReplace(functionsFilePath, '/** BARE_DUMMY_PARAM */', 'buzz: string,'),
    waitForMatch(localApp.stdout, /built functions\.ts/),
  ]);

  await setPageHidden(page, false); // simulate page restored

  await expect(queryEditor.getByRole('textbox', { name: 'buzz', exact: true })).toBeVisible();
});
