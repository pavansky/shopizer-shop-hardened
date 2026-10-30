// Browser tests for a running storefront. Not part of the storefront build.
//   cd tests/e2e && npm ci && npx playwright install chromium
//   BASE_URL=http://localhost:3000 npx playwright test
// PW_CHANNEL=chrome uses an installed Google Chrome instead of the downloaded Chromium.
// The stack must be seeded first: backend scripts/demo-checkout.sh creates the
// "furniture" category and the "oak-bench" product these specs use.
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './specs',
  timeout: 60000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}) },
  }],
});
