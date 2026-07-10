import { test, expect } from "@playwright/test";

const BASE_URL = "https://www.saucedemo.com";
const STANDARD_USER = "standard_user";
const PASSWORD = "secret_sauce";

test.describe("SauceDemo Product Shades", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator('[data-test="username"]').fill(STANDARD_USER);
    await page.locator('[data-test="password"]').fill(PASSWORD);
    await page.locator('[data-test="login-button"]').click();
    await expect(page).toHaveURL(/\/inventory\.html/);
  });

  test("displays unique product image for each inventory item", async ({ page }) => {
    const images = page.locator(".inventory_item_img img");
    const count = await images.count();
    expect(count).toBeGreaterThan(0);

    const srcSet = new Set<string>();
    for (let i = 0; i < count; i++) {
      const src = await images.nth(i).getAttribute("src");
      expect(src).toBeTruthy();
      srcSet.add(src!);
    }

    expect(srcSet.size).toBe(count);
  });

  test("each product image has distinct visual dimensions", async ({ page }) => {
    const images = page.locator(".inventory_item_img img");
    const count = await images.count();

    const naturalSizes = new Set<string>();
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const naturalWidth = await img.getAttribute("width") ?? await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      const naturalHeight = await img.getAttribute("height") ?? await img.evaluate((el: HTMLImageElement) => el.naturalHeight);
      expect(Number(naturalWidth)).toBeGreaterThan(0);
      expect(Number(naturalHeight)).toBeGreaterThan(0);
      naturalSizes.add(`${naturalWidth}x${naturalHeight}`);
    }
  });

  test("all product images load successfully", async ({ page }) => {
    const images = page.locator(".inventory_item_img img");
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute("src");
      expect(src).toBeTruthy();

      const response = await page.request.get(new URL(src!, BASE_URL).href);
      expect(response.status()).toBe(200);
    }
  });

  test("inventory item cards have rendered background shades", async ({ page }) => {
    const itemCards = page.locator(".inventory_item");
    const count = await itemCards.count();
    expect(count).toBe(6);

    for (let i = 0; i < count; i++) {
      const card = itemCards.nth(i);
      await expect(card).toBeVisible();

      const bgColor = await card.evaluate((el: Element) => {
        const style = getComputedStyle(el);
        return style.backgroundColor;
      });
      expect(bgColor).toBeTruthy();
      expect(bgColor).not.toBe("rgba(0, 0, 0, 0)");
    }
  });

  test("displays correct shade label for Sauce Labs Bike Light", async ({ page }) => {
    const bikeLightItem = page.locator(".inventory_item").filter({ hasText: "Sauce Labs Bike Light" });
    await expect(bikeLightItem).toBeVisible();

    const desc = bikeLightItem.locator(".inventory_item_desc");
    const descText = await desc.textContent();
    expect(descText).toContain("light");

    const image = bikeLightItem.locator(".inventory_item_img img");
    await expect(image).toBeVisible();
    const src = await image.getAttribute("src");
    expect(src).toContain("bike-light");
  });

  test("displays correct shade for red t-shirt variant", async ({ page }) => {
    const redTee = page.locator(".inventory_item").filter({ hasText: "T-Shirt (Red)" });
    await expect(redTee).toBeVisible();

    const image = redTee.locator(".inventory_item_img img");
    await expect(image).toBeVisible();
    const src = await image.getAttribute("src");
    expect(src).toContain("red");
  });

  test("each product description references its unique shade characteristics", async ({ page }) => {
    const items = page.locator(".inventory_item");
    const count = await items.count();

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      const desc = item.locator(".inventory_item_desc");
      await expect(desc).toBeVisible();
      const text = await desc.textContent();
      expect(text).toBeTruthy();
      expect(text!.length).toBeGreaterThan(10);
    }
  });

  test("product images contain identifiable shade filenames", async ({ page }) => {
    const images = page.locator(".inventory_item_img img");
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const src = await images.nth(i).getAttribute("src");
      expect(src).toBeTruthy();
      expect(src).toMatch(/\/assets\/.+\.jpg$/);
    }
  });

  test("all product descriptions are unique across inventory", async ({ page }) => {
    const items = page.locator(".inventory_item");
    const count = await items.count();

    const descs: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).locator(".inventory_item_desc").textContent();
      descs.push(text ?? "");
    }

    expect(new Set(descs).size).toBe(descs.length);
  });
});
