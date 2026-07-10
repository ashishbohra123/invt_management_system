import { type Page } from "@playwright/test";

export class ShopifyHomePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("https://sauce-demo.myshopify.com/");
  }

  async clickCatalog() {
    await this.page.getByRole("link", { name: /catalog/i }).click();
  }
}
