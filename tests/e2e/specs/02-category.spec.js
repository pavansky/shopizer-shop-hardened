const { test, expect } = require('@playwright/test');
const { CATEGORY_SLUG, PRODUCT_NAME, blockThirdParties } = require('./helpers');

test('category page is found by its slug and lists its products', async ({ page }) => {
  await blockThirdParties(page);
  const category = page.waitForResponse((r) => r.url().includes(`/api/v1/category/${CATEGORY_SLUG}`));
  await page.goto(`/category/${CATEGORY_SLUG}`);
  expect((await category).status()).toBe(200);
  await expect(page.getByText(PRODUCT_NAME).first()).toBeVisible();
});
