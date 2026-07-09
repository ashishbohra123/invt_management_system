import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { PortalSelectPage } from "../pages/PortalSelectPage";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";

const ADMIN_LOGIN_URL = "/admin/login";
const ADMIN_PORTAL_SELECT_URL = "/admin/portal-select";
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password123";

test.describe("Admin Portal Auth", () => {
  test("renders login page with all elements", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(ADMIN_LOGIN_URL);

    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(loginPage.portalTitle).toContainText("Admin Portal");
    await expect(loginPage.welcomeBack).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.signInButton).toBeVisible();
    await expect(loginPage.rememberMeCheckbox).toBeVisible();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
    await expect(loginPage.createAccountLink).toBeVisible();
    await expect(loginPage.signInButton).toHaveText("Sign In");
  });

  test("logs in with valid admin credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(ADMIN_LOGIN_URL);

    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.waitForURL(/\/admin\/portal-select/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin\/portal-select/);

    const portalSelectPage = new PortalSelectPage(page);
    await expect(portalSelectPage.brandLabel).toBeVisible();
    await expect(portalSelectPage.adminPortalTile).toBeVisible();
    await expect(portalSelectPage.userPortalTile).toBeVisible();
    await expect(portalSelectPage.signOutButton).toBeVisible();
  });

  test("shows error on invalid password", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(ADMIN_LOGIN_URL);

    await loginPage.login(ADMIN_EMAIL, "wrong-password");
    await loginPage.waitForError();

    await expect(loginPage.errorAlert).toBeVisible();
    await expect(loginPage.errorAlert).not.toBeEmpty();
  });

  test("shows error on unknown email", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(ADMIN_LOGIN_URL);

    await loginPage.login("unknown@example.com", "some-password");
    await loginPage.waitForError();

    await expect(loginPage.errorAlert).toBeVisible();
    await expect(loginPage.errorAlert).not.toBeEmpty();
  });

  test("navigates to protected admin dashboard after portal selection", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(ADMIN_LOGIN_URL);

    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL(/\/admin\/portal-select/, { timeout: 10000 });

    const portalSelectPage = new PortalSelectPage(page);
    await portalSelectPage.clickAdminPortal();

    const adminDashboard = new AdminDashboardPage(page);
    await expect(page).toHaveURL(/\/admin\/?$/);
    await expect(adminDashboard.userManagementLink).toBeVisible();
    await expect(adminDashboard.tenantManagementLink).toBeVisible();
  });

  test("login button shows signing state while submitting", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(ADMIN_LOGIN_URL);

    await loginPage.fillEmail(ADMIN_EMAIL);
    await loginPage.fillPassword(ADMIN_PASSWORD);

    await loginPage.signInButton.click();

    await expect(loginPage.signInButton).toHaveText("Signing in...");
  });
});
