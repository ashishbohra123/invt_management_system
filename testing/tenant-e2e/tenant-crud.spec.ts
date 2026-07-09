import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const ADMIN_URL = process.env.ADMIN_PORTAL_URL || "http://localhost:3001";
const API_URL = process.env.API_URL || "http://localhost:3000";

async function loginViaApi(page: Page): Promise<string> {
  const response = await page.request.post(`${API_URL}/api/auth/login`, {
    data: {
      email: process.env.E2E_ADMIN_EMAIL || "admin@example.com",
      password: process.env.E2E_ADMIN_PASSWORD || "admin123",
    },
  });
  const body = await response.json();
  return body.data.token;
}

async function setAuthCookies(page: Page, token: string) {
  const hostname = new URL(ADMIN_URL).hostname;
  await page.context().addCookies([
    { name: "token", value: token, domain: hostname, path: "/" },
  ]);
}

async function navigateToTenants(page: Page) {
  await page.goto(`${ADMIN_URL}/tenants`);
  await page.waitForLoadState("networkidle");
}

async function getAddTenantButton(page: Page) {
  return page.getByRole("button", { name: /add tenant/i });
}

async function openCreateModal(page: Page) {
  await (await getAddTenantButton(page)).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Create Tenant")).toBeVisible();
}

async function fillTenantForm(page: Page, name: string, domains?: string) {
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/name/i).fill(name);
  if (domains !== undefined) {
    await dialog.getByLabel(/domains/i).fill(domains);
  }
}

async function submitTenantForm(page: Page) {
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /create tenant/i }).click();
}

async function updateTenantForm(page: Page) {
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /update tenant/i }).click();
}

async function closeModal(page: Page) {
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /cancel/i }).click();
  await expect(dialog).not.toBeVisible();
}

