import WebService from './webService';

// Payment outcome codes the backend can return from checkout.
export const PAYMENT_PENDING = 'payment_pending';

// A random UUID v4 for the Idempotency-Key header.
export function newIdempotencyKey() {
  const c = typeof window !== 'undefined' && (window.crypto || window.msCrypto);
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === 'function') {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// Status codes where the outcome of the request is unknown: the order may
// or may not have been placed. Retrying with the same key is safe because
// the backend replays the first result instead of charging again.
export function isOutcomeUnknown(status) {
  return status === 0 || status === 502 || status === 503 || status === 504;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// POST a checkout with the attempt's Idempotency-Key, retrying a couple of
// times on network errors and gateway timeouts with the same key.
// Resolves with the response body: an order confirmation (200) or
// {errorCode: 'payment_pending'} (202).
export async function submitCheckout(action, body, idempotencyKey, retries = 2) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await WebService.post(action, body, {
        headers: { 'Idempotency-Key': idempotencyKey },
      });
    } catch (error) {
      const status = error && error.response ? error.response.status : 0;
      if (attempt < retries && isOutcomeUnknown(status)) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      throw error;
    }
  }
}
