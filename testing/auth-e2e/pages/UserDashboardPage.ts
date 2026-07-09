import { type Locator, type Page } from "@playwright/test";

export class UserDashboardPage {
  readonly page: Page;
  readonly navBar: Locator;
  readonly signOutButton: Locator;
  readonly userName: Locator;
  readonly productsLink: Locator;
  readonly inventoryLink: Locator;
  readonly ordersLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navBar = page.locator("nav");
    this.signOutButton = page.getByText("Sign Out");
    this.userName = page.locator("nav span").first();
    this.productsLink = page.getByText("Products");
    this.inventoryLink = page.getByText("Inventory");
    this.ordersLink = page.getByText("Orders");
  }

  async clickSignOut() {
    await this.signOutButton.click();
  }
}