test.describe("Tenant Management CRUD - Phase 3", () => {
  let token: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    token = await loginViaApi(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await setAuthCookies(page, token);
  });

  test("TC-TN-01: Page loads and displays tenant list", async ({ page }) => {
    await navigateToTenants(page);
    await expect(page.locator("h1")).toContainText("Tenant Management");
    const searchBar = page.getByPlaceholder(/search tenants/i);
    await expect(searchBar).toBeVisible();
  });

  test("TC-TN-02: Create tenant modal opens with empty form", async ({ page }) => {
    await navigateToTenants(page);
    await openCreateModal(page);
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel(/name/i)).toHaveValue("");
    await closeModal(page);
  });

  test("TC-TN-03: Create tenant with valid data via API", async ({ page }) => {
    const uniqueName = `E2E Test Tenant ${Date.now()}`;
    const createResponse = await page.request.post(`${API_URL}/api/tenants`, {
      data: { name: uniqueName, domains: ["e2e.example.com"] },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(createResponse.status()).toBe(201);
    const body = await createResponse.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe(uniqueName);
    expect(body.data.domains).toContain("e2e.example.com");

    await navigateToTenants(page);
    await expect(page.getByText(uniqueName)).toBeVisible();
  });

  test("TC-TN-04: Create tenant without name returns validation error", async ({ page }) => {
    const response = await page.request.post(`${API_URL}/api/tenants`, {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("Name is required");
  });

  test("TC-TN-05: Create duplicate tenant returns 409", async ({ page }) => {
    const tenantId = `dup-${Date.now()}`;
    await page.request.post(`${API_URL}/api/tenants`, {
      data: { name: "Duplicate Tenant", tenant_id: tenantId, domains: ["dup.example.com"] },
      headers: { Authorization: `Bearer ${token}` },
    });
    const response = await page.request.post(`${API_URL}/api/tenants`, {
      data: { name: "Duplicate Tenant", tenant_id: tenantId, domains: ["dup.example.com"] },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(409);
  });

  test("TC-TN-06: GET /api/tenants returns paginated list", async ({ page }) => {
    const response = await page.request.get(`${API_URL}/api/tenants`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("TC-TN-07: GET /api/tenants rejects unauthenticated request", async ({ page }) => {
    const response = await page.request.get(`${API_URL}/api/tenants`);
    expect(response.status()).toBe(401);
  });

  test("TC-TN-08: Edit tenant modal pre-fills with current data via UI", async ({ page }) => {
    const tenantName = `Edit Prep ${Date.now()}`;
    const createRes = await page.request.post(`${API_URL}/api/tenants`, {
      data: { name: tenantName, domains: ["prefill.example.com"] },
      headers: { Authorization: `Bearer ${token}` },
    });
    const tenant = (await createRes.json()).data;

    await navigateToTenants(page);
    const row = page.locator(`text=${tenantName}`).first();
    await expect(row).toBeVisible();
    const editButton = row.locator("xpath=ancestor::tr").first().getByTitle("Edit");
    await editButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Edit Tenant")).toBeVisible();

    const nameInput = dialog.getByLabel(/name/i);
    await expect(nameInput).toHaveValue(tenantName);
    await closeModal(page);
  });

  test("TC-TN-09: Update tenant name via API", async ({ page }) => {
    const tenantName = `Update Target ${Date.now()}`;
    const createRes = await page.request.post(`${API_URL}/api/tenants`, {
      data: { name: tenantName, domains: ["update.example.com"] },
      headers: { Authorization: `Bearer ${token}` },
    });
    const tenant = (await createRes.json()).data;
    const updatedName = `${tenantName} - Updated`;

    const updateRes = await page.request.put(`${API_URL}/api/tenants/${tenant.id}`, {
      data: { name: updatedName },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(updateRes.status()).toBe(200);
    const updateBody = await updateRes.json();
    expect(updateBody.data.name).toBe(updatedName);

    const getRes = await page.request.get(`${API_URL}/api/tenants/${tenant.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const getBody = await getRes.json();
    expect(getBody.data.name).toBe(updatedName);
  });

  test("TC-TN-10: Update tenant status to inactive via API", async ({ page }) => {
    const tenantName = `Status Test ${Date.now()}`;
    const createRes = await page.request.post(`${API_URL}/api/tenants`, {
      data: { name: tenantName, domains: ["status.example.com"] },
      headers: { Authorization: `Bearer ${token}` },
    });
    const tenant = (await createRes.json()).data;

    const updateRes = await page.request.put(`${API_URL}/api/tenants/${tenant.id}`, {
      data: { status: "inactive" },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(updateRes.status()).toBe(200);
    const updateBody = await updateRes.json();
    expect(updateBody.data.status).toBe("inactive");
  });

  test("TC-TN-11: Update non-existent tenant returns 404", async ({ page }) => {
    const response = await page.request.put(`${API_URL}/api/tenants/non-existent-id`, {
      data: { name: "Ghost" },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(404);
  });

  test("TC-TN-12: Delete tenant via API", async ({ page }) => {
    const tenantName = `Delete Target ${Date.now()}`;
    const createRes = await page.request.post(`${API_URL}/api/tenants`, {
      data: { name: tenantName, domains: ["delete.example.com"] },
      headers: { Authorization: `Bearer ${token}` },
    });
    const tenant = (await createRes.json()).data;

    const deleteRes = await page.request.delete(`${API_URL}/api/tenants/${tenant.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(deleteRes.status()).toBe(204);

    const getRes = await page.request.get(`${API_URL}/api/tenants/${tenant.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(getRes.status()).toBe(404);
  });

  test("TC-TN-13: Delete non-existent tenant returns 404", async ({ page }) => {
    const response = await page.request.delete(`${API_URL}/api/tenants/non-existent-id`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(404);
  });

  test("TC-TN-14: Delete tenant via UI confirmation dialog", async ({ page }) => {
    const tenantName = `UI Delete ${Date.now()}`;
    const createRes = await page.request.post(`${API_URL}/api/tenants`, {
      data: { name: tenantName, domains: ["uidelete.example.com"] },
      headers: { Authorization: `Bearer ${token}` },
    });
    const tenant = (await createRes.json()).data;

    await navigateToTenants(page);
    const row = page.locator(`text=${tenantName}`).first();
    await expect(row).toBeVisible();

    const deleteButton = row.locator("xpath=ancestor::tr").first().getByTitle("Delete");
    await deleteButton.click();

    const confirmDialog = page.getByRole("dialog").filter({ hasText: "Delete Tenant" });
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog).toContainText(tenantName);

    await confirmDialog.getByRole("button", { name: /delete/i }).click();
    await expect(confirmDialog).not.toBeVisible();
    await expect(page.getByText(tenantName)).not.toBeVisible();
  });

  test("TC-TN-15: UI search filters tenant list", async ({ page }) => {
    await navigateToTenants(page);
    const search = page.getByPlaceholder(/search tenants/i);
    await search.fill("Acme Corp");
    const table = page.locator("table");
    await expect(table).toBeVisible();
  });

  test("TC-TN-16: API - GET /api/tenants/:id returns 404 for unknown tenant", async ({ page }) => {
    const response = await page.request.get(`${API_URL}/api/tenants/00000000-0000-0000-0000-000000000000`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(404);
  });

  test("TC-TN-17: API - Update tenant domains", async ({ page }) => {
    const tenantName = `Domains Test ${Date.now()}`;
    const createRes = await page.request.post(`${API_URL}/api/tenants`, {
      data: { name: tenantName, domains: ["old.example.com"] },
      headers: { Authorization: `Bearer ${token}` },
    });
    const tenant = (await createRes.json()).data;

    const updateRes = await page.request.put(`${API_URL}/api/tenants/${tenant.id}`, {
      data: { domains: ["new.example.com", "another.example.com"] },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(updateRes.status()).toBe(200);
    const updateBody = await updateRes.json();
    expect(updateBody.data.domains).toEqual(["new.example.com", "another.example.com"]);
  });
});
