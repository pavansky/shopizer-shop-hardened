#!/usr/bin/env node
/*
 * Accessibility check: runs axe-core in Chromium against the production
 * build (build/) on the home, category, product, cart and checkout pages and
 * fails when it finds a serious or critical WCAG 2.x A/AA violation.
 *
 * The build is served by a small local server that also answers /api/* and
 * /actuator/health:
 *   - replay (default): from a11y/fixtures.json, so CI needs no backend;
 *   - live:   A11Y_BACKEND=http://localhost:8080 proxies to a running backend;
 *             add A11Y_RECORD=1 to rewrite fixtures.json from that backend
 *             (seed it first with scripts/demo-checkout.sh).
 *
 * Usage: npm run build && npm run a11y
 * Env:   A11Y_PORT (5055), A11Y_CATEGORY (furniture), A11Y_PRODUCT (oak-bench),
 *        A11Y_REPORT (path of a JSON report, optional),
 *        A11Y_CHROME (a Chromium binary to use instead of Playwright's download).
 */
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { URL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const FIXTURES = path.join(__dirname, 'fixtures.json');
const PORT = Number(process.env.A11Y_PORT || 5055);
const ORIGIN = `http://localhost:${PORT}`;
const BACKEND = (process.env.A11Y_BACKEND || '').replace(/\/+$/, '');
const RECORD = BACKEND && process.env.A11Y_RECORD === '1';
const CATEGORY = process.env.A11Y_CATEGORY || 'furniture';
const PRODUCT = process.env.A11Y_PRODUCT || 'oak-bench';
const FAIL_ON = ['serious', 'critical'];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject', '.txt': 'text/plain', '.map': 'application/json',
};

let fixtures = { meta: {}, responses: {} };
if (!RECORD) {
  if (fs.existsSync(FIXTURES)) fixtures = JSON.parse(fs.readFileSync(FIXTURES, 'utf8'));
  else if (!BACKEND) {
    console.error('No a11y/fixtures.json and no A11Y_BACKEND: nothing to answer API calls with.');
    process.exit(2);
  }
}
const missing = new Set();

const key = (method, url) => `${method} ${url}`;

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

function proxy(req, res, body) {
  return new Promise((resolve) => {
    const target = new URL(BACKEND + req.url);
    const headers = { ...req.headers, host: target.host };
    delete headers.origin;
    delete headers.referer;
    const upstream = http.request(target, { method: req.method, headers }, (up) => {
      const chunks = [];
      up.on('data', (c) => chunks.push(c));
      up.on('end', () => {
        const buf = Buffer.concat(chunks);
        const type = up.headers['content-type'] || 'application/json';
        if (RECORD && /json|text|xml/.test(type)) {
          fixtures.responses[key(req.method, req.url)] = { status: up.statusCode, type, body: buf.toString('utf8') };
        }
        res.writeHead(up.statusCode, { 'content-type': type });
        res.end(buf);
        resolve();
      });
    });
    upstream.on('error', (e) => {
      res.writeHead(502, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ message: e.message }));
      resolve();
    });
    upstream.end(body);
  });
}

async function api(req, res) {
  const body = await readBody(req);
  if (BACKEND) return proxy(req, res, body);
  const hit = fixtures.responses[key(req.method, req.url)];
  if (!hit) {
    missing.add(key(req.method, req.url));
    res.writeHead(404, { 'content-type': 'application/json' });
    return res.end('{"message":"no fixture"}');
  }
  res.writeHead(hit.status, { 'content-type': hit.type });
  return res.end(hit.body);
}

function serveStatic(req, res) {
  const pathname = decodeURIComponent(new URL(req.url, ORIGIN).pathname);
  if (pathname === '/env-config.js') {
    // Same-origin API, so neither CORS nor the build-time API URL matters here.
    res.writeHead(200, { 'content-type': MIME['.js'] });
    return res.end('window._env_ = { APP_API_URL: "/api", APP_MERCHANT: "DEFAULT", APP_PAYMENT_TYPE: "MONEYORDER" };');
  }
  let file = path.join(BUILD, pathname);
  if (!file.startsWith(BUILD) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(BUILD, 'index.html');
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  return fs.createReadStream(file).pipe(res);
}

async function addToCart(page) {
  const button = page.locator('.pro-details-cart button:not([disabled])').first();
  if (await button.count()) {
    await button.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  } else {
    console.log('  (product cannot be added to the cart; cart and checkout are checked empty)');
  }
}

function startServer() {
  const server = http.createServer((req, res) => {
    // The header checks /actuator/health before it loads the store.
    if (req.url.startsWith('/api/') || req.url.startsWith('/actuator/health')) return api(req, res);
    return serveStatic(req, res);
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

async function main() {
  if (!fs.existsSync(path.join(BUILD, 'index.html'))) {
    console.error('build/index.html not found; run npm run build first.');
    process.exit(2);
  }
  const { chromium } = require('playwright-core');
  const AxeBuilder = require('@axe-core/playwright').default;

  const server = await startServer();
  // The product page puts one item in the cart, as a shopper would, so the
  // cart and checkout pages are checked with content.
  const pages = [
    ['home', '/'],
    ['category', `/category/${CATEGORY}`],
    ['product', `/product/${PRODUCT}`, addToCart],
    ['cart', '/cart'],
    ['checkout', '/checkout'],
  ];

  const browser = await chromium.launch({ executablePath: process.env.A11Y_CHROME || undefined });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  // Only the local server is reachable; product images and fonts from other
  // hosts are not needed for the rules checked here.
  await context.route('**/*', (route) => (route.request().url().startsWith(ORIGIN) ? route.continue() : route.abort()));

  const report = [];
  let failures = 0;
  for (const [name, url, after] of pages) {
    const page = await context.newPage();
    await page.goto(ORIGIN + url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const violations = result.violations.map((v) => ({
      id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length,
      targets: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
    }));
    const blocking = violations.filter((v) => FAIL_ON.includes(v.impact));
    failures += blocking.length;
    report.push({ page: name, url, title: await page.title(), violations });
    console.log(`\n${name} ${url}  title="${await page.title()}"  ${violations.length} violation(s), ${blocking.length} serious/critical`);
    for (const v of violations) {
      console.log(`  [${v.impact}] ${v.id} (${v.nodes} node(s)): ${v.help}`);
      v.targets.forEach((t) => console.log(`      ${t}`));
    }
    if (after) await after(page);
    await page.close();
  }
  await browser.close();
  server.close();

  if (RECORD) {
    fs.writeFileSync(FIXTURES, JSON.stringify(fixtures, null, 1) + '\n');
    console.log(`\nRecorded ${Object.keys(fixtures.responses).length} API responses to ${path.relative(ROOT, FIXTURES)}`);
  }
  if (missing.size) {
    console.log('\nAPI calls without a fixture (answered 404):');
    missing.forEach((m) => console.log('  ' + m));
  }
  if (process.env.A11Y_REPORT) fs.writeFileSync(process.env.A11Y_REPORT, JSON.stringify(report, null, 2));

  if (failures) {
    console.error(`\n${failures} serious/critical accessibility violation(s).`);
    process.exit(1);
  }
  console.log('\nNo serious or critical accessibility violations.');
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
