import { test, expect } from './helpers/fixtures';
import { setupAdminRoutes, setupAuctionListRoutes } from './helpers/mock-routes';

test.describe('Admin', () => {
  test('non-admin cannot access /admin (redirected)', async ({ page, asBuyer }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/$/);
  });

  test.describe('as admin', () => {
    test('dashboard tab loads summary metrics', async ({ page, asAdmin }) => {
      await setupAdminRoutes(page);
      await page.goto('/admin');
      await expect(page.getByText('Total Users')).toBeVisible();
      await expect(page.getByText('42')).toBeVisible();
      await expect(page.getByText('7')).toBeVisible(); // active auctions
    });

    test('users tab shows user rows', async ({ page, asAdmin }) => {
      await setupAdminRoutes(page);
      await page.goto('/admin');
      await page.getByRole('button', { name: /^users$/i }).click();
      await expect(page.getByText('buyer1@bidhub.local')).toBeVisible();
      await expect(page.getByText('buyer2@bidhub.local')).toBeVisible();
    });

    test('active user has Suspend and Ban buttons', async ({ page, asAdmin }) => {
      await setupAdminRoutes(page);
      await page.goto('/admin');
      await page.getByRole('button', { name: /^users$/i }).click();
      const activeRow = page.locator('tr').filter({ hasText: 'ACTIVE' });
      await expect(activeRow.getByRole('button', { name: /suspend/i })).toBeVisible();
      await expect(activeRow.getByRole('button', { name: /^ban$/i })).toBeVisible();
    });

    test('ban user shows success message', async ({ page, asAdmin }) => {
      await setupAdminRoutes(page);
      await page.goto('/admin');
      await page.getByRole('button', { name: /^users$/i }).click();
      const activeRow = page.locator('tr').filter({ hasText: 'ACTIVE' });
      await activeRow.getByRole('button', { name: /^ban$/i }).click();
      await expect(page.getByText(/successfully ban/i)).toBeVisible();
    });

    test('suspended user has Reactivate button', async ({ page, asAdmin }) => {
      await setupAdminRoutes(page);
      await page.goto('/admin');
      await page.getByRole('button', { name: /^users$/i }).click();
      const suspendedRow = page.locator('tr').filter({ hasText: 'SUSPENDED' });
      await expect(suspendedRow.getByRole('button', { name: /reactivate/i })).toBeVisible();
    });

    test('reactivate user shows success message', async ({ page, asAdmin }) => {
      await setupAdminRoutes(page);
      await page.goto('/admin');
      await page.getByRole('button', { name: /^users$/i }).click();
      const suspendedRow = page.locator('tr').filter({ hasText: 'SUSPENDED' });
      await suspendedRow.getByRole('button', { name: /reactivate/i }).click();
      await expect(page.getByText(/successfully reactivated/i)).toBeVisible();
    });

    test('categories tab shows category list', async ({ page, asAdmin }) => {
      await setupAdminRoutes(page);
      await page.goto('/admin');
      await page.getByRole('button', { name: /categories/i }).click();
      await expect(page.getByText('Electronics')).toBeVisible();
      await expect(page.getByText('Books')).toBeVisible();
    });

    test('reports tab shows report rows', async ({ page, asAdmin }) => {
      await setupAdminRoutes(page);
      await page.goto('/admin');
      await page.getByRole('button', { name: /reports/i }).click();
      await expect(page.locator('td').filter({ hasText: /^Spam$/ })).toBeVisible();
      await expect(page.locator('td').filter({ hasText: /^PENDING$/ })).toBeVisible();
    });

    test('auctions tab shows auction rows', async ({ page, asAdmin }) => {
      await setupAdminRoutes(page);
      await setupAuctionListRoutes(page);
      await page.goto('/admin');
      await page.getByRole('button', { name: /auctions/i }).click();
      await expect(page.locator('tbody tr').first()).toBeVisible();
    });
  });
});
