const { test, expect } = require('@playwright/test');
const { addProductToCart } = require('./helpers');

test('guest money-order checkout reaches the confirmation page', async ({ page }) => {
  await addProductToCart(page);
  await page.goto('/checkout');

  const form = page.locator('form, .billing-info-wrap').first();
  await form.locator('input[name="firstName"]').fill('Test');
  await form.locator('input[name="lastName"]').fill('Buyer');
  await form.locator('input[name="address"]').fill('1 Main St');
  // Countries and their zones load asynchronously; choosing CA replaces the free-text
  // state input with a select of Canadian provinces, so wait for that select.
  const country = page.locator('.billing-select select').first();
  await expect(country.locator('option[value="CA"]').first()).toBeAttached();
  await country.selectOption('CA');
  await form.locator('input[name="city"]').fill('Toronto');
  const province = page.locator('.billing-select select').nth(1);
  await expect(province.locator('option[value="ON"]').first()).toBeAttached();
  await province.selectOption('ON');
  await form.locator('input[name="postalCode"]').fill('M5V2T6');
  await form.locator('input[name="phone"]').fill('5555555555');
  await form.locator('input[name="email"]').fill('e2e.buyer@example.com');
  await page.locator('input[name="isAgree"]').first().check();

  const checkout = page.waitForResponse((r) => /\/cart\/.+\/checkout/.test(r.url()) && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Place your order' }).first().click();
  const response = await checkout;
  expect(response.status(), await response.text()).toBe(200);
  expect(response.request().headers()['idempotency-key']).toBeTruthy();

  await expect(page).toHaveURL(/\/order-confirm/);
  await expect(page.getByRole('heading', { name: 'Order Completed' })).toBeVisible();
});
