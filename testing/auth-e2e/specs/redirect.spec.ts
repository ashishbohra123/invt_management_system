import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { PortalSelectPage } from "../pages/PortalSelectPage";

const ADMIN_LOGIN_URL = "/admin/login";
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password123";

test.describe("Portal Redirect Enforcement", () => {
  test("redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/users");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("redirects unauthenticated user from tenant page", async ({ page }) => {
    await page.goto("/tenants");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("redirects to portal-select after successful login", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(ADMIN_LOGIN_URL);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.waitForURL(/\/admin\/portal-select/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin\/portal-select/);

    const portalSelectPage = new PortalSelectPage(page);
    await expect(portalSelectPage.adminPortalTile).toBeVisible();
    await expect(portalSelectPage.userPortalTile).toBeVisible();
  });

  test("portal-select page shows sign out button", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(ADMIN_LOGIN_URL);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.waitForURL(/\/admin\/portal-select/, { timeout: 10000 });

    const portalSelectPage = new PortalSelectPage(page);
    await expect(portalSelectPage.signOutButton).toBeVisible();
  });

  test("user portal redirect works independently", async ({ page: userPage }) => {
    await userPage.goto("http://localhost:3002/login");

    const loginPage = new LoginPage(userPage);
    await expect(loginPage.portalTitle).toContainText("User Portal");

    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await userPage.waitForURL(/\/portal-select/, { timeout: 10000 });
    await expect(userPage).toHaveURL(/\/portal-select/);
  });

  test("login page redirects authenticated user to portal-select", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(ADMIN_LOGIN_URL);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL(/\/admin\/portal-select/, { timeout: 10000 });

    await page.goto(ADMIN_LOGIN_URL);
    await expect(page).toHaveURL(/\/admin\/portal-select/);
  });
});
