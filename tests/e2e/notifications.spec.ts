import { test, expect } from './helpers/fixtures';
import { setupNotificationRoutes } from './helpers/mock-routes';

const sampleNotifications = [
  {
    notificationId: 'n-1',
    type: 'BID_OUTBID',
    subject: 'You have been outbid',
    message: 'You were outbid on auction abc',
    createdAt: '2024-01-15T10:00:00Z',
    read: false,
  },
  {
    notificationId: 'n-2',
    type: 'AUCTION_WON',
    subject: 'You won!',
    message: 'You won auction xyz',
    createdAt: '2024-01-14T08:00:00Z',
    read: true,
  },
  {
    notificationId: 'n-3',
    type: 'PAYMENT_RECEIPT',
    subject: 'Payment received',
    message: 'Payment confirmed',
    createdAt: '2024-01-13T07:00:00Z',
    read: true,
  },
];

test.describe('Notifications', () => {
  test('notification list renders cards', async ({ page, asBuyer }) => {
    await setupNotificationRoutes(page, sampleNotifications);
    await page.goto('/notifications');
    await expect(page.getByText('You have been outbid')).toBeVisible();
    await expect(page.getByText('You won!')).toBeVisible();
    await expect(page.getByText('Payment received')).toBeVisible();
  });

  test('BID_OUTBID type shows correct label', async ({ page, asBuyer }) => {
    await setupNotificationRoutes(page, [sampleNotifications[0]]);
    await page.goto('/notifications');
    await expect(page.locator('strong').filter({ hasText: /^Outbid$/ })).toBeVisible();
  });

  test('AUCTION_WON type shows Auction Won label', async ({ page, asBuyer }) => {
    await setupNotificationRoutes(page, [sampleNotifications[1]]);
    await page.goto('/notifications');
    await expect(page.getByText('Auction Won')).toBeVisible();
  });

  test('empty notifications shows placeholder', async ({ page, asBuyer }) => {
    await setupNotificationRoutes(page, []);
    await page.goto('/notifications');
    await expect(page.getByText('No notifications yet.')).toBeVisible();
  });

  test('pagination hidden when totalPages = 1', async ({ page, asBuyer }) => {
    await setupNotificationRoutes(page, sampleNotifications, 1);
    await page.goto('/notifications');
    await expect(page.getByRole('button', { name: /prev/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /next/i })).not.toBeVisible();
  });

  test('pagination shown and Prev disabled on first page', async ({ page, asBuyer }) => {
    await setupNotificationRoutes(page, sampleNotifications, 3);
    await page.goto('/notifications');
    await expect(page.getByRole('button', { name: /prev/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /prev/i })).toBeDisabled();
    await expect(page.getByRole('button', { name: /next/i })).toBeEnabled();
  });

  test('clicking Next increments page label', async ({ page, asBuyer }) => {
    // first call returns page 0, second call (after Next) returns page 1
    let callCount = 0;
    await page.route('**/api/notifications/me**', async (route) => {
      const items = callCount === 0 ? sampleNotifications : [sampleNotifications[0]];
      callCount++;
      await route.fulfill({
        json: { content: items, totalPages: 2, totalElements: 4, number: callCount - 1 },
      });
    });
    await page.goto('/notifications');
    await expect(page.getByText('Page 1 of 2')).toBeVisible();
    await page.getByRole('button', { name: /next/i }).click();
    await expect(page.getByText('Page 2 of 2')).toBeVisible();
    await expect(page.getByRole('button', { name: /next/i })).toBeDisabled();
  });
});
