import { expect, FrameLocator, Locator, Page } from '@playwright/test';

class CreatePageDialog {
  readonly page: Page;

  readonly dialog: Locator;

  readonly nameInput: Locator;

  readonly createButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.locator('[role="dialog"]', {
      hasText: 'Create a new MUI Toolpad Page',
    });
    this.nameInput = this.dialog.locator('label:has-text("name")');
    this.createButton = this.dialog.locator('button:has-text("Create")');
  }
}

class CreateComponentDialog {
  readonly page: Page;

  readonly dialog: Locator;

  readonly nameInput: Locator;

  readonly createButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.dialog = page.locator('[role="dialog"]', {
      hasText: 'Create a new MUI Toolpad Code Component',
    });
    this.nameInput = this.dialog.locator('label:has-text("name")');
    this.createButton = this.dialog.locator('button:has-text("Create")');
  }
}

export class ToolpadEditor {
  readonly page: Page;

  readonly browserName: string;

  readonly createPageBtn: Locator;

  readonly createPageDialog: CreatePageDialog;

  readonly createComponentBtn: Locator;

  readonly createComponentDialog: CreateComponentDialog;

  readonly componentCatalog: Locator;

  readonly componentEditor: Locator;

  readonly appCanvas: FrameLocator;

  readonly pageRoot: Locator;

  readonly pageOverlay: Locator;

  constructor(page: Page, browserName: string) {
    this.page = page;
    this.browserName = browserName;

    this.createPageBtn = page.locator('[aria-label="Create page"]');
    this.createPageDialog = new CreatePageDialog(page);

    this.createComponentBtn = page.locator('[aria-label="Create component"]');
    this.createComponentDialog = new CreateComponentDialog(page);

    this.componentCatalog = page.locator('data-testid=component-catalog');
    this.componentEditor = page.locator('data-testid=component-editor');

    this.appCanvas = page.frameLocator('[name=data-toolpad-canvas]');
    this.pageRoot = this.appCanvas.locator('data-testid=page-root');
    this.pageOverlay = this.appCanvas.locator('data-testid=page-overlay');
  }

  async goto(appId: string) {
    await this.page.goto(`/_toolpad/app/${appId}`);
  }

  async createPage(name: string) {
    await this.createPageBtn.click();
    await this.createPageDialog.nameInput.fill(name);
    await this.createPageDialog.createButton.click();
  }

  async createComponent(name: string) {
    await this.createComponentBtn.click();
    await this.createComponentDialog.nameInput.fill(name);
    await this.createComponentDialog.createButton.click();
  }

  async dragToAppCanvas(
    sourceSelector: string,
    isSourceInCanvas: boolean,
    moveTargetX: number,
    moveTargetY: number,
  ) {
    const isFirefox = this.browserName === 'firefox';

    const sourceLocator = isSourceInCanvas
      ? this.appCanvas.locator(sourceSelector)
      : this.page.locator(sourceSelector);

    const sourceBoundingBox = await sourceLocator.boundingBox();
    const targetBoundingBox = await this.pageRoot.boundingBox();

    expect(sourceBoundingBox).toBeDefined();
    expect(targetBoundingBox).toBeDefined();

    await this.page.mouse.move(
      sourceBoundingBox!.x + sourceBoundingBox!.width / 2,
      sourceBoundingBox!.y + sourceBoundingBox!.height / 2,
      { steps: 5 },
    );

    const appCanvasFrame = this.page.frame('data-toolpad-canvas');
    expect(appCanvasFrame).toBeDefined();

    // Source drag event needs to be dispatched manually in Firefox for tests to work (Playwright bug)
    // https://github.com/microsoft/playwright/issues/17441
    if (isFirefox) {
      if (isSourceInCanvas) {
        const dataTransfer = await appCanvasFrame!.evaluateHandle(() => new DataTransfer());
        await appCanvasFrame!.dispatchEvent(sourceSelector, 'dragstart', { dataTransfer });
      } else {
        const dataTransfer = await this.page.evaluateHandle(() => new DataTransfer());
        await this.page.dispatchEvent(sourceSelector, 'dragstart', { dataTransfer });
      }
    } else {
      await this.page.mouse.down();
    }

    await this.page.mouse.move(moveTargetX, moveTargetY, { steps: 5 });

    // Overlay drag events need to be dispatched manually in Firefox for tests to work (Playwright bug)
    // https://github.com/microsoft/playwright/issues/17441
    if (isFirefox) {
      const pageOverlayBoundingBox = await this.pageOverlay.boundingBox();

      expect(pageOverlayBoundingBox).toBeDefined();

      const eventMousePosition = {
        clientX: moveTargetX - pageOverlayBoundingBox!.x,
        clientY: moveTargetY - pageOverlayBoundingBox!.y,
      };

      const pageOverlaySelector = 'data-testid=page-overlay';

      await appCanvasFrame!.dispatchEvent(pageOverlaySelector, 'dragover', eventMousePosition);
      await appCanvasFrame!.dispatchEvent(pageOverlaySelector, 'drop', eventMousePosition);
      await appCanvasFrame!.dispatchEvent(pageOverlaySelector, 'dragend');
    } else {
      await this.page.mouse.up();
    }
  }

  async dragNewComponentToAppCanvas(componentName: string) {
    await this.componentCatalog.hover();

    const sourceSelector = `data-testid=component-catalog >> div:has-text("${componentName}")[draggable]`;

    const targetBoundingBox = await this.pageRoot.boundingBox();
    expect(targetBoundingBox).toBeDefined();

    const moveTargetX = targetBoundingBox!.x + targetBoundingBox!.width / 2;
    const moveTargetY = targetBoundingBox!.y + targetBoundingBox!.height / 2;

    this.dragToAppCanvas(sourceSelector, false, moveTargetX, moveTargetY);
  }
}
