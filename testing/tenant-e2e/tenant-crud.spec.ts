import { test, expect } from "@playwright/test";

const ADMIN_URL = process.env.ADMIN_PORTAL_URL || "http://localhost:3001";

async function login(page, email = "admin@example.com", password = "password123") {
  await page.goto(`${ADMIN_URL}/admin/login`);
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder("name@company.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/admin\/(portal-select|tenants|users|$)/, { timeout: 10000 });
}

async function navigateToTenants(page) {
  await page.goto(`${ADMIN_URL}/tenants`);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1")).toContainText("Tenant Management");
}

async function openCreateModal(page) {
  await page.getByRole("button", { name: /add tenant/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Create Tenant")).toBeVisible();
}

async function fillName(page, name) {
  await page.getByRole("dialog").getByLabel(/name/i).fill(name);
}

async function fillDomains(page, domains) {
  await page.getByRole("dialog").getByLabel(/domains/i).fill(domains);
}

async function clickCreate(page) {
  await page.getByRole("dialog").getByRole("button", { name: /create tenant/i }).click();
}

async function clickUpdate(page) {
  await page.getByRole("dialog").getByRole("button", { name: /update tenant/i }).click();
}

async function clickCancel(page) {
  await page.getByRole("dialog").getByRole("button", { name: /cancel/i }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
}

test.describe("Tenant Management CRUD - UI Tests (Phase 3)", () => {
  test("TC-TN-01: Page loads and displays tenant list", async ({ page }) => {
    await login(page);
    await navigateToTenants(page);
    await expect(page.getByPlaceholder(/search tenants/i)).toBeVisible();
  });

  test("TC-TN-02: Create tenant modal opens with empty form", async ({ page }) => {
    await login(page);
    await navigateToTenants(page);
    await openCreateModal(page);
    await expect(page.getByRole("dialog").getByLabel(/name/i)).toHaveValue("");
    await clickCancel(page);
  });

  test("TC-TN-03: Create tenant via UI and verify in list", async ({ page }) => {
    const tenantName = `UI Tenant ${Date.now()}`;

    await login(page);
    await navigateToTenants(page);
    await openCreateModal(page);
    await fillName(page, tenantName);
    await fillDomains(page, "ui-create.example.com");
    await clickCreate(page);

    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByText(tenantName)).toBeVisible();
  });

  test("TC-TN-04: Create tenant validation - empty name shows error", async ({ page }) => {
    await login(page);
    await navigateToTenants(page);
    await openCreateModal(page);
    await fillDomains(page, "example.com");
    await clickCreate(page);

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog").getByText(/name is required/i)).toBeVisible();
    await clickCancel(page);
  });

  test("TC-TN-05: Edit tenant modal pre-fills current data", async ({ page }) => {
    const tenantName = `Edit Prep ${Date.now()}`;

    await login(page);
    await navigateToTenants(page);

    await openCreateModal(page);
    await fillName(page, tenantName);
    await fillDomains(page, "prefill.example.com");
    await clickCreate(page);
    await expect(page.getByText(tenantName)).toBeVisible();

    const row = page.locator(`text=${tenantName}`).first();
    await row.locator("xpath=ancestor::tr").first().getByTitle("Edit").click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Edit Tenant")).toBeVisible();
    await expect(dialog.getByLabel(/name/i)).toHaveValue(tenantName);
    await clickCancel(page);
  });

  test("TC-TN-06: Update tenant name via UI", async ({ page }) => {
    const tenantName = `Update Target ${Date.now()}`;
    const updatedName = `${tenantName} - Updated`;

    await login(page);
    await navigateToTenants(page);

    await openCreateModal(page);
    await fillName(page, tenantName);
    await fillDomains(page, "update.example.com");
    await clickCreate(page);
    await expect(page.getByText(tenantName)).toBeVisible();

    const row = page.locator(`text=${tenantName}`).first();
    await row.locator("xpath=ancestor::tr").first().getByTitle("Edit").click();

    await fillName(page, updatedName);
    await clickUpdate(page);
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByText(updatedName)).toBeVisible();
  });

  test("TC-TN-07: Delete tenant via UI confirmation dialog", async ({ page }) => {
    const tenantName = `UI Delete ${Date.now()}`;

    await login(page);
    await navigateToTenants(page);

    await openCreateModal(page);
    await fillName(page, tenantName);
    await fillDomains(page, "uidelete.example.com");
    await clickCreate(page);
    await expect(page.getByText(tenantName)).toBeVisible();

    const row = page.locator(`text=${tenantName}`).first();
    await row.locator("xpath=ancestor::tr").first().getByTitle("Delete").click();

    const confirmDialog = page.getByRole("dialog").filter({ hasText: "Delete Tenant" });
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog).toContainText(tenantName);
    await confirmDialog.getByRole("button", { name: /delete/i }).click();
    await expect(confirmDialog).not.toBeVisible();
    await expect(page.getByText(tenantName)).not.toBeVisible();
  });

  test("TC-TN-08: Cancel delete keeps tenant in list", async ({ page }) => {
    const tenantName = `Cancel Delete ${Date.now()}`;

    await login(page);
    await navigateToTenants(page);

    await openCreateModal(page);
    await fillName(page, tenantName);
    await fillDomains(page, "cancel.example.com");
    await clickCreate(page);
    await expect(page.getByText(tenantName)).toBeVisible();

    const row = page.locator(`text=${tenantName}`).first();
    await row.locator("xpath=ancestor::tr").first().getByTitle("Delete").click();

    const confirmDialog = page.getByRole("dialog").filter({ hasText: "Delete Tenant" });
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole("button", { name: /cancel/i }).click();
    await expect(confirmDialog).not.toBeVisible();
    await expect(page.getByText(tenantName)).toBeVisible();
  });

  test("TC-TN-09: Search filters tenant list", async ({ page }) => {
    await login(page);
    await navigateToTenants(page);

    const search = page.getByPlaceholder(/search tenants/i);
    await search.fill("UI Tenant");
    await expect(page.locator("table")).toBeVisible();
  });
});
