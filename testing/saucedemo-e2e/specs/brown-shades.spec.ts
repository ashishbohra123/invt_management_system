import { test, expect } from "@playwright/test";

test("browse Brown Shades and extract price on sauce-demo.myshopify.com", async ({ page }) => {
  await page.goto("https://sauce-demo.myshopify.com/");

  await page.getByRole("link", { name: /catalog/i }).click();
  await page.waitForLoadState("networkidle");
  await page.locator("a").filter({ hasText: /brown shades/i }).first().click();
  await page.waitForURL(/products/i, { timeout: 5000 }).catch(() => {});
  await page.waitForLoadState("networkidle");

  const priceText = await page.locator('[itemprop="price"], .price, [class*="price"], .product__price').first().textContent({ timeout: 5000 }).catch(() => null);
  const price = priceText?.trim() ?? "";

  console.log(`Brown Shades price: ${price}`);

  expect(price).toContain("£");
});
