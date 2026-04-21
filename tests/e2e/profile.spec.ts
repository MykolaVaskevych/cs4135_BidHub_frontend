import { test, expect } from './helpers/fixtures';
import { setupAccountRoutes } from './helpers/mock-routes';

const ADDRESS = {
  addressId: 'addr-1',
  addressLine1: '1 Main St',
  addressLine2: '',
  city: 'Dublin',
  county: 'Dublin',
  eircode: 'D01AB12',
  isDefault: true,
};

test.describe('Profile', () => {
  test('profile page shows user data', async ({ page, asBuyer }) => {
    await setupAccountRoutes(page);
    await page.goto('/profile');
    await expect(page.locator('td').filter({ hasText: /^buyer1@bidhub\.local$/ })).toBeVisible();
    await expect(page.locator('td').filter({ hasText: /^BUYER$/ })).toBeVisible();
    await expect(page.locator('td').filter({ hasText: /^ACTIVE$/ })).toBeVisible();
  });

  test('update name shows success message', async ({ page, asBuyer }) => {
    await setupAccountRoutes(page);
    await page.goto('/profile');
    await page.getByPlaceholder(/first name/i).fill('Alice');
    await page.getByPlaceholder(/last name/i).fill('Updated');
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText('Profile updated')).toBeVisible();
  });

  test('change password success', async ({ page, asBuyer }) => {
    await setupAccountRoutes(page);
    await page.goto('/profile');
    await page.getByPlaceholder(/current password/i).fill('Buyer1Pass!');
    await page.getByPlaceholder(/new password/i).fill('NewPass1!');
    await page.getByRole('button', { name: /^change$/i }).click();
    await expect(page.getByText('Password changed')).toBeVisible();
  });

  test('change password with wrong current shows error', async ({ page, asBuyer }) => {
    await setupAccountRoutes(page);
    await page.goto('/profile');
    await page.getByPlaceholder(/current password/i).fill('wrong');
    await page.getByPlaceholder(/new password/i).fill('NewPass1!');
    await page.getByRole('button', { name: /^change$/i }).click();
    await expect(page.locator('p[style*="red"]')).toContainText('Current password is incorrect');
  });

  test('add address shows success and address line', async ({ page, asBuyer }) => {
    await setupAccountRoutes(page);
    await page.goto('/profile');
    await page.getByPlaceholder(/address line 1/i).fill('42 Oak Ave');
    await page.getByPlaceholder(/^city$/i).fill('Cork');
    await page.getByPlaceholder(/county/i).fill('Cork');
    await page.getByPlaceholder(/eircode/i).fill('T12XY34');
    await page.getByRole('button', { name: /add address/i }).click();
    await expect(page.getByText('Address added')).toBeVisible();
  });

  test('existing address shown in table', async ({ page, asBuyer }) => {
    await setupAccountRoutes(page, undefined, [ADDRESS]);
    await page.goto('/profile');
    await expect(page.getByText('1 Main St')).toBeVisible();
    await expect(page.locator('td').filter({ hasText: /^Dublin$/ }).first()).toBeVisible();
    await expect(page.getByText('D01AB12')).toBeVisible();
  });

  test('set default address shows success', async ({ page, asBuyer }) => {
    const secondAddr = { ...ADDRESS, addressId: 'addr-2', addressLine1: '2 Second St', isDefault: false };
    await setupAccountRoutes(page, undefined, [ADDRESS, secondAddr]);
    await page.goto('/profile');
    await page.getByRole('button', { name: /set default/i }).click();
    await expect(page.getByText('Default address updated')).toBeVisible();
  });

  test('delete address shows success', async ({ page, asBuyer }) => {
    await setupAccountRoutes(page, undefined, [ADDRESS]);
    await page.goto('/profile');
    await page.getByRole('button', { name: /delete/i }).click();
    await expect(page.getByText('Address removed')).toBeVisible();
  });

  test('address form requires mandatory fields (HTML5 validation)', async ({ page, asBuyer }) => {
    let networkCalled = false;
    await setupAccountRoutes(page);
    page.on('request', (req) => {
      if (req.url().includes('/api/accounts/me/addresses') && req.method() === 'POST') {
        networkCalled = true;
      }
    });
    await page.goto('/profile');
    // try to submit with empty required fields
    await page.getByRole('button', { name: /add address/i }).click();
    expect(networkCalled).toBe(false);
  });
});
