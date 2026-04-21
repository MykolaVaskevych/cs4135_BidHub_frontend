import type { Page } from '@playwright/test';

// ── Shared fixture data ──────────────────────────────────────────────────────

export const AUCTION_ID   = 'aaaaaaaa-0000-0000-0000-000000000001';
export const AUCTION_ID_2 = 'aaaaaaaa-0000-0000-0000-000000000002';
export const LISTING_ID   = 'llllllll-0000-0000-0000-000000000001';
export const LISTING_ID_2 = 'llllllll-0000-0000-0000-000000000002';
export const SELLER_ID    = 'u-seller-1';
export const BUYER_ID     = 'u-buyer-1';
export const BUYER2_ID    = 'u-buyer-2';
export const JOB_ID       = 'jjjjjjjj-0000-0000-0000-000000000001';

export const baseAuction = {
  auctionId: AUCTION_ID,
  listingId: LISTING_ID,
  sellerId: SELLER_ID,
  status: 'ACTIVE',
  currentPrice: { amount: 100, currency: 'EUR' },
  startingPrice: { amount: 50, currency: 'EUR' },
  buyNowPrice: { amount: 200, currency: 'EUR' },
  bidCount: 2,
  leadingBidderId: BUYER2_ID,
  endTime: '2099-01-01T00:00:00Z',
};

export const baseListing = {
  listingId: LISTING_ID,
  title: 'Test Laptop',
  description: 'A test laptop',
  photos: [],
  categoryId: 'cat-1',
  sellerId: SELLER_ID,
  status: 'ACTIVE',
};

export const baseProfile = {
  userId: BUYER_ID,
  email: 'buyer1@bidhub.local',
  role: 'BUYER',
  firstName: 'Alice',
  lastName: 'Buyer',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z',
};

export const sellerProfile = {
  userId: SELLER_ID,
  email: 'seller1@bidhub.local',
  role: 'SELLER',
  firstName: 'Sam',
  lastName: 'Seller',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z',
};

export const categories = [
  { categoryId: 'cat-1', name: 'Electronics', isActive: true },
  { categoryId: 'cat-2', name: 'Books', isActive: true },
];

// ── Route helpers ────────────────────────────────────────────────────────────

export async function setupAuthRoutes(page: Page) {
  await page.route('**/api/auth/login', async (route) => {
    const body = route.request().postDataJSON();
    if (body.password === 'wrong') {
      await route.fulfill({ status: 401, json: { message: 'Invalid credentials' } });
    } else {
      await route.fulfill({
        json: {
          token: 'fake-jwt-token',
          userId: BUYER_ID,
          email: body.email,
          role: 'BUYER',
        },
      });
    }
  });

  await page.route('**/api/auth/register', async (route) => {
    const body = route.request().postDataJSON();
    if (body.email === 'taken@bidhub.local') {
      await route.fulfill({ status: 400, json: { message: 'Email already in use' } });
    } else {
      await route.fulfill({
        json: {
          token: 'fake-jwt-token',
          userId: 'new-user-id',
          email: body.email,
          role: body.role ?? 'BUYER',
        },
      });
    }
  });
}

export async function setupAccountRoutes(
  page: Page,
  profile: Record<string, unknown> = baseProfile,
  addresses: unknown[] = [],
) {
  await page.route('**/api/accounts/me', async (route) => {
    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON();
      await route.fulfill({ json: { ...profile, ...body } });
    } else {
      await route.fulfill({ json: profile });
    }
  });

  await page.route('**/api/accounts/me/password', async (route) => {
    const body = route.request().postDataJSON();
    if (body.currentPassword === 'wrong') {
      await route.fulfill({ status: 400, json: { message: 'Current password is incorrect' } });
    } else {
      await route.fulfill({ status: 204, body: '' });
    }
  });

  await page.route('**/api/accounts/me/addresses', async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      await route.fulfill({
        json: { addressId: 'addr-new', ...body, isDefault: addresses.length === 0 },
      });
    } else {
      await route.fulfill({ json: addresses });
    }
  });

  await page.route('**/api/accounts/me/addresses/*/default', async (route) => {
    await route.fulfill({ status: 204, body: '' });
  });

  await page.route('**/api/accounts/me/addresses/*', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 204, body: '' });
    }
  });

  // seller info lookup on auction detail
  await page.route('**/api/accounts/*', async (route) => {
    await route.fulfill({ json: { firstName: 'Sam', lastName: 'Seller' } });
  });
}

