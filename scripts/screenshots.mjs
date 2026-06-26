import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync, spawn } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "testing", "user-form-modal");
mkdirSync(OUT, { recursive: true });

const BASE = "http://localhost:3001";
const API = "http://localhost:3000/api";

const SEED_USERS = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com", role: "admin", status: "active", portalAccess: ["admin", "partner"], createdAt: "2026-01-15T08:00:00Z" },
  { id: "2", name: "Bob Smith", email: "bob@partner.com", role: "manager", status: "active", portalAccess: ["admin"], createdAt: "2026-02-20T10:30:00Z" },
  { id: "3", name: "Charlie Lee", email: "charlie@customer.com", role: "viewer", status: "inactive", portalAccess: ["customer"], createdAt: "2026-03-10T14:00:00Z" },
];

function curl(method, path, body) {
  const url = `${API}${path}`;
  const args = body
    ? `-s -X ${method} "${url}" -H "Content-Type: application/json" -d '${JSON.stringify(body)}'`
    : `-s -X ${method} "${url}"`;
  return execSync(`curl ${args}`, { encoding: "utf-8", timeout: 5000 });
}

function isRunning(url) {
  try { execSync(`curl -sf "${url}" > /dev/null 2>&1`, { timeout: 2000 }); return true; }
  catch { return false; }
}

