import { test, expect } from './helpers/fixtures';
import { setupDeliveryRoutes, JOB_ID } from './helpers/mock-routes';

const deliveredJob = {
  deliveryJobId: JOB_ID,
  status: 'DELIVERED',
  pickupAddress: { city: 'Cork' },
  deliveryAddress: { city: 'Dublin' },
};

const assignedJob = {
  deliveryJobId: JOB_ID,
  status: 'ASSIGNED',
  pickupAddress: { city: 'Cork' },
  deliveryAddress: { city: 'Dublin' },
};

const inTransitJob = {
  deliveryJobId: JOB_ID,
  status: 'IN_TRANSIT',
  pickupAddress: { city: 'Cork' },
  deliveryAddress: { city: 'Dublin' },
};

const pendingJob = {
  deliveryJobId: 'jj-pending-1',
  status: 'PENDING',
  pickupAddress: { city: 'Galway' },
  deliveryAddress: { city: 'Limerick' },
};

test.describe('Delivery — Buyer', () => {
  test('delivery list loads with DELIVERED job showing action buttons', async ({ page, asBuyer }) => {
    await setupDeliveryRoutes(page, [deliveredJob]);
    await page.goto('/deliveries');
    await expect(page.getByText('Delivered')).toBeVisible();
    await expect(page.getByRole('button', { name: /confirm receipt/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /dispute/i })).toBeVisible();
  });

  test('confirm receipt shows Done', async ({ page, asBuyer }) => {
    await setupDeliveryRoutes(page, [deliveredJob]);
    await page.goto('/deliveries');
    await page.getByRole('button', { name: /confirm receipt/i }).click();
    await expect(page.getByText('Done')).toBeVisible();
  });

  test('dispute with reason shows Done', async ({ page, asBuyer }) => {
    await setupDeliveryRoutes(page, [deliveredJob]);
    page.on('dialog', (dialog) => dialog.accept('Item was damaged'));
    await page.goto('/deliveries');
    await page.getByRole('button', { name: /^dispute$/i }).click();
    await expect(page.getByText('Done')).toBeVisible();
  });

  test('no DELIVERED job means confirm button absent', async ({ page, asBuyer }) => {
    await setupDeliveryRoutes(page, [{ ...deliveredJob, status: 'CONFIRMED' }]);
    await page.goto('/deliveries');
    await expect(page.getByRole('button', { name: /confirm receipt/i })).not.toBeVisible();
  });
});

test.describe('Delivery — Seller', () => {
  test('ASSIGNED job shows Confirm Handover button', async ({ page, asSeller }) => {
    await setupDeliveryRoutes(page, [assignedJob]);
    await page.goto('/deliveries');
    await expect(page.getByRole('button', { name: /confirm handover/i })).toBeVisible();
  });

  test('confirm handover shows Done', async ({ page, asSeller }) => {
    await setupDeliveryRoutes(page, [assignedJob]);
    await page.goto('/deliveries');
    await page.getByRole('button', { name: /confirm handover/i }).click();
    await expect(page.getByText('Done')).toBeVisible();
  });
});

test.describe('Delivery — Driver', () => {
  test('pending jobs table visible', async ({ page, asDriver }) => {
    await setupDeliveryRoutes(page, [], [pendingJob]);
    await page.goto('/deliveries');
    await expect(page.getByText(/available jobs/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /assign to me/i })).toBeVisible();
  });

  test('assign to me shows success', async ({ page, asDriver }) => {
    await setupDeliveryRoutes(page, [], [pendingJob]);
    await page.goto('/deliveries');
    await page.getByRole('button', { name: /assign to me/i }).click();
    await expect(page.getByText('Job assigned to you')).toBeVisible();
  });

  test('IN_TRANSIT job shows Mark Delivered button', async ({ page, asDriver }) => {
    await setupDeliveryRoutes(page, [inTransitJob], []);
    await page.goto('/deliveries');
    await expect(page.getByRole('button', { name: /mark delivered/i })).toBeVisible();
  });

  test('mark delivered shows Done', async ({ page, asDriver }) => {
    await setupDeliveryRoutes(page, [inTransitJob], []);
    await page.goto('/deliveries');
    await page.getByRole('button', { name: /mark delivered/i }).click();
    await expect(page.getByText('Done')).toBeVisible();
  });
});
