import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = "playwright/.auth/user.json";

setup("authenticate as admin", async ({ page }) => {
  const adminUrl = process.env.ADMIN_PORTAL_URL || "http://localhost:3001";
  await page.goto(`${adminUrl}/admin/login`);
  await page.waitForLoadState("networkidle");
  await page.locator('input[type="email"]').fill("admin@example.com");
  await page.locator('input[type="password"]').fill("password123");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.waitForURL("**/admin/portal-select");
  await page.waitForLoadState("networkidle");
  await page.context().storageState({ path: AUTH_FILE });
});
