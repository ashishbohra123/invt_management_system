import { type Locator, type Page } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly errorAlert: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly forgotPasswordLink: Locator;
  readonly createAccountLink: Locator;
  readonly portalTitle: Locator;
  readonly welcomeBack: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.signInButton = page.locator('button[type="submit"]');
    this.errorAlert = page.locator('[role="alert"]');
    this.rememberMeCheckbox = page.locator('input[type="checkbox"]');
    this.forgotPasswordLink = page.getByText("Forgot password?");
    this.createAccountLink = page.getByText("Create one");
    this.portalTitle = page.locator("h1");
    this.welcomeBack = page.getByText("Welcome back");
  }

  async goto(url: string) {
    await this.page.goto(url);
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async clickSignIn() {
    await this.signInButton.click();
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSignIn();
  }

  async waitForError() {
    await this.errorAlert.waitFor({ state: "visible" });
  }
}
