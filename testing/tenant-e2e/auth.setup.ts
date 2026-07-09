import { test as setup, expect } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

setup("authenticate as admin", async ({ page }) => {
  const adminPortalUrl = process.env.ADMIN_PORTAL_URL || "http://localhost:3001";
  const apiUrl = process.env.API_URL || "http://localhost:3000";

  const response = await page.request.post(`${apiUrl}/api/auth/login`, {
    data: {
      email: process.env.E2E_ADMIN_EMAIL || "admin@example.com",
      password: process.env.E2E_ADMIN_PASSWORD || "admin123",
    },
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.data.token).toBeDefined();

  const token = body.data.token;

  await page.context().addCookies([
    { name: "token", value: token, domain: new URL(adminPortalUrl).hostname, path: "/" },
    { name: "user", value: JSON.stringify(body.data.user), domain: new URL(adminPortalUrl).hostname, path: "/" },
  ]);

  await page.context().storageState({ path: authFile });
});
