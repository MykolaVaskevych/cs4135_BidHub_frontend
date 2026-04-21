import { test as base } from '@playwright/test';

export const USERS = {
  BUYER: {
    userId: 'u-buyer-1',
    email: 'buyer1@bidhub.local',
    role: 'BUYER',
    firstName: 'Alice',
    lastName: 'Buyer',
  },
  BUYER2: {
    userId: 'u-buyer-2',
    email: 'buyer2@bidhub.local',
    role: 'BUYER',
    firstName: 'Bob',
    lastName: 'Buyer',
  },
  SELLER: {
    userId: 'u-seller-1',
    email: 'seller1@bidhub.local',
    role: 'SELLER',
    firstName: 'Sam',
    lastName: 'Seller',
  },
  ADMIN: {
    userId: 'u-admin-1',
    email: 'admin@bidhub.local',
    role: 'ADMIN',
    firstName: 'Ada',
    lastName: 'Admin',
  },
  DRIVER: {
    userId: 'u-driver-1',
    email: 'driver1@bidhub.local',
    role: 'DELIVERY_DRIVER',
    firstName: 'Dave',
    lastName: 'Driver',
  },
} as const;

type MyFixtures = {
  asBuyer: void;
  asBuyer2: void;
  asSeller: void;
  asAdmin: void;
  asDriver: void;
};

function injectAuth(user: (typeof USERS)[keyof typeof USERS]) {
  return async ({ page }: { page: import('@playwright/test').Page }, use: () => Promise<void>) => {
    await page.addInitScript((u) => {
      localStorage.setItem('token', 'fake-test-token');
      localStorage.setItem('user', JSON.stringify(u));
    }, { userId: user.userId, email: user.email, role: user.role });
    await use();
  };
}

export const test = base.extend<MyFixtures>({
  asBuyer:  injectAuth(USERS.BUYER),
  asBuyer2: injectAuth(USERS.BUYER2),
  asSeller: injectAuth(USERS.SELLER),
  asAdmin:  injectAuth(USERS.ADMIN),
  asDriver: injectAuth(USERS.DRIVER),
});

export { expect } from '@playwright/test';
