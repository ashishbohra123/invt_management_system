import { type Page, type Locator } from "@playwright/test";

export class ShopifyCatalogPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get brownShadesLink(): Locator {
    return this.page.getByRole("link", { name: /brown shades/i });
  }

  async clickBrownShades() {
    await this.brownShadesLink.click();
  }
}
