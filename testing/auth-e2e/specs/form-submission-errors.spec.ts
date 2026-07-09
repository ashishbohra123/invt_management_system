import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { PortalSelectPage } from "../pages/PortalSelectPage";
import { UserFormModal } from "../pages/UserFormModal";

const ADMIN_LOGIN_URL = "/admin/login";
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password123";

test.describe("Form Submission Error Handling", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(ADMIN_LOGIN_URL);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL(/\/admin\/portal-select/, { timeout: 10000 });
    const portalSelectPage = new PortalSelectPage(page);
    await portalSelectPage.clickAdminPortal();
    await expect(page).toHaveURL(/\/admin\/?$/);
  });

  test("shows error when user creation API returns 500", async ({ page }) => {
    await page.route("**/api/users**", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "Failed to create user" }) });
      } else {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
      }
    });
    await page.goto("/users");
    const createButton = page.getByText("+ New User");
    if (await createButton.isVisible()) {
      await createButton.click();
    }
    const userForm = new UserFormModal(page);
    await userForm.fillName("Test User");
    await userForm.fillEmail("test@example.com");
    await userForm.fillPassword("password123");
    await userForm.clickSave();
    const errorAlert = page.locator("[role='alert'], .error-message, .toast-error");
    await expect(errorAlert.first()).toBeVisible({ timeout: 5000 });
  });

  test("shows error when user creation API returns 409 conflict", async ({ page }) => {
    await page.route("**/api/users**", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ message: "User with this email already exists" }) });
      } else {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
      }
    });
    await page.goto("/users");
    const createButton = page.getByText("+ New User");
    if (await createButton.isVisible()) {
      await createButton.click();
    }
    const userForm = new UserFormModal(page);
    await userForm.fillName("Test User");
    await userForm.fillEmail("existing@example.com");
    await userForm.fillPassword("password123");
    await userForm.clickSave();
    const errorAlert = page.locator("[role='alert'], .error-message, .toast-error");
    await expect(errorAlert.first()).toBeVisible({ timeout: 5000 });
  });

  test("shows error when user creation API times out", async ({ page }) => {
    await page.route("**/api/users**", async (route) => {
      if (route.request().method() === "POST") {
        await new Promise((resolve) => setTimeout(resolve, 30000));
      } else {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
      }
    });
    await page.goto("/users");
    const createButton = page.getByText("+ New User");
    if (await createButton.isVisible()) {
      await createButton.click();
    }
    const userForm = new UserFormModal(page);
    await userForm.fillName("Test User");
    await userForm.fillEmail("test@example.com");
    await userForm.fillPassword("password123");
    await userForm.clickSave();
    const errorAlert = page.locator("[role='alert'], .error-message, .toast-error");
    await expect(errorAlert.first()).toBeVisible({ timeout: 15000 });
  });

  test("shows error when tenant creation API returns 400", async ({ page }) => {
    await page.route("**/api/tenants**", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ message: "Invalid tenant data" }) });
      } else {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
      }
    });
    await page.goto("/tenants");
    const createTenantButton = page.getByText("+ New Tenant");
    if (await createTenantButton.isVisible()) {
      await createTenantButton.click();
    }
    const tenantForm = page.locator("form");
    await tenantForm.locator("#name").fill("Test Tenant");
    await tenantForm.locator('button[type="submit"]').click();
    const errorAlert = page.locator("[role='alert'], .error-message, .toast-error");
    await expect(errorAlert.first()).toBeVisible({ timeout: 5000 });
  });

  test("save button shows submitting state during form submission", async ({ page }) => {
    await page.route("**/api/users**", async (route) => {
      if (route.request().method() === "POST") {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } else {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
      }
    });
    await page.goto("/users");
    const createButton = page.getByText("+ New User");
    if (await createButton.isVisible()) {
      await createButton.click();
    }
    const userForm = new UserFormModal(page);
    await userForm.fillName("Test User");
    await userForm.fillEmail("test@example.com");
    await userForm.fillPassword("password123");
    await userForm.clickSave();
    await expect(userForm.saveButton).toBeDisabled({ timeout: 3000 });
  });
});
