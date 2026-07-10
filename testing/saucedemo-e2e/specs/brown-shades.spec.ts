import { test, expect } from "@playwright/test";
import {
  ShopifyHomePage,
  ShopifyCatalogPage,
  ShopifyProductPage,
} from "../pages";

test("browse Brown Shades and extract price on sauce-demo.myshopify.com", async ({ page }) => {
  const homePage = new ShopifyHomePage(page);
  const catalogPage = new ShopifyCatalogPage(page);
  const productPage = new ShopifyProductPage(page);

  await homePage.goto();
  await homePage.clickCatalog();

  await catalogPage.clickBrownShades();

  const price = await productPage.getPrice();

  console.log(`Brown Shades price: ${price}`);

  expect(price).toContain("£");

  await page.screenshot({
    path: "screenshots/brown-shades.png",
    fullPage: true,
  });
});