export async function setupCatalogueRoutes(page: Page) {
  await page.route('**/api/catalogue/categories', async (route) => {
    await route.fulfill({ json: categories });
  });

  await page.route('**/api/categories', async (route) => {
    await route.fulfill({ json: { content: categories } });
  });
}

export async function setupAuctionListRoutes(
  page: Page,
  auctions: unknown[] = [baseAuction],
) {
  await page.route('**/api/auctions/search**', async (route) => {
    await route.fulfill({ json: auctions });
  });

  await page.route('**/api/auctions/watchlists/me', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { watchedAuctionIds: [] } });
    }
  });

  await page.route('**/api/auctions/my-sales', async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.route('**/api/auctions/my-bids', async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.route('**/api/auctions/all', async (route) => {
    await route.fulfill({ json: auctions });
  });

  await page.route('**/api/auctions/count**', async (route) => {
    await route.fulfill({ json: 5 });
  });

  // listings for each auction row
  await page.route('**/api/auctions/listings/**', async (route) => {
    await route.fulfill({ json: baseListing });
  });
}

export async function setupAuctionDetailRoutes(
  page: Page,
  auctionOverrides: Record<string, unknown> = {},
  bids: unknown[] = [],
) {
  const auction = { ...baseAuction, ...auctionOverrides };

  // order matters: specific paths before wildcards
  await page.route('**/api/auctions/watchlists/me', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { watchedAuctionIds: [] } });
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 204, body: '' });
    }
  });

  await page.route(`**/api/auctions/watchlists/me/${AUCTION_ID}`, async (route) => {
    await route.fulfill({ status: 204, body: '' });
  });

  await page.route('**/api/auctions/listings/**', async (route) => {
    await route.fulfill({ json: baseListing });
  });

  await page.route(`**/api/auctions/${AUCTION_ID}/bids`, async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      if (body.amount <= auction.currentPrice.amount) {
        await route.fulfill({ status: 400, json: { message: 'Bid amount must exceed current price' } });
      } else {
        await route.fulfill({
          status: 201,
          json: { bidId: 'bid-new', amount: { amount: body.amount, currency: 'EUR' }, bidderId: BUYER_ID, placedAt: new Date().toISOString(), isWinning: true },
        });
      }
    } else {
      await route.fulfill({ json: bids });
    }
  });

  await page.route(`**/api/auctions/${AUCTION_ID}/buy-now`, async (route) => {
    await route.fulfill({ json: { ...auction, status: 'SOLD', leadingBidderId: BUYER_ID } });
  });

  await page.route(`**/api/auctions/${AUCTION_ID}/cancel`, async (route) => {
    await route.fulfill({ json: { ...auction, status: 'CANCELLED' } });
  });

  await page.route(`**/api/auctions/${AUCTION_ID}/remove`, async (route) => {
    await route.fulfill({ status: 204, body: '' });
  });

  await page.route(`**/api/auctions/${AUCTION_ID}`, async (route) => {
    await route.fulfill({ json: auction });
  });

  await page.route('**/api/admin/reports', async (route) => {
    await route.fulfill({ status: 201, json: { reportId: 'r-1' } });
  });
}

export async function setupWalletRoutes(page: Page, balance = 250) {
  let currentBalance = balance;

  const transactions = [
    { transactionId: 'tx-1', type: 'TOP_UP', description: 'Wallet top-up', amount: 50, createdAt: '2024-01-15T10:00:00Z' },
    { transactionId: 'tx-2', type: 'BID_HOLD', description: 'Bid placed', amount: -20, createdAt: '2024-01-16T12:00:00Z' },
    { transactionId: 'tx-3', type: 'BID_REFUND', description: 'Bid refunded', amount: 20, createdAt: '2024-01-17T09:00:00Z' },
  ];

  await page.route('**/api/payments/wallet/top-up', async (route) => {
    const body = route.request().postDataJSON();
    currentBalance += body.amount;
    await route.fulfill({ status: 204, body: '' });
  });

  await page.route('**/api/payments/wallet', async (route) => {
    await route.fulfill({ json: { balance: currentBalance, currency: 'EUR' } });
  });

  await page.route('**/api/payments/transactions', async (route) => {
    await route.fulfill({ json: transactions });
  });
}

