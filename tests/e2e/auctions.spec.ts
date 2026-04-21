import { test, expect } from './helpers/fixtures';
import {
  setupAuctionListRoutes,
  setupAuctionDetailRoutes,
  setupAccountRoutes,
  setupCatalogueRoutes,
  baseAuction,
  AUCTION_ID,
  BUYER2_ID,
} from './helpers/mock-routes';

test.describe('Auctions list', () => {
  test('renders auction rows from mock', async ({ page, asBuyer }) => {
    await setupAuctionListRoutes(page);
    await setupCatalogueRoutes(page);
    await page.goto('/auctions');
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.getByText('Test Laptop')).toBeVisible();
  });

  test('shows placeholder when no auctions', async ({ page, asBuyer }) => {
    await setupAuctionListRoutes(page, []);
    await page.goto('/auctions');
    await expect(page.getByText('No active auctions found.')).toBeVisible();
  });

  test('auctions page inline search filters results', async ({ page, asBuyer }) => {
    let callCount = 0;
    await page.route('**/api/auctions/search**', async (route) => {
      callCount++;
      await route.fulfill({ json: callCount === 1 ? [baseAuction] : [] });
    });
    await page.route('**/api/auctions/listings/**', (r) =>
      r.fulfill({ json: { listingId: 'l', title: 'Test Laptop' } }),
    );
    await page.goto('/auctions');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await page.getByPlaceholder(/search auctions/i).fill('nomatch');
    await page.getByRole('button', { name: /^search$/i }).click();
    await expect(page.getByText('No active auctions found.')).toBeVisible();
  });
});

