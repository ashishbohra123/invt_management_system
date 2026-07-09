import { test as setup, expect } from "@playwright/test";

const ADMIN_URL = process.env.ADMIN_PORTAL_URL || "http://localhost:3001";
const API_URL = process.env.API_URL || "http://localhost:3000";

setup("authenticate as admin", async ({ page }) => {
  const response = await page.request.post(`${API_URL}/api/auth/login`, {
    data: {
      email: process.env.E2E_ADMIN_EMAIL || "admin@example.com",
      password: process.env.E2E_ADMIN_PASSWORD || "password123",
    },
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.data.token).toBeDefined();

  const token = body.data.token;
  const hostname = new URL(ADMIN_URL).hostname;
  await page.context().addCookies([
    { name: "token", value: token, domain: hostname, path: "/" },
  ]);

  await page.context().addInitScript((t) => {
    localStorage.setItem("ims_auth_token", t);
  }, token);
});
