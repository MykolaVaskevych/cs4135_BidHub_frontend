import { test, expect } from '@playwright/test';
import { setupAuthRoutes, setupAuctionListRoutes, setupCatalogueRoutes } from './helpers/mock-routes';

test.describe('Authentication', () => {
  test('login page renders required fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /^login$/i })).toBeVisible();
  });

  test('valid login redirects to auctions', async ({ page }) => {
    await setupAuthRoutes(page);
    await setupAuctionListRoutes(page, []);
    await setupCatalogueRoutes(page);
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill('buyer1@bidhub.local');
    await page.getByPlaceholder(/password/i).fill('Buyer1Pass!');
    await page.getByRole('button', { name: /^login$/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('wrong password shows error', async ({ page }) => {
    await setupAuthRoutes(page);
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill('buyer1@bidhub.local');
    await page.getByPlaceholder(/password/i).fill('wrong');
    await page.getByRole('button', { name: /^login$/i }).click();
    await expect(page.locator('p[style*="red"]')).toContainText('Invalid credentials');
  });

  test('login with empty email blocked by HTML5 validation', async ({ page }) => {
    let networkCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/api/auth/login')) networkCalled = true;
    });
    await page.goto('/login');
    await page.getByPlaceholder(/password/i).fill('somepass');
    await page.getByRole('button', { name: /^login$/i }).click();
    expect(networkCalled).toBe(false);
  });

  test('register toggle shows extra fields', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /^register$/i }).click();
    await expect(page.getByPlaceholder(/first name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/last name/i)).toBeVisible();
    await expect(page.locator('select')).toBeVisible();
  });

  test('register: password hint shown in register mode', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /^register$/i }).click();
    await expect(page.getByText(/min 8 chars/i)).toBeVisible();
  });

  test('register new buyer redirects to home', async ({ page }) => {
    await setupAuthRoutes(page);
    await setupAuctionListRoutes(page, []);
    await setupCatalogueRoutes(page);
    await page.goto('/login');
    await page.getByRole('button', { name: /^register$/i }).click();
    await page.getByPlaceholder(/email/i).fill('newuser@test.com');
    await page.getByPlaceholder(/password/i).fill('NewPass1!');
    await page.getByPlaceholder(/first name/i).fill('New');
    await page.getByPlaceholder(/last name/i).fill('User');
    await page.getByRole('button', { name: /^register$/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('register with taken email shows error', async ({ page }) => {
    await setupAuthRoutes(page);
    await page.goto('/login');
    await page.getByRole('button', { name: /^register$/i }).click();
    await page.getByPlaceholder(/email/i).fill('taken@bidhub.local');
    await page.getByPlaceholder(/password/i).fill('Pass1!aaa');
    await page.getByPlaceholder(/first name/i).fill('Test');
    await page.getByPlaceholder(/last name/i).fill('User');
    await page.getByRole('button', { name: /^register$/i }).click();
    await expect(page.locator('p[style*="red"]')).toContainText('Email already in use');
  });

  test('unauthenticated access to protected route redirects to /login', async ({ page }) => {
    await page.goto('/auctions');
    await expect(page).toHaveURL(/\/login/);
  });

  test('logout clears session and redirects to /login', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'fake-token');
      localStorage.setItem('user', JSON.stringify({ userId: 'u-buyer-1', email: 'buyer1@bidhub.local', role: 'BUYER' }));
    });
    await setupAuctionListRoutes(page, []);
    await setupCatalogueRoutes(page);
    await page.goto('/');
    await page.getByRole('button', { name: /logout/i }).click();
    await expect(page).toHaveURL(/\/login/);
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  test('401 response mid-session redirects to /login', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'expired-token');
      localStorage.setItem('user', JSON.stringify({ userId: 'u-buyer-1', email: 'buyer1@bidhub.local', role: 'BUYER' }));
    });
    await page.route('**/api/accounts/me', (route) =>
      route.fulfill({ status: 401, json: { message: 'Unauthorized' } }),
    );
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });
});
