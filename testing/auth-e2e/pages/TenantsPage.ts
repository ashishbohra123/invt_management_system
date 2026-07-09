import { type Locator, type Page } from "@playwright/test";

export class TenantsPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly emptyState: Locator;
  readonly createTenantButton: Locator;
  readonly tenantRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator("h1");
    this.emptyState = page.locator("text=No tenants found");
    this.createTenantButton = page.getByText("+ New Tenant");
    this.tenantRows = page.locator("table tbody tr");
  }

  async goto() {
    await this.page.goto("/tenants");
  }

  async waitForEmptyState() {
    await this.emptyState.waitFor({ state: "visible" });
  }
}
