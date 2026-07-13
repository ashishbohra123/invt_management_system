import { test, expect } from "@playwright/test";

test.describe("SauceDemo Login", () => {
  test("should login successfully with standard_user", async ({ page }) => {
    await page.goto("/");

    await page.fill("#user-name", "standard_user");
    await page.fill("#password", "secret_sauce");
    await page.click("#login-button");

    await expect(page).toHaveURL(/.*inventory\.html/);
    await expect(page.locator(".title")).toHaveText("Products");
  });

  test("should show error for locked_out_user", async ({ page }) => {
    await page.goto("/");

    await page.fill("#user-name", "locked_out_user");
    await page.fill("#password", "secret_sauce");
    await page.click("#login-button");

    await expect(page.locator('[data-test="error"]')).toBeVisible();
    await expect(page.locator('[data-test="error"]')).toContainText(
      "Sorry, this user has been locked out."
    );
  });

  test("should show error with invalid credentials", async ({ page }) => {
    await page.goto("/");

    await page.fill("#user-name", "invalid_user");
    await page.fill("#password", "wrong_password");
    await page.click("#login-button");

    await expect(page.locator('[data-test="error"]')).toBeVisible();
    await expect(page.locator('[data-test="error"]')).toContainText(
      "Username and password do not match"
    );
  });
});
