import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("loads and shows a headline", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("CTA button exists and links to /signup", async ({ page }) => {
    await page.goto("/");

    // Find any anchor that leads to /signup
    const ctaLink = page.locator('a[href="/signup"]').first();
    await expect(ctaLink).toBeVisible();
  });

  test("pricing link is visible", async ({ page }) => {
    await page.goto("/");

    // Accept either a nav link to /pricing or an anchor with text matching pricing
    const pricingLink = page
      .locator('a[href="/pricing"], a:has-text("Precio"), a:has-text("precio"), a:has-text("Planes"), a:has-text("planes")')
      .first();

    await expect(pricingLink).toBeVisible();
  });
});
