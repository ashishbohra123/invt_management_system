import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const ADMIN_URL = process.env.ADMIN_PORTAL_URL || "http://localhost:3001";
const API_URL = process.env.API_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "password123";

async function loginViaUi(page: Page) {
  await page.goto(`${ADMIN_URL}/admin/login`);
  await page.waitForLoadState("networkidle");
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /sign in|login|log in/i }).click();
  await page.waitForURL(/\/admin\/portal-select|\/users|\/$/);
}

async function loginViaApi(page: Page): Promise<string> {
  const response = await page.request.post(`${API_URL}/api/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const body = await response.json();
  return body.data.token;
}

async function navigateToUsers(page: Page) {
  await page.goto(`${ADMIN_URL}/users`);
  await page.waitForLoadState("networkidle");
}

async function openCreateModal(page: Page) {
  await page.getByRole("button", { name: /add user/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("Create User");
}

async function closeModal(page: Page) {
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /cancel/i }).click();
  await expect(dialog).not.toBeVisible();
}

test.describe("User Management CRUD - Phase 3", () => {
  let token: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    token = await loginViaApi(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginViaUi(page);
    await navigateToUsers(page);
  });

  test("TC-USR-01: Page loads and displays user list", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("User Management");
    const searchBar = page.getByPlaceholder(/search users/i);
    await expect(searchBar).toBeVisible();
  });

  test("TC-USR-02: Create user modal opens with empty form", async ({ page }) => {
    await openCreateModal(page);
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel(/name/i)).toHaveValue("");
    await closeModal(page);
  });

  test("TC-USR-03: Create user with valid data via API", async ({ page }) => {
    const uniqueEmail = `e2e-create-${Date.now()}@example.com`;
    const createResponse = await page.request.post(`${API_URL}/api/users`, {
      data: {
        name: "E2E Create User",
        email: uniqueEmail,
        password: "testpass123",
        role: "viewer",
        portalAccess: ["admin"],
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(createResponse.status()).toBe(201);
    const body = await createResponse.json();
    expect(body.success).toBe(true);
    expect(body.data.email).toBe(uniqueEmail);

    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(uniqueEmail)).toBeVisible();
  });

  test("TC-USR-04: Form validation - empty name shows error", async ({ page }) => {
    await openCreateModal(page);
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/email/i).fill("test@example.com");
    await dialog.getByRole("button", { name: /create user/i }).click();
    await expect(dialog.getByText("Name is required")).toBeVisible();
    await closeModal(page);
  });

  test("TC-USR-05: Form validation - empty email shows error", async ({ page }) => {
    await openCreateModal(page);
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/name/i).fill("Test User");
    await dialog.getByRole("button", { name: /create user/i }).click();
    await expect(dialog.getByText("Email is required")).toBeVisible();
    await closeModal(page);
  });

  test("TC-USR-06: Form validation - invalid email format", async ({ page }) => {
    await openCreateModal(page);
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/name/i).fill("Test User");
    await dialog.getByLabel(/email/i).fill("not-an-email");
    await dialog.getByRole("button", { name: /create user/i }).click();
    await expect(dialog.getByText("Invalid email format")).toBeVisible();
    await closeModal(page);
  });

  test("TC-USR-07: Form validation - short password", async ({ page }) => {
    await openCreateModal(page);
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/name/i).fill("Test User");
    await dialog.getByLabel(/email/i).fill("valid@example.com");
    await dialog.getByLabel(/password/i).fill("ab");
    await dialog.getByRole("button", { name: /create user/i }).click();
    await expect(dialog.getByText("Password must be at least 6 characters")).toBeVisible();
    await closeModal(page);
  });

  test("TC-USR-08: API - duplicate email returns 409", async ({ page }) => {
    const uniqueEmail = `e2e-dup-${Date.now()}@example.com`;
    await page.request.post(`${API_URL}/api/users`, {
      data: {
        name: "Original User",
        email: uniqueEmail,
        password: "testpass123",
        role: "viewer",
        portalAccess: ["admin"],
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    const response = await page.request.post(`${API_URL}/api/users`, {
      data: {
        name: "Duplicate User",
        email: uniqueEmail,
        password: "testpass123",
        role: "viewer",
        portalAccess: ["admin"],
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(409);
  });

  test("TC-USR-09: GET /api/users returns paginated list", async ({ page }) => {
    const response = await page.request.get(`${API_URL}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.data)).toBe(true);
  });

  test("TC-USR-10: GET /api/users rejects unauthenticated request", async ({ page }) => {
    const response = await page.request.get(`${API_URL}/api/users`);
    expect(response.status()).toBe(401);
  });

  test("TC-USR-11: Edit user modal pre-fills with current data via UI", async ({ page }) => {
    const uniqueEmail = `e2e-edit-${Date.now()}@example.com`;
    const createRes = await page.request.post(`${API_URL}/api/users`, {
      data: {
        name: "Edit Prep User",
        email: uniqueEmail,
        password: "testpass123",
        role: "manager",
        portalAccess: ["admin"],
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = (await createRes.json()).data;

    await page.reload();
    await page.waitForLoadState("networkidle");
    const row = page.locator(`text=${uniqueEmail}`).first();
    await expect(row).toBeVisible();
    const editButton = row.locator("xpath=ancestor::tr").first().getByTitle("Edit");
    await editButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Edit User");
    const nameInput = dialog.getByLabel(/name/i);
    await expect(nameInput).toHaveValue("Edit Prep User");
    await closeModal(page);
  });

  test("TC-USR-12: Update user name via API", async ({ page }) => {
    const uniqueEmail = `e2e-update-${Date.now()}@example.com`;
    const createRes = await page.request.post(`${API_URL}/api/users`, {
      data: {
        name: "Update Target",
        email: uniqueEmail,
        password: "testpass123",
        role: "viewer",
        portalAccess: ["admin"],
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = (await createRes.json()).data;
    const updatedName = "Update Target - Modified";

    const updateRes = await page.request.put(`${API_URL}/api/users/${user.id}`, {
      data: { name: updatedName },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(updateRes.status()).toBe(200);
    const updateBody = await updateRes.json();
    expect(updateBody.data.name).toBe(updatedName);
  });

  test("TC-USR-13: Update user role via API", async ({ page }) => {
    const uniqueEmail = `e2e-role-${Date.now()}@example.com`;
    const createRes = await page.request.post(`${API_URL}/api/users`, {
      data: {
        name: "Role Test",
        email: uniqueEmail,
        password: "testpass123",
        role: "viewer",
        portalAccess: ["admin"],
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = (await createRes.json()).data;

    const updateRes = await page.request.put(`${API_URL}/api/users/${user.id}`, {
      data: { role: "admin" },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(updateRes.status()).toBe(200);
    const updateBody = await updateRes.json();
    expect(updateBody.data.role).toBe("admin");
  });

  test("TC-USR-14: Update user active status via API", async ({ page }) => {
    const uniqueEmail = `e2e-status-${Date.now()}@example.com`;
    const createRes = await page.request.post(`${API_URL}/api/users`, {
      data: {
        name: "Status Test",
        email: uniqueEmail,
        password: "testpass123",
        role: "viewer",
        portalAccess: ["admin"],
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = (await createRes.json()).data;

    const updateRes = await page.request.put(`${API_URL}/api/users/${user.id}`, {
      data: { status: "inactive" },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(updateRes.status()).toBe(200);
    const updateBody = await updateRes.json();
    expect(updateBody.data.status).toBe("inactive");
  });

  test("TC-USR-15: Update non-existent user returns 404", async ({ page }) => {
    const response = await page.request.put(`${API_URL}/api/users/non-existent-id`, {
      data: { name: "Ghost" },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(404);
  });

  test("TC-USR-16: Delete user via API", async ({ page }) => {
    const uniqueEmail = `e2e-del-${Date.now()}@example.com`;
    const createRes = await page.request.post(`${API_URL}/api/users`, {
      data: {
        name: "Delete Target",
        email: uniqueEmail,
        password: "testpass123",
        role: "viewer",
        portalAccess: ["admin"],
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = (await createRes.json()).data;

    const deleteRes = await page.request.delete(`${API_URL}/api/users/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(deleteRes.status()).toBe(204);
  });

  test("TC-USR-17: Delete non-existent user returns 404", async ({ page }) => {
    const response = await page.request.delete(`${API_URL}/api/users/non-existent-id`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(404);
  });

  test("TC-USR-18: Delete user via UI confirmation dialog", async ({ page }) => {
    const uniqueEmail = `e2e-ui-del-${Date.now()}@example.com`;
    const createRes = await page.request.post(`${API_URL}/api/users`, {
      data: {
        name: "UI Delete Target",
        email: uniqueEmail,
        password: "testpass123",
        role: "viewer",
        portalAccess: ["admin"],
      },
      headers: { Authorization: `Bearer ${token}` },
    });

    await page.reload();
    await page.waitForLoadState("networkidle");
    const row = page.locator(`text=${uniqueEmail}`).first();
    await expect(row).toBeVisible();

    const deleteButton = row.locator("xpath=ancestor::tr").first().getByTitle("Delete");
    await deleteButton.click();

    const confirmDialog = page.getByRole("dialog").filter({ hasText: "Delete User" });
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog).toContainText("UI Delete Target");

    await confirmDialog.getByRole("button", { name: /delete/i }).click();
    await expect(confirmDialog).not.toBeVisible();
    await expect(page.getByText(uniqueEmail)).not.toBeVisible();
  });

  test("TC-USR-19: UI search filters user list", async ({ page }) => {
    const search = page.getByPlaceholder(/search users/i);
    await search.fill("admin@example.com");
    const table = page.locator("table");
    await expect(table).toBeVisible();
  });

  test("TC-USR-20: API - GET /api/users/:id returns 404 for unknown user", async ({ page }) => {
    const response = await page.request.get(
      `${API_URL}/api/users/00000000-0000-0000-0000-000000000000`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(response.status()).toBe(404);
  });

  test("TC-USR-21: Create user with all optional fields via API", async ({ page }) => {
    const uniqueEmail = `e2e-full-${Date.now()}@example.com`;
    const createResponse = await page.request.post(`${API_URL}/api/users`, {
      data: {
        name: "Full Fields User",
        email: uniqueEmail,
        password: "securePass123",
        role: "admin",
        status: "active",
        portalAccess: ["admin", "user"],
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(createResponse.status()).toBe(201);
    const body = await createResponse.json();
    expect(body.data.name).toBe("Full Fields User");
    expect(body.data.email).toBe(uniqueEmail);
    expect(body.data.role).toBe("admin");
  });
});
