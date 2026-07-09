import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { PortalSelectPage } from "../pages/PortalSelectPage";
import { UserDashboardPage } from "../pages/UserDashboardPage";

const USER_LOGIN_URL = "/login";
const USER_PORTAL_SELECT_URL = "/portal-select";
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password123";

test.describe("User Portal Auth", () => {
  test("renders login page at /login", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(USER_LOGIN_URL);

    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.portalTitle).toContainText("User Portal");
    await expect(loginPage.welcomeBack).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.signInButton).toBeVisible();
    await expect(loginPage.signInButton).toHaveText("Sign In");
  });

  test("logs in with valid credentials from user portal", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(USER_LOGIN_URL);

    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.waitForURL(/\/portal-select/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/portal-select/);

    const portalSelectPage = new PortalSelectPage(page);
    await expect(portalSelectPage.brandLabel).toBeVisible();
    await expect(portalSelectPage.adminPortalTile).toBeVisible();
    await expect(portalSelectPage.userPortalTile).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(USER_LOGIN_URL);

    await loginPage.login(ADMIN_EMAIL, "wrong-password");
    await loginPage.waitForError();

    await expect(loginPage.errorAlert).toBeVisible();
    await expect(loginPage.errorAlert).not.toBeEmpty();
  });
});
