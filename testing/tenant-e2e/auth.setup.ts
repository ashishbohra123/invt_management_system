import { test as setup, expect } from "@playwright/test";

const ADMIN_URL = process.env.ADMIN_PORTAL_URL || "http://localhost:3001";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "password123";
const authFile = "playwright/.auth/user.json";

setup("authenticate as admin", async ({ page }) => {
  await page.goto(`${ADMIN_URL}/admin/login`);
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder("name@company.com").fill(ADMIN_EMAIL);
  await page.getByPlaceholder("••••••••").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/admin\//, { timeout: 10000 });
  await page.context().storageState({ path: authFile });
});
