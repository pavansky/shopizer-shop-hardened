import WebService from './webService';
import env from './env';

// Price for a product with the selected options.
// POST /api/v2/product/{id}/variation  body {options: [{option, value}]}
// (the v1 POST /product/{id}/price route was removed from the backend).
// Resolves to null when nothing is selected; callers keep the list price.
export async function fetchVariantPrice(productId, selectedOptions) {
  const options = (selectedOptions || [])
    .filter((o) => o && o.option != null && o.id != null)
    .map((o) => ({ option: o.option, value: o.id }));
  if (!productId || options.length === 0) {
    return null;
  }
  return WebService.post(env.API_V2 + 'product/' + productId + '/variation', { options });
}
