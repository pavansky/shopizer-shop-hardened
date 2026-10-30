const { test, expect } = require('@playwright/test');
const { PRODUCT_NAME, addProductToCart } = require('./helpers');

test('removing the only item empties the cart', async ({ page }) => {
  // Known defect: the DELETE succeeds and the cart is gone on the server, but the cart
  // page keeps showing the item. Cart.js renders its own copy of the cart and only
  // refetches it when the header count changes, which it does not do here. Remove this
  // line with the fix; the test then fails loudly if the defect comes back.
  test.fail(true, 'cart page does not refresh after the last item is removed');

  await addProductToCart(page);
  await page.goto('/cart');
  await expect(page.locator('.product-name', { hasText: PRODUCT_NAME }).first()).toBeVisible();
  const removed = page.waitForResponse((r) => r.request().method() === 'DELETE' && /\/cart\/.+\/product\//.test(r.url()));
  await page.locator('.product-remove button').first().click();
  expect((await removed).ok()).toBeTruthy();
  await expect(page.getByText('No items found in cart')).toBeVisible();
});
