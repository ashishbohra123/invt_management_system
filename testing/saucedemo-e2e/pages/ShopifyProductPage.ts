import { type Page } from "@playwright/test";

export class ShopifyProductPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async getPrice(): Promise<string> {
    const priceText = await this.page.locator('[class*="price"]').first().textContent();
    return priceText?.trim() ?? "";
  }
}
