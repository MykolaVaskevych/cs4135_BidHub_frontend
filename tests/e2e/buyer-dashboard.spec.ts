import { test, expect } from './helpers/fixtures';
import { AUCTION_ID, BUYER_ID, BUYER2_ID } from './helpers/mock-routes';

const activeAuction = {
  auctionId: AUCTION_ID,
  listingId: 'llllllll-0000-0000-0000-000000000001',
  status: 'ACTIVE',
  currentPrice: { amount: 120, currency: 'EUR' },
  bidCount: 2,
  leadingBidderId: BUYER_ID,   // buyer is winning
  endTime: '2099-01-01T00:00:00Z',
};

const wonAuction = {
  auctionId: 'aaaaaaaa-0000-0000-0000-000000000002',
  listingId: 'llllllll-0000-0000-0000-000000000002',
  status: 'SOLD',
  currentPrice: { amount: 150, currency: 'EUR' },
  bidCount: 3,
  leadingBidderId: BUYER_ID,   // buyer won
  endTime: '2024-01-10T00:00:00Z',
};

const lostAuction = {
  auctionId: 'aaaaaaaa-0000-0000-0000-000000000003',
  listingId: 'llllllll-0000-0000-0000-000000000003',
  status: 'SOLD',
  currentPrice: { amount: 90, currency: 'EUR' },
  bidCount: 2,
  leadingBidderId: BUYER2_ID,  // someone else won
  endTime: '2024-01-05T00:00:00Z',
};

function setupDashboardRoutes(page: import('@playwright/test').Page, auctions: unknown[]) {
  return Promise.all([
    page.route('**/api/auctions/my-bids', (r) => r.fulfill({ json: auctions })),
    page.route('**/api/payments/wallet', (r) =>
      r.fulfill({ json: { balance: 250, currency: 'EUR' } }),
    ),
  ]);
}

test.describe('Buyer Dashboard', () => {
  test('active bids section shows rows', async ({ page, asBuyer }) => {
    await setupDashboardRoutes(page, [activeAuction]);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /active bids/i })).toBeVisible();
    await expect(page.locator('tbody tr').first()).toBeVisible();
  });

  test('winning label shown in green for leading bid', async ({ page, asBuyer }) => {
    await setupDashboardRoutes(page, [activeAuction]);
    await page.goto('/dashboard');
    const winningSpan = page.getByText('Winning');
    await expect(winningSpan).toBeVisible();
    const color = await winningSpan.evaluate((el) => getComputedStyle(el).color);
    // green in RGB
    expect(color).toContain('0, 128');
  });

  test('outbid label shown for non-leading active bid', async ({ page, asBuyer }) => {
    const outbidAuction = { ...activeAuction, leadingBidderId: BUYER2_ID };
    await setupDashboardRoutes(page, [outbidAuction]);
    await page.goto('/dashboard');
    await expect(page.getByText('Outbid')).toBeVisible();
  });

  test('won auctions section shows when buyer is winner', async ({ page, asBuyer }) => {
    await setupDashboardRoutes(page, [wonAuction]);
    await page.goto('/dashboard');
    await expect(page.getByText(/won auctions/i)).toBeVisible();
    await expect(page.locator('h3', { hasText: /won auctions/i }).locator('..').locator('tbody tr')).toBeVisible();
  });

  test('lost auction goes to Other section not Won', async ({ page, asBuyer }) => {
    await setupDashboardRoutes(page, [lostAuction]);
    await page.goto('/dashboard');
    await expect(page.getByText(/^won auctions \(0\)$/i)).toBeVisible();
    await expect(page.getByText(/other \(1\)/i)).toBeVisible();
  });

  test('wallet balance shown with manage link', async ({ page, asBuyer }) => {
    await setupDashboardRoutes(page, []);
    await page.goto('/dashboard');
    await expect(page.getByText('€250')).toBeVisible();
    await expect(page.getByRole('link', { name: /manage/i })).toBeVisible();
  });

  test('wallet manage link navigates to /wallet (SPA navigation)', async ({ page, asBuyer }) => {
    await setupDashboardRoutes(page, []);
    await page.route('**/api/payments/transactions', (r) => r.fulfill({ json: [] }));
    await page.goto('/dashboard');
    await page.getByRole('link', { name: /manage/i }).click();
    await expect(page).toHaveURL(/\/wallet/);
  });
});