export async function setupDeliveryRoutes(
  page: Page,
  myJobs: unknown[] = [],
  pendingJobs: unknown[] = [],
) {
  await page.route('**/api/delivery/pending', async (route) => {
    await route.fulfill({ json: pendingJobs });
  });

  await page.route('**/api/delivery/me', async (route) => {
    await route.fulfill({ json: myJobs });
  });

  await page.route('**/api/delivery/*/deliver', async (route) => {
    await route.fulfill({ status: 204, body: '' });
  });

  await page.route('**/api/delivery/*/collect', async (route) => {
    await route.fulfill({ status: 204, body: '' });
  });

  await page.route('**/api/delivery/*/confirm', async (route) => {
    await route.fulfill({ status: 204, body: '' });
  });

  await page.route('**/api/delivery/*/dispute', async (route) => {
    await route.fulfill({ status: 204, body: '' });
  });

  await page.route('**/api/delivery/*/assign', async (route) => {
    await route.fulfill({ status: 204, body: '' });
  });
}

export async function setupNotificationRoutes(
  page: Page,
  items: unknown[] = [],
  totalPages = 1,
) {
  await page.route('**/api/notifications/me**', async (route) => {
    await route.fulfill({
      json: {
        content: items,
        totalPages,
        totalElements: items.length,
        number: 0,
      },
    });
  });
}

export async function setupAdminRoutes(page: Page) {
  await page.route('**/api/admin/dashboard/summary', async (route) => {
    await route.fulfill({
      json: {
        totalUsers: 42,
        activeAuctions: 7,
        activeCategories: 5,
        totalCategories: 6,
        pendingReports: 3,
        resolvedReports: 10,
        dismissedReports: 2,
        totalModerationActions: 15,
      },
    });
  });

  await page.route('**/api/admin/users**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: {
          content: [
            { userId: 'u-buyer-1', email: 'buyer1@bidhub.local', firstName: 'Alice', lastName: 'Buyer', role: 'BUYER', status: 'ACTIVE' },
            { userId: 'u-buyer-2', email: 'buyer2@bidhub.local', firstName: 'Bob',   lastName: 'Buyer', role: 'BUYER', status: 'SUSPENDED' },
          ],
          totalElements: 2,
          totalPages: 1,
        },
      });
    }
  });

  await page.route('**/api/admin/users/*/reactivate', async (route) => {
    await route.fulfill({ status: 204, body: '' });
  });

  await page.route('**/api/admin/users/*/suspend', async (route) => {
    await route.fulfill({ status: 204, body: '' });
  });

  await page.route('**/api/admin/users/*/ban', async (route) => {
    await route.fulfill({ status: 204, body: '' });
  });

  await page.route('**/api/admin/categories', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: categories });
    } else if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        json: { categoryId: 'cat-new', name: body.name, isActive: true },
      });
    }
  });

  await page.route('**/api/admin/categories/**', async (route) => {
    await route.fulfill({ status: 204, body: '' });
  });

  await page.route('**/api/admin/reports', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: {
          content: [
            { reportId: 'r-1', reason: 'Spam', status: 'PENDING', targetId: 'u-buyer-1', createdAt: '2024-01-01T00:00:00Z' },
          ],
          totalElements: 1,
          totalPages: 1,
        },
      });
    } else {
      await route.fulfill({ status: 201, json: { reportId: 'r-new' } });
    }
  });
}

export async function setupSellerRoutes(page: Page) {
  await page.route('**/api/auctions/listings', async (route) => {
    await route.fulfill({
      status: 201,
      json: {
        listingId: LISTING_ID,
        title: 'My New Listing',
        description: 'Test description',
        photos: [],
        categoryId: 'cat-1',
        status: 'DRAFT',
      },
    });
  });

  await page.route('**/api/auctions/listings/**', async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({ json: baseListing });
    } else {
      await route.fulfill({ json: baseListing });
    }
  });

  await page.route('**/api/auctions', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 201, json: baseAuction });
    }
  });

  await page.route('**/api/auctions/my-sales', async (route) => {
    await route.fulfill({
      json: [
        {
          auctionId: AUCTION_ID,
          listingId: LISTING_ID,
          status: 'ACTIVE',
          currentPrice: { amount: 100, currency: 'EUR' },
          bidCount: 2,
          endTime: '2099-01-01T00:00:00Z',
        },
        {
          auctionId: AUCTION_ID_2,
          listingId: LISTING_ID_2,
          status: 'ENDED',
          currentPrice: { amount: 150, currency: 'EUR' },
          bidCount: 0,
          endTime: '2024-01-01T00:00:00Z',
        },
      ],
    });
  });
}