test.describe('Auction detail', () => {
  test('loads title, price, status and bid count', async ({ page, asBuyer }) => {
    await setupAuctionDetailRoutes(page);
    await setupAccountRoutes(page);
    await page.goto(`/auctions/${AUCTION_ID}`);
    await expect(page.getByText('Test Laptop')).toBeVisible();
    await expect(page.getByText('100')).toBeVisible();
    await expect(page.getByText('ACTIVE')).toBeVisible();
    await expect(page.getByText('2')).toBeVisible(); // bid count
  });

  test('time left countdown shown for ACTIVE auction', async ({ page, asBuyer }) => {
    await setupAuctionDetailRoutes(page);
    await setupAccountRoutes(page);
    await page.goto(`/auctions/${AUCTION_ID}`);
    await expect(page.getByText(/time left/i)).toBeVisible();
  });

  test('buy-now button visible when buyNowPrice present', async ({ page, asBuyer }) => {
    await setupAuctionDetailRoutes(page);
    await setupAccountRoutes(page, undefined, [
      { addressId: 'a1', addressLine1: '1 St', city: 'Dublin', county: 'Dublin', eircode: 'D01', isDefault: true },
    ]);
    await page.goto(`/auctions/${AUCTION_ID}`);
    await expect(page.getByRole('button', { name: /buy now/i })).toBeVisible();
  });

  test('buy-now button absent when no buyNowPrice', async ({ page, asBuyer }) => {
    await setupAuctionDetailRoutes(page, { buyNowPrice: null });
    await setupAccountRoutes(page, undefined, [
      { addressId: 'a1', addressLine1: '1 St', city: 'Dublin', county: 'Dublin', eircode: 'D01', isDefault: true },
    ]);
    await page.goto(`/auctions/${AUCTION_ID}`);
    await expect(page.getByRole('button', { name: /buy now/i })).not.toBeVisible();
  });

  test('place bid success shows confirmation', async ({ page, asBuyer }) => {
    await setupAuctionDetailRoutes(page, { bidCount: 0, leadingBidderId: null });
    await setupAccountRoutes(page, undefined, [
      { addressId: 'a1', addressLine1: '1 St', city: 'Dublin', county: 'Dublin', eircode: 'D01', isDefault: true },
    ]);
    await page.goto(`/auctions/${AUCTION_ID}`);
    const bidInput = page.getByPlaceholder(/min €/i);
    await expect(bidInput).toBeVisible();
    await bidInput.fill('150');
    await page.getByRole('button', { name: /place bid/i }).click();
    await expect(page.getByText('Bid placed successfully')).toBeVisible();
  });

  test('bid too low shows error', async ({ page, asBuyer }) => {
    await setupAuctionDetailRoutes(page);
    await setupAccountRoutes(page, undefined, [
      { addressId: 'a1', addressLine1: '1 St', city: 'Dublin', county: 'Dublin', eircode: 'D01', isDefault: true },
    ]);
    await page.goto(`/auctions/${AUCTION_ID}`);
    const bidInput = page.getByPlaceholder(/min €/i);
    await expect(bidInput).toBeVisible();
    // submit the form bypassing min attribute by directly posting low amount
    await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>('input[type="number"]');
      if (input) { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(input, '50'); input.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await bidInput.fill('50');
    await page.getByRole('button', { name: /place bid/i }).click();
    await expect(page.locator('p[style*="red"]')).toContainText('Bid amount must exceed current price');
  });

  test('bid blocked without address shows warning', async ({ page, asBuyer }) => {
    await setupAuctionDetailRoutes(page);
    await setupAccountRoutes(page, undefined, []);  // no addresses
    await page.goto(`/auctions/${AUCTION_ID}`);
    await expect(page.getByText(/you need a delivery address/i)).toBeVisible();
    await expect(page.getByPlaceholder(/min €/i)).not.toBeVisible();
  });

  test('buy-now success shows message', async ({ page, asBuyer }) => {
    await setupAuctionDetailRoutes(page);
    await setupAccountRoutes(page, undefined, [
      { addressId: 'a1', addressLine1: '1 St', city: 'Dublin', county: 'Dublin', eircode: 'D01', isDefault: true },
    ]);
    await page.goto(`/auctions/${AUCTION_ID}`);
    await page.getByRole('button', { name: /buy now/i }).click();
    await expect(page.getByText('Purchase successful!')).toBeVisible();
  });

  test('add to watchlist changes button text', async ({ page, asBuyer }) => {
    await setupAuctionDetailRoutes(page);
    await setupAccountRoutes(page, undefined, []);
    await page.route(`**/api/auctions/watchlists/me/${AUCTION_ID}`, (route) =>
      route.request().method() === 'POST'
        ? route.fulfill({ status: 204, body: '' })
        : route.fulfill({ status: 204, body: '' }),
    );
    await page.goto(`/auctions/${AUCTION_ID}`);
    const watchBtn = page.getByRole('button', { name: /add to watchlist/i });
    await expect(watchBtn).toBeVisible();
    await watchBtn.click();
    await expect(page.getByRole('button', { name: /remove from watchlist/i })).toBeVisible();
  });

  test('cancel auction shown for seller with no bids', async ({ page, asSeller }) => {
    await setupAuctionDetailRoutes(page, { bidCount: 0, leadingBidderId: null, sellerId: 'u-seller-1' });
    await setupAccountRoutes(page, { ...baseAuction, userId: 'u-seller-1', role: 'SELLER' }, []);
    await page.goto(`/auctions/${AUCTION_ID}`);
    await expect(page.getByRole('button', { name: /cancel auction/i })).toBeVisible();
    await page.getByRole('button', { name: /cancel auction/i }).click();
    await expect(page.getByText('Auction cancelled')).toBeVisible();
  });

  test('report listing opens prompt and shows success', async ({ page, asBuyer }) => {
    await setupAuctionDetailRoutes(page);
    await setupAccountRoutes(page, undefined, []);
    page.on('dialog', (dialog) => dialog.accept('Fake item — not as described'));
    await page.goto(`/auctions/${AUCTION_ID}`);
    await page.getByRole('button', { name: /report listing/i }).click();
    await expect(page.getByText('Report submitted')).toBeVisible();
  });

  test('bid history table shown when bids exist', async ({ page, asBuyer }) => {
    const bids = [
      { bidId: 'b-1', amount: { amount: 120, currency: 'EUR' }, bidderId: BUYER2_ID, placedAt: '2024-01-01T12:00:00Z', isWinning: true },
      { bidId: 'b-2', amount: { amount: 100, currency: 'EUR' }, bidderId: 'u-buyer-1', placedAt: '2024-01-01T10:00:00Z', isWinning: false },
    ];
    await setupAuctionDetailRoutes(page, {}, bids);
    await setupAccountRoutes(page, undefined, []);
    await page.goto(`/auctions/${AUCTION_ID}`);
    await expect(page.getByText(/bid history/i)).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(2);
  });
});

test.describe('Search page', () => {
  test('renders results when ?q param present in URL', async ({ page, asBuyer }) => {
    await page.route('**/api/catalogue/categories', (r) => r.fulfill({ json: [] }));
    await page.route('**/api/catalogue/search**', (r) =>
      r.fulfill({ json: { content: [baseAuction] } }),
    );
    await page.goto('/search?q=laptop');
    await expect(page.locator('tbody tr')).toHaveCount(1);
  });

  test('navbar search navigates to /search with q param', async ({ page, asBuyer }) => {
    await setupAuctionListRoutes(page, []);
    await page.route('**/api/catalogue/categories', (r) => r.fulfill({ json: [] }));
    await page.route('**/api/catalogue/search**', (r) =>
      r.fulfill({ json: { content: [] } }),
    );
    await page.goto('/auctions');
    const navSearch = page.locator('nav input[type!="hidden"]').or(page.locator('nav input')).first();
    await navSearch.fill('laptop');
    await navSearch.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=laptop/);
  });

  test('empty results shows placeholder', async ({ page, asBuyer }) => {
    await page.route('**/api/catalogue/categories', (r) => r.fulfill({ json: [] }));
    await page.route('**/api/catalogue/search**', (r) =>
      r.fulfill({ json: { content: [] } }),
    );
    await page.goto('/search?q=nonexistent');
    await expect(page.getByText('No listings found.')).toBeVisible();
  });

  test('min/max price filters passed to API', async ({ page, asBuyer }) => {
    let capturedUrl = '';
    await page.route('**/api/catalogue/categories', (r) => r.fulfill({ json: [] }));
    await page.route('**/api/catalogue/search**', async (route) => {
      capturedUrl = route.request().url();
      await route.fulfill({ json: { content: [] } });
    });
    await page.goto('/search');
    await page.getByPlaceholder(/min price/i).fill('10');
    await page.getByPlaceholder(/max price/i).fill('500');
    await page.getByRole('button', { name: /^search$/i }).click();
    await expect(page.getByText('No listings found.')).toBeVisible();
    expect(capturedUrl).toContain('minPrice=10');
    expect(capturedUrl).toContain('maxPrice=500');
  });
});
