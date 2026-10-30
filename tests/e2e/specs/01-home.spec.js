const { test, expect } = require('@playwright/test');
const { blockThirdParties } = require('./helpers');

test('home page loads the store and its categories', async ({ page }) => {
  await blockThirdParties(page);
  const store = page.waitForResponse((r) => /\/api\/v1\/store\/DEFAULT/.test(r.url()));
  await page.goto('/');
  expect((await store).ok()).toBeTruthy();
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('header').getByText('Furniture', { exact: false }).first()).toBeAttached();
});
