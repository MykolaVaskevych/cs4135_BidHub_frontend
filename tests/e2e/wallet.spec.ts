import { test, expect } from './helpers/fixtures';
import { setupWalletRoutes } from './helpers/mock-routes';

test.describe('Wallet', () => {
  test('balance displayed without currency suffix', async ({ page, asBuyer }) => {
    await setupWalletRoutes(page, 250);
    await page.goto('/wallet');
    await expect(page.getByText('€250')).toBeVisible();
    // must NOT show "EUR" next to the number
    await expect(page.getByText(/€250.*EUR/)).not.toBeVisible();
  });

  test('top up €10 shows success message', async ({ page, asBuyer }) => {
    await setupWalletRoutes(page, 100);
    await page.goto('/wallet');
    await page.getByRole('button', { name: /\+ €10/i }).click();
    await expect(page.getByText('€10 added to your wallet.')).toBeVisible();
  });

  test('top up €50 shows correct message', async ({ page, asBuyer }) => {
    await setupWalletRoutes(page, 100);
    await page.goto('/wallet');
    await page.getByRole('button', { name: /\+ €50/i }).click();
    await expect(page.getByText('€50 added to your wallet.')).toBeVisible();
  });

  test('transaction history table renders rows', async ({ page, asBuyer }) => {
    await setupWalletRoutes(page, 100);
    await page.goto('/wallet');
    await expect(page.getByRole('table')).toBeVisible();
    // mock returns 3 transactions
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(3);
  });

  test('positive transaction shows +€ format', async ({ page, asBuyer }) => {
    await setupWalletRoutes(page, 100);
    await page.goto('/wallet');
    await expect(page.getByText('+€50')).toBeVisible();
  });

  test('negative transaction shows −€ format (sign before symbol)', async ({ page, asBuyer }) => {
    await setupWalletRoutes(page, 100);
    await page.goto('/wallet');
    // should be "-€20" not "€-20"
    await expect(page.getByText('-€20')).toBeVisible();
    await expect(page.getByText('€-20')).not.toBeVisible();
  });

  test('empty transaction history shows placeholder text', async ({ page, asBuyer }) => {
    await page.route('**/api/payments/wallet', (route) =>
      route.fulfill({ json: { balance: 0, currency: 'EUR' } }),
    );
    await page.route('**/api/payments/transactions', (route) =>
      route.fulfill({ json: [] }),
    );
    await page.goto('/wallet');
    await expect(page.getByText('No transactions yet.')).toBeVisible();
  });
});
