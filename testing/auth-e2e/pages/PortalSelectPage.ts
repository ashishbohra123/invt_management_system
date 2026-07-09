import { type Locator, type Page } from "@playwright/test";

export class PortalSelectPage {
  readonly page: Page;
  readonly signOutButton: Locator;
  readonly adminPortalTile: Locator;
  readonly userPortalTile: Locator;
  readonly userName: Locator;
  readonly brandLabel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.signOutButton = page.getByText("Sign Out");
    this.adminPortalTile = page.getByText("Admin Portal");
    this.userPortalTile = page.getByText("User Portal");
    this.userName = page.locator("span").filter({ hasText: /admin@example\.com/ });
    this.brandLabel = page.getByText("MOC");
  }

  async clickSignOut() {
    await this.signOutButton.click();
  }

  async clickAdminPortal() {
    await this.adminPortalTile.click();
  }
}
