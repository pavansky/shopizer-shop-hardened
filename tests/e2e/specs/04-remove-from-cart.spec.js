const { test, expect } = require('@playwright/test');
const { PRODUCT_NAME, addProductToCart } = require('./helpers');

// Adds the product, opens the cart page and removes the only item. Returns the DELETE
// response so callers can check the server side.
async function removeOnlyItem(page) {
  await addProductToCart(page);
  await page.goto('/cart');
  await expect(page.locator('.product-name', { hasText: PRODUCT_NAME }).first()).toBeVisible();
  const removed = page.waitForResponse((r) => r.request().method() === 'DELETE' && /\/cart\/[^/]+\/product\//.test(r.url()));
  await page.locator('.product-remove button').first().click();
  return removed;
}

test('removing the only item empties the cart on the server', async ({ page }) => {
  const removed = await removeOnlyItem(page);
  expect(removed.ok()).toBeTruthy();

  // Read the same cart back from the API the storefront called: gone (404) or empty.
  const cartUrl = removed.url().replace(/\/product\/.*$/, '');
  const cart = await page.request.get(cartUrl);
  if (cart.status() !== 404) {
    expect(cart.ok()).toBeTruthy();
    const body = await cart.json();
    expect(body.products || []).toHaveLength(0);
  }
});

test('the cart page shows the cart as empty after the last item is removed', async ({ page }) => {
  const removed = await removeOnlyItem(page);
  expect(removed.ok()).toBeTruthy();

  // Known defect: Cart.js renders its own copy of the cart and only refetches it when the
  // header count changes, which it does not do here, so the page keeps showing the item.
  // The mark is set only now, so a failure in the steps above still fails this test;
  // only the UI assertion below is an expected failure. Remove this line with the
  // Cart.js fix.
  test.fail(true, 'cart page does not refresh after the last item is removed');
  await expect(page.getByText('No items found in cart')).toBeVisible();
});
