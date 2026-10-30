// Runtime configuration.
//
// Values are resolved in this order:
//   1. window._env_ (public/env-config.js, rewritten by env.sh when the
//      container starts), so one build can be pointed at any backend;
//   2. REACT_APP_* variables inlined by react-scripts at build time;
//   3. the defaults below.
//
// Only public values belong here. Everything in this file ends up in the
// browser, so gateway secrets must never be configured through it.

const runtime = (typeof window !== 'undefined' && window._env_) || {};

// CRA only inlines process.env.REACT_APP_* when referenced literally.
const buildTime = {
  APP_API_URL: process.env.REACT_APP_API_URL,
  APP_BASE_URL: process.env.REACT_APP_BASE_URL,
  APP_MERCHANT: process.env.REACT_APP_MERCHANT,
  APP_PAYMENT_TYPE: process.env.REACT_APP_PAYMENT_TYPE,
  APP_STRIPE_KEY: process.env.REACT_APP_STRIPE_KEY,
  APP_PRODUCT_GRID_LIMIT: process.env.REACT_APP_PRODUCT_GRID_LIMIT,
  APP_MAP_API_KEY: process.env.REACT_APP_MAP_API_KEY,
  APP_THEME_COLOR: process.env.REACT_APP_THEME_COLOR,
  APP_PUBLIC_URL: process.env.REACT_APP_PUBLIC_URL,
};

const defaults = {
  APP_API_URL: 'http://localhost:8080/api',
  APP_MERCHANT: 'DEFAULT',
  APP_PAYMENT_TYPE: 'MONEYORDER',
  APP_STRIPE_KEY: '',
  APP_PRODUCT_GRID_LIMIT: '15',
  APP_MAP_API_KEY: '',
  APP_THEME_COLOR: '#D1D1D1',
};

const isSet = (v) => v !== undefined && v !== null && String(v).trim() !== '';

const read = (key) => {
  if (isSet(runtime[key])) return String(runtime[key]).trim();
  if (isSet(buildTime[key])) return String(buildTime[key]).trim();
  return undefined;
};

const stripSlash = (url) => url.replace(/\/+$/, '');

// A relative API URL ("/api", for a same-origin reverse proxy) is resolved
// against the page origin so every request URL is absolute.
const absolute = (url) =>
  url.startsWith('/') && typeof window !== 'undefined' ? window.location.origin + url : url;

// APP_API_URL is "<host>/api". The legacy APP_BASE_URL ("<host>") is still
// honoured so existing deployments keep working.
const resolveApiUrl = () => {
  const api = read('APP_API_URL');
  if (api) return absolute(stripSlash(api));
  const base = read('APP_BASE_URL');
  if (base) return absolute(stripSlash(base) + '/api');
  return defaults.APP_API_URL;
};

// A publishable key starts with pk_. Anything else (sk_, rk_) is a secret and
// is refused rather than shipped to the payment form.
const resolveStripeKey = () => {
  const key = read('APP_STRIPE_KEY') || '';
  if (key && !key.startsWith('pk_')) {
    // eslint-disable-next-line no-console
    console.error('APP_STRIPE_KEY is not a publishable key (pk_...); card payments are disabled.');
    return '';
  }
  return key;
};

const API_URL = resolveApiUrl();
const STRIPE_KEY = resolveStripeKey();
const requestedPayment = (read('APP_PAYMENT_TYPE') || defaults.APP_PAYMENT_TYPE).toUpperCase();

const env = {
  API_URL,
  API_V1: API_URL + '/v1/',
  API_V2: API_URL + '/v2/',
  // Backend origin (for actuator health), i.e. API_URL without the /api suffix.
  BACKEND_URL: API_URL.replace(/\/api$/, ''),
  APP_MERCHANT: read('APP_MERCHANT') || defaults.APP_MERCHANT,
  APP_STRIPE_KEY: STRIPE_KEY,
  // Card payments need a publishable key; without one fall back to money order.
  APP_PAYMENT_TYPE: requestedPayment === 'STRIPE' && STRIPE_KEY ? 'STRIPE' : 'MONEYORDER',
  APP_PRODUCT_GRID_LIMIT: read('APP_PRODUCT_GRID_LIMIT') || defaults.APP_PRODUCT_GRID_LIMIT,
  APP_MAP_API_KEY: read('APP_MAP_API_KEY') || defaults.APP_MAP_API_KEY,
  APP_THEME_COLOR: read('APP_THEME_COLOR') || defaults.APP_THEME_COLOR,
  // Public storefront origin ("https://shop.example.com") for canonical URLs, so
  // they match the backend sitemap (shopizer.storefront.base-url). Empty means
  // the origin the page was loaded from.
  APP_PUBLIC_URL: stripSlash(read('APP_PUBLIC_URL') || ''),
};

export default env;
