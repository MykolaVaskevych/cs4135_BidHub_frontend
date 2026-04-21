import { test, expect } from './helpers/fixtures';
import { setupSellerRoutes, setupCatalogueRoutes } from './helpers/mock-routes';

test.describe('Seller', () => {
  test('create listing form renders', async ({ page, asSeller }) => {
    await setupCatalogueRoutes(page);
    await setupSellerRoutes(page);
    await page.goto('/seller');
    await expect(page.getByPlaceholder(/title/i)).toBeVisible();
    await expect(page.getByPlaceholder(/description/i)).toBeVisible();
    await expect(page.locator('select')).toBeVisible();
    await expect(page.getByRole('button', { name: /create listing/i })).toBeVisible();
  });

  test('create listing success proceeds to auction form', async ({ page, asSeller }) => {
    await setupCatalogueRoutes(page);
    await setupSellerRoutes(page);
    await page.goto('/seller');
    await page.getByPlaceholder(/title/i).fill('My Test Laptop');
    await page.getByPlaceholder(/description/i).fill('A great laptop');
    await page.locator('select').selectOption({ index: 1 });
    await page.getByRole('button', { name: /create listing/i }).click();
    await expect(page.getByText('Listing created!')).toBeVisible();
    await expect(page.getByText(/start auction for/i)).toBeVisible();
  });

  test('start auction shows success', async ({ page, asSeller }) => {
    await setupCatalogueRoutes(page);
    await setupSellerRoutes(page);
    await page.goto('/seller');
    // create listing first
    await page.getByPlaceholder(/title/i).fill('Laptop');
    await page.getByPlaceholder(/description/i).fill('Good laptop');
    await page.locator('select').selectOption({ index: 1 });
    await page.getByRole('button', { name: /create listing/i }).click();
    await expect(page.getByText(/start auction for/i)).toBeVisible();
    // fill auction form
    await page.getByPlaceholder(/starting price/i).fill('50');
    await page.getByPlaceholder(/reserve price/i).fill('80');
    await page.getByRole('button', { name: /1d/i }).click();
    await page.getByRole('button', { name: /start auction/i }).click();
    await expect(page.getByText('Auction started!')).toBeVisible();
  });

  test('reserve price below starting price shows validation error', async ({ page, asSeller }) => {
    await setupCatalogueRoutes(page);
    await setupSellerRoutes(page);
    await page.goto('/seller');
    await page.getByPlaceholder(/title/i).fill('Laptop');
    await page.getByPlaceholder(/description/i).fill('Good laptop');
    await page.locator('select').selectOption({ index: 1 });
    await page.getByRole('button', { name: /create listing/i }).click();
    await expect(page.getByText(/start auction for/i)).toBeVisible();
    await page.getByPlaceholder(/starting price/i).fill('100');
    // remove HTML5 min so browser doesn't block submission
    await page.evaluate(() => {
      document.querySelectorAll('input[type="number"]').forEach((i) => i.removeAttribute('min'));
    });
    await page.getByPlaceholder(/reserve price/i).fill('50');
    await page.getByRole('button', { name: /1d/i }).click();
    await page.getByRole('button', { name: /start auction/i }).click();
    await expect(page.getByText(/reserve price must be/i)).toBeVisible();
  });

  test('buy-now price at or below starting price shows validation error', async ({ page, asSeller }) => {
    await setupCatalogueRoutes(page);
    await setupSellerRoutes(page);
    await page.goto('/seller');
    await page.getByPlaceholder(/title/i).fill('Laptop');
    await page.getByPlaceholder(/description/i).fill('Good laptop');
    await page.locator('select').selectOption({ index: 1 });
    await page.getByRole('button', { name: /create listing/i }).click();
    await expect(page.getByText(/start auction for/i)).toBeVisible();
    await page.getByPlaceholder(/starting price/i).fill('100');
    await page.getByPlaceholder(/reserve price/i).fill('100');
    // remove HTML5 min so browser doesn't block submission
    await page.evaluate(() => {
      document.querySelectorAll('input[type="number"]').forEach((i) => i.removeAttribute('min'));
    });
    await page.getByPlaceholder(/buy now price/i).fill('100'); // equal to starting, must be >
    await page.getByRole('button', { name: /1d/i }).click();
    await page.getByRole('button', { name: /start auction/i }).click();
    await expect(page.getByText(/buy now price must be/i)).toBeVisible();
  });

  test('my auctions table shows rows', async ({ page, asSeller }) => {
    await setupCatalogueRoutes(page);
    await setupSellerRoutes(page);
    await page.goto('/seller');
    await expect(page.getByText(/my auctions/i)).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(2);
  });

  test('edit button shown for ENDED auction', async ({ page, asSeller }) => {
    await setupCatalogueRoutes(page);
    await setupSellerRoutes(page);
    await page.goto('/seller');
    // row with status ENDED and bidCount 0 should have an Edit button
    const rows = page.locator('tbody tr');
    const endedRow = rows.filter({ hasText: 'ENDED' });
    await expect(endedRow.getByRole('button', { name: /edit/i })).toBeVisible();
  });

  test('edit button NOT shown for ACTIVE auction with bids', async ({ page, asSeller }) => {
    await setupCatalogueRoutes(page);
    await setupSellerRoutes(page);
    await page.goto('/seller');
    // row with status ACTIVE and bidCount 2 must NOT have an Edit button
    const activeRow = page.locator('tbody tr').filter({ hasText: 'ACTIVE' });
    await expect(activeRow.getByRole('button', { name: /edit/i })).not.toBeVisible();
  });
});
