import { test, expect } from "@playwright/test";

const ADMIN_URL = process.env.ADMIN_PORTAL_URL || "http://localhost:3001";

async function navigateToTenants(page) {
  await page.goto(`${ADMIN_URL}/tenants`, { waitUntil: "load", timeout: 15000 });
  try {
    await page.waitForURL("**/tenants", { timeout: 5000 });
  } catch {
    // page may already be at /tenants
  }
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForSelector("h1", { timeout: 15000 });
}

async function openCreateModal(page) {
  await page.getByRole("button", { name: /add tenant/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole("dialog")).toContainText("Create Tenant");
}

async function openEditModal(page, tenantName) {
  const row = page.locator(`text=${tenantName}`).first();
  await expect(row).toBeVisible({ timeout: 5000 });
  await row.locator("xpath=ancestor::tr").first().getByTitle("Edit").click();
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole("dialog")).toContainText("Edit Tenant");
}

async function clickDelete(page, tenantName) {
  const row = page.locator(`text=${tenantName}`).first();
  await expect(row).toBeVisible({ timeout: 5000 });
  await row.locator("xpath=ancestor::tr").first().getByTitle("Delete").click();
}

async function closeModal(page) {
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /cancel/i }).click();
  await expect(dialog).not.toBeVisible({ timeout: 5000 });
}

test.describe("Tenant Management CRUD - UI Tests (Phase 3)", () => {
  test("TC-TN-01: Page loads and displays tenant list", async ({ page }) => {
    await navigateToTenants(page);
    await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("h1")).toContainText("Tenant Management");
    const searchBar = page.getByPlaceholder(/search tenants/i);
    await expect(searchBar).toBeVisible({ timeout: 5000 });
  });

  test("TC-TN-02: Create tenant modal opens with empty form", async ({ page }) => {
    await navigateToTenants(page);
    await openCreateModal(page);
    await expect(page.getByRole("dialog").getByLabel(/name/i)).toHaveValue("");
    await closeModal(page);
  });

  test("TC-TN-03: Create tenant via UI and verify in list", async ({ page }) => {
    const tenantName = `UI Tenant ${Date.now()}`;

    await navigateToTenants(page);
    await openCreateModal(page);
    await page.getByRole("dialog").getByLabel(/name/i).fill(tenantName);
    await page.getByRole("dialog").getByLabel(/domains/i).fill("ui-create.example.com");
    await page.getByRole("dialog").getByRole("button", { name: /create tenant/i }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    await expect(page.getByText(tenantName)).toBeVisible({ timeout: 5000 });
  });

  test("TC-TN-04: Create tenant validation - empty name shows error", async ({ page }) => {
    await navigateToTenants(page);
    await openCreateModal(page);
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/domains/i).fill("example.com");
    await dialog.getByRole("button", { name: /create tenant/i }).click();
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText(/name is required/i)).toBeVisible({ timeout: 5000 });
    await closeModal(page);
  });

  test("TC-TN-05: Edit tenant modal pre-fills current data", async ({ page }) => {
    const tenantName = `Edit Prep ${Date.now()}`;

    await navigateToTenants(page);
    await openCreateModal(page);
    await page.getByRole("dialog").getByLabel(/name/i).fill(tenantName);
    await page.getByRole("dialog").getByLabel(/domains/i).fill("prefill.example.com");
    await page.getByRole("dialog").getByRole("button", { name: /create tenant/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);

    await openEditModal(page, tenantName);
    const nameInput = page.getByRole("dialog").getByLabel(/name/i);
    await expect(nameInput).toHaveValue(tenantName);
    await closeModal(page);
  });

  test("TC-TN-06: Update tenant name via UI", async ({ page }) => {
    const tenantName = `Update Target ${Date.now()}`;
    const updatedName = `${tenantName} - Updated`;

    await navigateToTenants(page);
    await openCreateModal(page);
    await page.getByRole("dialog").getByLabel(/name/i).fill(tenantName);
    await page.getByRole("dialog").getByLabel(/domains/i).fill("update.example.com");
    await page.getByRole("dialog").getByRole("button", { name: /create tenant/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);

    await openEditModal(page, tenantName);
    await page.getByRole("dialog").getByLabel(/name/i).fill(updatedName);
    await page.getByRole("dialog").getByRole("button", { name: /update tenant/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);
    await expect(page.getByText(updatedName)).toBeVisible({ timeout: 5000 });
  });

  test("TC-TN-07: Delete tenant via UI confirmation dialog", async ({ page }) => {
    const tenantName = `UI Delete ${Date.now()}`;

    await navigateToTenants(page);
    await openCreateModal(page);
    await page.getByRole("dialog").getByLabel(/name/i).fill(tenantName);
    await page.getByRole("dialog").getByLabel(/domains/i).fill("uidelete.example.com");
    await page.getByRole("dialog").getByRole("button", { name: /create tenant/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);

    await clickDelete(page, tenantName);
    const confirmDialog = page.getByRole("dialog").filter({ hasText: "Delete Tenant" });
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });
    await expect(confirmDialog).toContainText(tenantName);
    await confirmDialog.getByRole("button", { name: /delete/i }).click();
    await expect(confirmDialog).not.toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);
    await expect(page.getByText(tenantName)).not.toBeVisible();
  });

  test("TC-TN-08: Cancel delete keeps tenant in list", async ({ page }) => {
    const tenantName = `Cancel Delete ${Date.now()}`;

    await navigateToTenants(page);
    await openCreateModal(page);
    await page.getByRole("dialog").getByLabel(/name/i).fill(tenantName);
    await page.getByRole("dialog").getByLabel(/domains/i).fill("cancel.example.com");
    await page.getByRole("dialog").getByRole("button", { name: /create tenant/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);

    await clickDelete(page, tenantName);
    const confirmDialog = page.getByRole("dialog").filter({ hasText: "Delete Tenant" });
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });
    await confirmDialog.getByRole("button", { name: /cancel/i }).click();
    await expect(confirmDialog).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(tenantName)).toBeVisible({ timeout: 5000 });
  });

  test("TC-TN-09: Search filters tenant list", async ({ page }) => {
    await navigateToTenants(page);
    const search = page.getByPlaceholder(/search tenants/i);
    await search.fill("UI Tenant");
    const table = page.locator("table");
    await expect(table).toBeVisible({ timeout: 5000 });
  });
});
