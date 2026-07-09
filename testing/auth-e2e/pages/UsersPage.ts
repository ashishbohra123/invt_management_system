import { type Locator, type Page } from "@playwright/test";

export class UsersPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly emptyState: Locator;
  readonly createUserButton: Locator;
  readonly userRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator("h1");
    this.emptyState = page.locator("text=No users found");
    this.createUserButton = page.getByText("+ New User");
    this.userRows = page.locator("table tbody tr");
  }

  async goto() {
    await this.page.goto("/users");
  }

  async waitForEmptyState() {
    await this.emptyState.waitFor({ state: "visible" });
  }
}
