// Search engine metadata the single-page app adds to <head> per view:
// rel=canonical, robots and schema.org JSON-LD. Title and description stay
// with react-meta-tags, which the pages already use.
import { useEffect } from 'react';
import env from './env';

const MANAGED = 'data-seo';

// Absolute storefront URL for a path ("/product/oak-bench"), without query or hash.
// The configured public URL wins over the current origin, so a page reached on a
// second host (apex, preview) still names the same canonical URL as the sitemap.
export function canonicalUrl(path, origin) {
  const base = origin || env.APP_PUBLIC_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  return base.replace(/\/+$/, '') + '/' + String(path || '').replace(/^\/+/, '');
}

// Plain text for a meta description: tags stripped, whitespace collapsed,
// cut at a word boundary near 160 characters.
export function plainText(html, max = 160) {
  if (!html) return '';
  const text = String(html).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return (space > max / 2 ? cut.slice(0, space) : cut) + '…';
}

// Numeric amount from a server-formatted price ("CA$1,249.00", "1 249,00 $").
export function parsePrice(formatted) {
  if (formatted === undefined || formatted === null) return null;
  if (typeof formatted === 'number') return Number.isFinite(formatted) ? formatted : null;
  let s = String(formatted).replace(/[^\d.,]/g, '');
  if (!s) return null;
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  if (lastDot >= 0 && lastComma >= 0) {
    const decimal = lastDot > lastComma ? '.' : ',';
    const group = decimal === '.' ? ',' : '.';
    s = s.split(group).join('').replace(decimal, '.');
  } else if (lastComma >= 0) {
    // "249,00" is a decimal comma; "1,249" is a thousands separator.
    s = /,\d{1,2}$/.test(s) ? s.replace(/,/g, (m, i) => (i === lastComma ? '.' : '')) : s.replace(/,/g, '');
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function availability(product) {
  if (product.preOrder) return 'https://schema.org/PreOrder';
  const inStock = product.available !== false && product.canBePurchased !== false && Number(product.quantity) > 0;
  return inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
}

// schema.org Product with an Offer, from GET /api/v1/product/{slug}.
// The price is the one the shopper pays: the discounted price when there is
// one, otherwise the list price.
export function productJsonLd(product, { currency, url, storeName } = {}) {
  if (!product || !product.description) return null;
  const d = product.description;
  const price = product.discounted ? parsePrice(product.finalPrice) : (product.price != null ? Number(product.price) : parsePrice(product.finalPrice));
  let images = (product.images || []).map((i) => i && i.imageUrl).filter(Boolean);
  // Some products carry only the main image; rich results need at least one.
  if (!images.length && product.image && product.image.imageUrl) images = [product.image.imageUrl];
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: d.name,
    sku: product.sku || undefined,
    description: plainText(d.metaDescription || d.description, 5000) || undefined,
    image: images.length ? images : undefined,
    url: url || undefined,
    brand: product.manufacturer && product.manufacturer.description && product.manufacturer.description.name
      ? { '@type': 'Brand', name: product.manufacturer.description.name } : undefined,
  };
  if (price !== null && Number.isFinite(price) && currency) {
    data.offers = {
      '@type': 'Offer',
      url: url || undefined,
      price: price.toFixed(2),
      priceCurrency: currency,
      availability: availability(product),
      itemCondition: 'https://schema.org/NewCondition',
      seller: storeName ? { '@type': 'Organization', name: storeName } : undefined,
    };
  }
  return JSON.parse(JSON.stringify(data));
}

function upsert(selector, create) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    el.setAttribute(MANAGED, '');
    document.head.appendChild(el);
  }
  return el;
}

// Sets rel=canonical, a robots directive and a JSON-LD block for the current
// view, and removes them when the view unmounts.
export function useSeo({ canonical, robots, jsonLd } = {}) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : '';
  useEffect(() => {
    const added = [];
    if (canonical) {
      const link = upsert('link[rel="canonical"]', () => {
        const l = document.createElement('link');
        l.setAttribute('rel', 'canonical');
        return l;
      });
      link.setAttribute('href', canonical);
      added.push(link);
    }
    if (robots) {
      const meta = upsert('meta[name="robots"]', () => {
        const m = document.createElement('meta');
        m.setAttribute('name', 'robots');
        return m;
      });
      meta.setAttribute('content', robots);
      added.push(meta);
    }
    if (ld) {
      const script = upsert('script[type="application/ld+json"][data-seo]', () => {
        const s = document.createElement('script');
        s.setAttribute('type', 'application/ld+json');
        return s;
      });
      // "<" is escaped so product text cannot close the script element.
      script.textContent = ld.replace(/</g, '\\u003c');
      added.push(script);
    }
    return () => added.forEach((el) => el.parentNode && el.parentNode.removeChild(el));
  }, [canonical, robots, ld]);
}
