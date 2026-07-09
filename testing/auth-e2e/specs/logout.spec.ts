import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { PortalSelectPage } from "../pages/PortalSelectPage";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";

const ADMIN_LOGIN_URL = "/admin/login";
const ADMIN_PORTAL_SELECT_URL = "/admin/portal-select";
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password123";

test.describe("Logout Flows", () => {
  test("logs out from admin portal select page", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(ADMIN_LOGIN_URL);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL(/\/admin\/portal-select/, { timeout: 10000 });

    const portalSelectPage = new PortalSelectPage(page);
    await portalSelectPage.clickSignOut();

    await page.waitForURL(/\/admin\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(loginPage.signInButton).toBeVisible();
  });

  test("redirects to login after logout when accessing protected route", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(ADMIN_LOGIN_URL);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL(/\/admin\/portal-select/, { timeout: 10000 });

    const portalSelectPage = new PortalSelectPage(page);
    await portalSelectPage.clickSignOut();
    await page.waitForURL(/\/admin\/login/, { timeout: 10000 });

    await page.goto("/users");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("clears auth token from localStorage on logout", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(ADMIN_LOGIN_URL);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL(/\/admin\/portal-select/, { timeout: 10000 });

    const tokenBeforeLogout = await page.evaluate(() => localStorage.getItem("ims_auth_token"));
    expect(tokenBeforeLogout).toBeTruthy();

    const portalSelectPage = new PortalSelectPage(page);
    await portalSelectPage.clickSignOut();
    await page.waitForURL(/\/admin\/login/, { timeout: 10000 });

    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem("ims_auth_token"));
    expect(tokenAfterLogout).toBeNull();

    const userAfterLogout = await page.evaluate(() => localStorage.getItem("ims_auth_user"));
    expect(userAfterLogout).toBeNull();
  });
});
