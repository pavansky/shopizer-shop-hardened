# Shopizer storefront (hardened fork)

A fork of [shopizer-shop-reactjs](https://github.com/shopizer-ecommerce/shopizer-shop-reactjs)
(React 16, Create React App 4) that runs against the hardened Shopizer backend.
The upstream README is kept in [UPSTREAM-README.md](UPSTREAM-README.md).
The starting point is tagged `baseline-upstream`.

## What changed

| Area | Upstream | This fork |
|---|---|---|
| Product page | `GET /products/{id}` (removed from the backend); id taken from the last click | `GET /api/v1/product/{friendlyUrl}` using the slug in the URL |
| Deep links | Reloading `/product/{slug}` requested `/products//reviews` | Reviews load with the id returned by the product lookup |
| Option pricing | `POST /product/{id}/price` (removed) | `POST /api/v2/product/{id}/variation` with `{options:[{option,value}]}` |
| Category facets | `category/{id}/manufacturers/` and `category/{id}/variants/` (do not exist) | `GET /api/v1/category/{id}/manufacturer`, `GET /api/v2/category/{id}/variations`; deep links resolve the slug |
| Remove from cart | Sent the product id to `/cart/{code}/product/{sku}`; item never removed | Sends the SKU and stores the remaining cart returned by the backend |
| After checkout | Cart clearing was commented out; consumed cart kept | Cart state, stored code and cookie cleared |
| HTTP errors | Interceptor crashed on network errors; 401 ignored | Network errors normalised (status 0); 401 on an authenticated call logs out and redirects to `/login` |
| Change password | `POST /customer/password/` (does not exist) | `POST /api/v1/auth/customer/password` |
| Payments | Nuvei branch was a hard-coded test-gateway form; config carried `APP_NUVEI_SECRET` to the browser; card token not actually sent | No secrets in the client. Money order (offline) by default; Stripe Elements when a `pk_` publishable key is set |
| Checkout retries | No idempotency | Fresh `Idempotency-Key` per attempt, reused on automatic retry and on resubmit while the outcome is unknown |
| Payment pending | 202 would show as success/failure | `202 {errorCode:"payment_pending"}` shows an "order received, payment being confirmed" page (`/order-pending`) |
| Configuration | `window._env_` only, defaulting to `localhost:8080` | One module (`src/util/env.js`): `window._env_` at runtime, then `REACT_APP_*` at build time, then defaults |
| Build | Lockfile out of sync (`npm ci` failed), Node 13 | Node 16, `npm ci` works, GitHub Actions CI, `vercel.json` for SPA routing |

## Build and run

Node 16 is required (CRA 4 / webpack 4 does not build on Node 17+).

```sh
npm ci
REACT_APP_API_URL=https://shop-api.example.com/api npm run build   # output in build/
npm start                                                          # dev server on :3000
```

With Docker only:

```sh
docker run --rm -v "$PWD":/app -w /app node:16 sh -c "npm ci && npm run build"
```

Container image (nginx; `env.sh` rewrites `env-config.js` from the environment at start):

```sh
docker build -t shopizer-shop .
docker run --rm -p 80:80 -e APP_API_URL=http://localhost:8080/api -e APP_MERCHANT=DEFAULT shopizer-shop
```

Static hosting: serve `build/` with every unknown path rewritten to `index.html`
(`vercel.json` does this on Vercel). To repoint an existing build, edit
`build/env-config.js`; no rebuild is needed.

### Cross-origin vs same-origin

When the storefront and the API are on different origins, the backend must
allow the storefront origin (`-Dshopizer.cors.allowed-origins=https://shop.example.com`)
**and** list `Idempotency-Key` in `Access-Control-Allow-Headers`. The backend
currently hard-codes that header list without `Idempotency-Key`, so a browser
blocks the checkout preflight and checkout cannot complete cross-origin.

Until that is changed, serve the API from the storefront origin through a
reverse proxy and set `APP_API_URL=/api` (a relative value is resolved against
the page origin). nginx:

```nginx
location /api/      { proxy_pass http://backend:8080; }
location /actuator/ { proxy_pass http://backend:8080; }
location /          { root /usr/share/nginx/html; try_files $uri $uri/ /index.html; }
```

On Vercel, add `{ "source": "/api/:path*", "destination": "https://api.example.com/api/:path*" }`
(and the same for `/actuator/:path*`) before the catch-all rewrite in `vercel.json`.

## Environment variables

Each setting can be given at runtime as `APP_X` (in `env-config.js` / container
environment) or at build time as `REACT_APP_X`. Runtime wins when non-empty.

| Runtime (`window._env_`) | Build time | Default | Meaning |
|---|---|---|---|
| `APP_API_URL` | `REACT_APP_API_URL` | `http://localhost:8080/api` | Backend API base, `<host>/api`. v1 and v2 paths are derived from it |
| `APP_BASE_URL` | `REACT_APP_BASE_URL` | | Legacy: backend host without `/api`; used only if `APP_API_URL` is unset |
| `APP_MERCHANT` | `REACT_APP_MERCHANT` | `DEFAULT` | Store code |
| `APP_PAYMENT_TYPE` | `REACT_APP_PAYMENT_TYPE` | `MONEYORDER` | `MONEYORDER` or `STRIPE` (falls back to money order without a key) |
| `APP_STRIPE_KEY` | `REACT_APP_STRIPE_KEY` | | Stripe **publishable** key (`pk_...`). Any other key is refused |
| `APP_PRODUCT_GRID_LIMIT` | `REACT_APP_PRODUCT_GRID_LIMIT` | `15` | Products per category page |
| `APP_MAP_API_KEY` | `REACT_APP_MAP_API_KEY` | | Google Maps browser key (address autocomplete, contact map) |
| `APP_THEME_COLOR` | `REACT_APP_THEME_COLOR` | `#D1D1D1` | Theme colour |

Everything above is delivered to the browser. Gateway secrets (Stripe secret
key, webhook secret) belong in the backend configuration only.

## Backend endpoints used

All under `<APP_API_URL>`:

- `GET v1/store/{code}`, `GET v1/category`, `GET v1/category/{friendlyUrl}`, `GET v1/products?category=`
- `GET v1/product/{friendlyUrl}`, `GET v1/product/{id}/reviews`, `POST v2/product/{id}/variation`
- `GET v1/category/{id}/manufacturer`, `GET v2/category/{id}/variations`
- `POST v1/cart`, `PUT v1/cart/{code}`, `GET v1/cart/{code}`, `DELETE v1/cart/{code}/product/{sku}?body=true`
- `POST v1/cart/{code}/checkout` (guest), `POST v1/auth/cart/{code}/checkout` (signed in), header `Idempotency-Key`
- `POST v1/auth/customer/password`
