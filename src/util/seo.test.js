import { canonicalUrl, parsePrice, plainText, productJsonLd } from './seo';

const product = {
  id: 7,
  sku: 'OAK-1',
  price: 249,
  finalPrice: 'CA$199.00',
  discounted: true,
  quantity: 3,
  available: true,
  canBePurchased: true,
  images: [{ imageUrl: 'https://cdn.example/oak.jpg' }],
  description: { name: 'Oak bench', friendlyUrl: 'oak-bench', description: '<p>Solid <b>oak</b></p>' },
};

describe('productJsonLd', () => {
  it('builds a Product with an Offer in the store currency', () => {
    const ld = productJsonLd(product, { currency: 'CAD', url: 'https://shop.example/product/oak-bench', storeName: 'Demo' });
    expect(ld['@type']).toBe('Product');
    expect(ld.name).toBe('Oak bench');
    expect(ld.sku).toBe('OAK-1');
    expect(ld.description).toBe('Solid oak');
    expect(ld.image).toEqual(['https://cdn.example/oak.jpg']);
    expect(ld.offers).toEqual({
      '@type': 'Offer',
      url: 'https://shop.example/product/oak-bench',
      price: '199.00',
      priceCurrency: 'CAD',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'Demo' },
    });
  });

  it('uses the list price when not discounted and reports stock-outs', () => {
    const ld = productJsonLd({ ...product, discounted: false, quantity: 0 }, { currency: 'CAD' });
    expect(ld.offers.price).toBe('249.00');
    expect(ld.offers.availability).toBe('https://schema.org/OutOfStock');
  });

  it('omits the offer when the currency is unknown', () => {
    expect(productJsonLd(product, {}).offers).toBeUndefined();
  });
});

describe('parsePrice', () => {
  it.each([
    ['CA$1,249.00', 1249],
    ['1 249,00 $', 1249],
    ['¥1,200', 1200],
    ['€10,5', 10.5],
    ['', null],
  ])('%s -> %s', (input, expected) => {
    expect(parsePrice(input)).toBe(expected);
  });
});

describe('helpers', () => {
  it('builds absolute canonical URLs', () => {
    expect(canonicalUrl('/product/oak-bench', 'https://shop.example/')).toBe('https://shop.example/product/oak-bench');
  });

  it('cuts descriptions near 160 characters on a word boundary', () => {
    const text = plainText('word '.repeat(60));
    expect(text.length).toBeLessThanOrEqual(160);
    expect(text.endsWith('…')).toBe(true);
  });
});
