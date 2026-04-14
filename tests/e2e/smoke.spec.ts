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
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /login|sign in/i })).toBeVisible();
});

test("register toggle switches form mode", async ({ page }) => {
  await page.goto("/login");
  await page.getByText(/register|sign up|create account/i).first().click();
  await expect(page.getByLabel(/first.?name/i)).toBeVisible();
});
