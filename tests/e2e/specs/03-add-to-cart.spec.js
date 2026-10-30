const { test, expect } = require('@playwright/test');
const { PRODUCT_NAME, addProductToCart } = require('./helpers');

test('product page adds the product to the cart', async ({ page }) => {
  await addProductToCart(page);
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Your cart items' })).toBeVisible();
  await expect(page.locator('.product-name', { hasText: PRODUCT_NAME }).first()).toBeVisible();
});
