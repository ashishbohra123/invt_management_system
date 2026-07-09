import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { PortalSelectPage } from "../pages/PortalSelectPage";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";
import { UsersPage } from "../pages/UsersPage";

const ADMIN_LOGIN_URL = "/admin/login";
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password123";

test.describe("API Failure Handling", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(ADMIN_LOGIN_URL);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL(/\/admin\/portal-select/, { timeout: 10000 });
    const portalSelectPage = new PortalSelectPage(page);
    await portalSelectPage.clickAdminPortal();
    await expect(page).toHaveURL(/\/admin\/?$/);
  });

  test("handles API timeout gracefully on users page", async ({ page }) => {
    await page.route("**/api/users**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 30000));
    });
    const usersPage = new UsersPage(page);
    await usersPage.goto();
    const loadingIndicator = page.locator(".loading, [role='progressbar'], text=Loading");
    await expect(loadingIndicator).toBeVisible({ timeout: 3000 });
  });

  test("handles 400 Bad Request on users page", async ({ page }) => {
    await page.route("**/api/users**", async (route) => {
      await route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ message: "Bad request" }) });
    });
    const usersPage = new UsersPage(page);
    await usersPage.goto();
    const errorState = page.locator("text=Bad request, .error-message, [role='alert']");
    await expect(errorState.first()).toBeVisible({ timeout: 5000 });
  });

  test("handles 401 Unauthorized API response", async ({ page }) => {
    await page.route("**/api/users**", async (route) => {
      await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ message: "Unauthorized" }) });
    });
    const usersPage = new UsersPage(page);
    await usersPage.goto();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("handles 403 Forbidden API response", async ({ page }) => {
    await page.route("**/api/users**", async (route) => {
      await route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ message: "Forbidden" }) });
    });
    const usersPage = new UsersPage(page);
    await usersPage.goto();
    const errorState = page.locator("text=Forbidden, .error-message, [role='alert']");
    await expect(errorState.first()).toBeVisible({ timeout: 5000 });
  });

  test("handles 500 Internal Server Error on users page", async ({ page }) => {
    await page.route("**/api/users**", async (route) => {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "Internal server error" }) });
    });
    const usersPage = new UsersPage(page);
    await usersPage.goto();
    const errorState = page.locator("text=Internal server error, .error-message, [role='alert']");
    await expect(errorState.first()).toBeVisible({ timeout: 5000 });
  });

  test("handles 502 Bad Gateway on tenants page", async ({ page }) => {
    await page.route("**/api/tenants**", async (route) => {
      await route.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ message: "Bad gateway" }) });
    });
    await page.goto("/tenants");
    const errorState = page.locator("text=Bad gateway, .error-message, [role='alert']");
    await expect(errorState.first()).toBeVisible({ timeout: 5000 });
  });

  test("handles network connection failure gracefully", async ({ page }) => {
    await page.route("**/api/users**", async (route) => {
      await route.abort("connectionrefused");
    });
    const usersPage = new UsersPage(page);
    await usersPage.goto();
    const errorState = page.locator("text=connection, .error-message, [role='alert']");
    await expect(errorState.first()).toBeVisible({ timeout: 5000 });
  });
});
