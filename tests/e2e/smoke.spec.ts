import { test, expect } from "@playwright/test";

test("page loads with BidHub title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("BidHub");
});

test("unauthenticated user is redirected to /login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
});

test("login form has required fields", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByPlaceholder(/email/i)).toBeVisible();
  await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /^login$/i })).toBeVisible();
});

test("register toggle switches form mode", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /^register$/i }).click();
  await expect(page.getByPlaceholder(/first name/i)).toBeVisible();
});
