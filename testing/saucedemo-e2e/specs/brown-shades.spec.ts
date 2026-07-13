import { test, expect } from "@playwright/test";

test("browse Brown Shades and extract price on sauce-demo.myshopify.com", async ({ page }) => {
  await page.goto("https://sauce-demo.myshopify.com/");

  await page.getByRole("link", { name: /catalog/i }).click();

  await page.getByRole("link", { name: /brown shades/i }).click();

  const priceText = await page.locator('[class*="priceval"]').first().textContent();
  const price = priceText?.trim() ?? "";

  console.log(`Brown Shades price: ${price}`);

  expect(price).toContain("£");

  await page.screenshot({
    path: "screenshots/brown-shades.png",
    fullPage: true,
  });
});
