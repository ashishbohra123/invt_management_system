import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password123";
const USER_PORTAL_URL = "http://localhost:3002/login";

test.describe("Permission Enforcement", () => {
  test("admin user without user portal permission is denied login to user portal on port 3002", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(USER_PORTAL_URL);

    await expect(loginPage.portalTitle).toContainText("User Portal");

    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);

    await loginPage.waitForError();
    await expect(loginPage.errorAlert).toBeVisible();
    await expect(loginPage.errorAlert).not.toBeEmpty();
    await expect(page).toHaveURL(/\/login/);
  });

  test("admin user without user portal permission cannot access user portal dashboard", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(USER_PORTAL_URL);

    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);

    await expect(page).toHaveURL(/\/login/);
  });

  test("admin user without user portal permission sees access denied error message", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(USER_PORTAL_URL);

    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);

    await loginPage.waitForError();
    const errorText = await loginPage.errorAlert.textContent();
    expect(errorText?.toLowerCase()).toContain("denied");
  });
});
