import { FrameLocator, Locator, Page } from '@playwright/test';

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

  readonly createPageBtn: Locator;

  readonly createPageDialog: CreatePageDialog;

  readonly createComponentBtn: Locator;

  readonly createComponentDialog: CreateComponentDialog;

  readonly componentCatalog: Locator;

  readonly selectedNodeEditor: Locator;

  readonly canvasFrame: FrameLocator;

  readonly pageRoot: Locator;

  readonly pageOverlay: Locator;

  constructor(page: Page) {
    this.page = page;

    this.createPageBtn = page.locator('[aria-label="Create page"]');
    this.createPageDialog = new CreatePageDialog(page);

    this.createComponentBtn = page.locator('[aria-label="Create component"]');
    this.createComponentDialog = new CreateComponentDialog(page);

    this.componentCatalog = page.locator('data-testid=component-catalog');
    this.selectedNodeEditor = page.locator('data-testid=selected-node-editor');

    this.canvasFrame = page.frameLocator('iframe[data-toolpad-canvas]');
    this.pageRoot = this.canvasFrame.locator('data-testid=page-root');
    this.pageOverlay = this.canvasFrame.locator('data-testid=page-overlay');
  }

  async goto(appId: string) {
    await this.page.goto(`/_toolpad/app/${appId}/editor`);
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
}