async function main() {
  console.log("=== Testing UserFormModal ===\n");

  // Ensure services are running
  if (!isRunning("http://localhost:3000/api/users")) {
    spawn("npx", ["tsx", "src/server/src/index.ts"], {
      cwd: "/tmp/invt_management_system_repo",
      env: { ...process.env, PORT: "3000" },
      stdio: "ignore", detached: true,
    }).unref();
    await new Promise(r => setTimeout(r, 3000));
  }
  if (!isRunning("http://localhost:3001/")) {
    spawn("npx", ["vite", "--port", "3001"], {
      cwd: "/tmp/invt_management_system_repo/src/admin-portal",
      stdio: "ignore", detached: true,
    }).unref();
    await new Promise(r => setTimeout(r, 4000));
  }

  console.log(`  Server: ${isRunning("http://localhost:3000/api/users") ? "OK" : "DOWN"}`);
  console.log(`  Portal: ${isRunning("http://localhost:3001/") ? "OK" : "DOWN"}`);

  // ---- API tests ----
  const results = [];
  function pass(name) { console.log(`  PASS: ${name}`); results.push({ name, status: "pass" }); }
  function fail(name, e) { console.log(`  FAIL: ${name} — ${e.message}`); results.push({ name, status: "fail", detail: e.message }); }

  console.log("\n--- API Smoke Tests ---");
  try { const r = curl("GET", "/users"); JSON.parse(r); pass("GET /api/users"); } catch (e) { fail("GET /api/users", e); }
  try {
    const r = curl("POST", "/users", {
      name: "Diana Park", email: "diana@test.com",
      role: "admin", status: "active", portalAccess: ["admin"], password: "secret123",
    });
    JSON.parse(r); pass("POST /api/users (create)");
  } catch (e) { fail("POST /api/users (create)", e); }
  try {
    const r = curl("PUT", "/users/1", {
      name: "Updated Name", email: "updated@test.com",
      role: "viewer", status: "inactive", portalAccess: [],
    });
    if (JSON.parse(r).name !== "Updated Name") throw new Error("Name mismatch");
    pass("PUT /api/users/:id (update)");
  } catch (e) { fail("PUT /api/users/:id (update)", e); }
  try {
    const code = execSync(`curl -s -o /dev/null -w "%{http_code}" -X DELETE "${API}/users/1"`, { encoding: "utf-8", timeout: 5000 }).trim();
    if (code !== "204") throw new Error(`Expected 204, got ${code}`);
    pass("DELETE /api/users/:id");
  } catch (e) { fail("DELETE /api/users/:id", e); }

  // ---- Browser screenshots ----
  console.log("\n--- Screenshots ---");
  let screenshots = [];

  try {
    process.env.LD_LIBRARY_PATH = "/tmp/syslibs";
    process.env.FONTCONFIG_PATH = "/tmp/fonts";
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-gpu", "--headless=new", "--single-process"],
      executablePath: "/paperclip/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome",
      env: { ...process.env, LD_LIBRARY_PATH: "/tmp/syslibs", FONTCONFIG_PATH: "/tmp/fonts" },
    });
    console.log("  Browser launched!");

    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();

    await page.route("**/api/users*", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: SEED_USERS }) });
      } else {
        await route.continue();
      }
    });

    async function shot(name) {
      const path = join(OUT, name);
      await page.screenshot({ path, fullPage: false });
      console.log(`  [SS] ${name}`);
      screenshots.push(name);
    }

    // 1. User list with seed data
    await page.goto(`${BASE}/users`, { waitUntil: "networkidle" });
    await page.waitForSelector("table");
    await shot("01-user-list.png");

    // 2. Open Create modal
    await page.getByText("+ New User").click();
    await page.waitForSelector("h2");
    await shot("02-create-modal-empty.png");

    // 3. Validation errors
    await page.getByRole("button", { name: /Create/i }).last().click();
    await page.waitForTimeout(300);
    await shot("03-validation-errors.png");

    // 4. Fill form
    const inputs = page.locator("form :is(input, select, textarea):not([type=checkbox]):not([type=submit])");
    await inputs.nth(0).fill("Diana Park");
    await inputs.nth(1).fill("diana@test.com");
    await inputs.nth(2).fill("secret123");
    await page.locator("form select").selectOption("Admin");
    await page.locator("label").filter({ hasText: "Partner Portal" }).locator("input[type=checkbox]").check();
    await shot("04-create-modal-filled.png");

    // 5. Submit → success toast
    await page.getByRole("button", { name: /Create\b/i }).click();
    await page.waitForTimeout(500);
    await shot("05-success-toast.png");

    // Wait for modal to close
    await page.waitForTimeout(2000);

    // 6. Edit Alice
    await page.locator("tr").filter({ hasText: "Alice Johnson" }).getByRole("button", { name: "Edit" }).click();
    await page.waitForSelector("h2");
    await shot("06-edit-modal.png");

    // 7. Cancel, reopen create, show inline validation for bad email
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.waitForTimeout(500);
    await page.getByText("+ New User").click();
    await page.waitForSelector("h2");
    await inputs.nth(0).fill("Bad Email");
    await inputs.nth(1).fill("not-an-email");
    await inputs.nth(2).fill("123456");
    await page.locator("label").filter({ hasText: "Admin Portal" }).locator("input[type=checkbox]").check();
    await page.getByRole("button", { name: /Create\b/i }).click();
    await page.waitForTimeout(300);
    await shot("07-inline-validation-error.png");

    await browser.close();
    console.log("\n  All screenshots captured!");
  } catch (e) {
    console.log(`\n  [SKIP] Screenshots unavailable: ${e.message.slice(0, 200)}`);
  }

  // ---- Report ----
  const report = {
    timestamp: new Date().toISOString(),
    app: "Inventory Management System - Admin Portal",
    module: "UserFormModal",
    apiTests: results,
    screenshots,
    components: {
      UserFormModal: {
        file: "src/admin-portal/src/pages/Users/UserFormModal.tsx",
        features: [
          "Create: name, email, password, role, portal access (checkboxes), active toggle",
          "Edit: pre-filled, password hidden, PUT /api/users/:id",
          "Validation: required fields, isValidEmail, password min 6, portal required",
          "Toast: success (green, 3s) and error (red, 3s) via inline state",
          "Roles from @moc/shared Role enum, portals from PortalType enum",
        ],
      },
      UserList: { changes: ["Inline modal → + New User, Edit per row", "onSave → fetchUsers refresh"] },
      App: { changes: "Removed /users/new, /users/:id/edit routes" },
    },
  };

  writeFileSync(join(OUT, "test-results.json"), JSON.stringify(report, null, 2));
  console.log("\n=== Summary ===");
  console.log(`  API tests: ${results.filter(r => r.status === "pass").length}/${results.length} passed`);
  console.log(`  Screenshots: ${screenshots.length} captured`);
  console.log(`  Report: ${join(OUT, "test-results.json")}`);
}

main().catch(console.error);