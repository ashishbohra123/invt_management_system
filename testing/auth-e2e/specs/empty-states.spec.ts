import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { PortalSelectPage } from "../pages/PortalSelectPage";
import { UsersPage } from "../pages/UsersPage";
import { TenantsPage } from "../pages/TenantsPage";

const ADMIN_LOGIN_URL = "/admin/login";
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password123";

test.describe("Empty States", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(ADMIN_LOGIN_URL);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL(/\/admin\/portal-select/, { timeout: 10000 });
    const portalSelectPage = new PortalSelectPage(page);
    await portalSelectPage.clickAdminPortal();
    await expect(page).toHaveURL(/\/admin\/?$/);
  });

  test("shows empty state when no users exist", async ({ page }) => {
    await page.route("**/api/users**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });
    const usersPage = new UsersPage(page);
    await usersPage.goto();
    await expect(usersPage.pageTitle).toContainText("User");
    await usersPage.waitForEmptyState();
    await expect(usersPage.emptyState).toBeVisible();
    await expect(usersPage.userRows).toHaveCount(0);
  });

  test("shows create user button in empty state", async ({ page }) => {
    await page.route("**/api/users**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });
    const usersPage = new UsersPage(page);
    await usersPage.goto();
    await usersPage.waitForEmptyState();
    await expect(usersPage.createUserButton).toBeVisible();
  });

  test("shows empty state when no tenants exist", async ({ page }) => {
    await page.route("**/api/tenants**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });
    const tenantsPage = new TenantsPage(page);
    await tenantsPage.goto();
    await expect(tenantsPage.pageTitle).toContainText("Tenant");
    await tenantsPage.waitForEmptyState();
    await expect(tenantsPage.emptyState).toBeVisible();
    await expect(tenantsPage.tenantRows).toHaveCount(0);
  });

  test("shows create tenant button in empty state", async ({ page }) => {
    await page.route("**/api/tenants**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });
    const tenantsPage = new TenantsPage(page);
    await tenantsPage.goto();
    await tenantsPage.waitForEmptyState();
    await expect(tenantsPage.createTenantButton).toBeVisible();
  });

  test("transitions from empty state to populated list after adding user", async ({ page }) => {
    await page.route("**/api/users**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });
    const usersPage = new UsersPage(page);
    await usersPage.goto();
    await usersPage.waitForEmptyState();
    await expect(usersPage.emptyState).toBeVisible();

    await page.unroute("**/api/users**");
    await page.route("**/api/users**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: 1, name: "Test User", email: "test@example.com", role: "admin" }]) });
    });
    await usersPage.goto();
    await expect(usersPage.userRows).toHaveCount(1);
    await expect(usersPage.emptyState).not.toBeVisible();
  });
});
