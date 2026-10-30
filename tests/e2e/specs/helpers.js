// Data seeded by the backend's scripts/demo-checkout.sh.
const CATEGORY_SLUG = 'furniture';
const PRODUCT_SLUG = 'oak-bench';
const PRODUCT_NAME = 'Oak Bench';

// The checkout page loads Google Maps for address autocomplete; CI has no key and no need for it.
async function blockThirdParties(page) {
  await page.route(/maps\.googleapis\.com|maps\.gstatic\.com/, (route) => route.abort());
}

async function addProductToCart(page) {
  await blockThirdParties(page);
  await page.goto(`/product/${PRODUCT_SLUG}`);
  await page.getByRole('heading', { name: PRODUCT_NAME }).first().waitFor();
  const added = page.waitForResponse((r) => /\/api\/v1\/cart/.test(r.url()) && r.request().method() !== 'GET' && r.ok());
  await page.locator('.pro-details-cart button', { hasText: 'Add to cart' }).click();
  await added;
}

module.exports = { CATEGORY_SLUG, PRODUCT_SLUG, PRODUCT_NAME, blockThirdParties, addProductToCart };
