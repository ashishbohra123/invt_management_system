import { type Locator, type Page } from "@playwright/test";

export class AdminDashboardPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly userManagementLink: Locator;
  readonly tenantManagementLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator("nav");
    this.userManagementLink = page.getByText("User Management");
    this.tenantManagementLink = page.getByText("Tenant Management");
  }
}
