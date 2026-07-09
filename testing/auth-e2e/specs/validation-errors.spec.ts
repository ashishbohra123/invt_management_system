import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { PortalSelectPage } from "../pages/PortalSelectPage";
import { UserFormModal } from "../pages/UserFormModal";

const ADMIN_LOGIN_URL = "/admin/login";
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password123";

test.describe("Validation Error Display", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(ADMIN_LOGIN_URL);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL(/\/admin\/portal-select/, { timeout: 10000 });
    const portalSelectPage = new PortalSelectPage(page);
    await portalSelectPage.clickAdminPortal();
    await expect(page).toHaveURL(/\/admin\/?$/);
  });

  test("shows validation errors when creating user with empty form", async ({ page }) => {
    await page.goto("/users");
    const createButton = page.getByText("+ New User");
    if (await createButton.isVisible()) {
      await createButton.click();
    }
    const userForm = new UserFormModal(page);
    await userForm.clickSave();
    await userForm.waitForValidationErrors();
    await expect(userForm.validationErrors.first()).toBeVisible();
  });

  test("shows validation error for invalid email format", async ({ page }) => {
    await page.goto("/users");
    const createButton = page.getByText("+ New User");
    if (await createButton.isVisible()) {
      await createButton.click();
    }
    const userForm = new UserFormModal(page);
    await userForm.fillName("Test User");
    await userForm.fillEmail("invalid-email");
    await userForm.clickSave();
    await userForm.waitForValidationErrors();
    await expect(userForm.emailError).toBeVisible();
  });

  test("shows validation error for short password", async ({ page }) => {
    await page.goto("/users");
    const createButton = page.getByText("+ New User");
    if (await createButton.isVisible()) {
      await createButton.click();
    }
    const userForm = new UserFormModal(page);
    await userForm.fillName("Test User");
    await userForm.fillEmail("test@example.com");
    await userForm.fillPassword("ab");
    await userForm.clickSave();
    await userForm.waitForValidationErrors();
    await expect(userForm.passwordError).toBeVisible();
  });

  test("shows validation error for missing name", async ({ page }) => {
    await page.goto("/users");
    const createButton = page.getByText("+ New User");
    if (await createButton.isVisible()) {
      await createButton.click();
    }
    const userForm = new UserFormModal(page);
    await userForm.fillEmail("test@example.com");
    await userForm.fillPassword("password123");
    await userForm.clickSave();
    await userForm.waitForValidationErrors();
    await expect(userForm.nameError).toBeVisible();
  });

  test("validation errors clear after fixing fields", async ({ page }) => {
    await page.goto("/users");
    const createButton = page.getByText("+ New User");
    if (await createButton.isVisible()) {
      await createButton.click();
    }
    const userForm = new UserFormModal(page);
    await userForm.clickSave();
    await userForm.waitForValidationErrors();

    await userForm.fillName("Test User");
    await userForm.fillEmail("test@example.com");
    await userForm.fillPassword("password123");

    const errorsAfterFix = await page.locator(".error-message, .validation-error, [role='alert']").count();
    expect(errorsAfterFix).toBeLessThanOrEqual(1);
  });
});
