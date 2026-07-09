import { type Locator, type Page } from "@playwright/test";

export class UserFormModal {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly roleSelect: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly validationErrors: Locator;
  readonly nameError: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly portalError: Locator;
  readonly modalTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator("#name");
    this.emailInput = page.locator("#email");
    this.passwordInput = page.locator("#password");
    this.roleSelect = page.locator("#role");
    this.saveButton = page.locator('button[type="submit"]');
    this.cancelButton = page.getByText("Cancel");
    this.validationErrors = page.locator(".error-message, .validation-error, [role='alert']");
    this.nameError = page.locator("#name-error, .field-error");
    this.emailError = page.locator("#email-error, .field-error");
    this.passwordError = page.locator("#password-error, .field-error");
    this.portalError = page.locator("#portal-error, .field-error");
    this.modalTitle = page.locator(".modal-header h2, .modal-title");
  }

  async fillName(name: string) {
    await this.nameInput.fill(name);
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async selectRole(role: string) {
    await this.roleSelect.selectOption(role);
  }

  async clickSave() {
    await this.saveButton.click();
  }

  async waitForValidationErrors() {
    await this.validationErrors.first().waitFor({ state: "visible" });
  }
}
