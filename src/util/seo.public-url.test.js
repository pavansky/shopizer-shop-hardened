import { canonicalUrl } from './seo';

// APP_PUBLIC_URL as env.js resolves it from window._env_ or REACT_APP_PUBLIC_URL.
jest.mock('./env', () => ({ __esModule: true, default: { APP_PUBLIC_URL: 'https://www.shop.example' } }));

describe('canonicalUrl with a configured public URL', () => {
  it('uses the public URL instead of the page origin', () => {
    expect(window.location.origin).not.toBe('https://www.shop.example');
    expect(canonicalUrl('/category/tables')).toBe('https://www.shop.example/category/tables');
  });

  it('still lets a caller pass an explicit origin', () => {
    expect(canonicalUrl('/product/oak-bench', 'https://preview.example')).toBe('https://preview.example/product/oak-bench');
  });
});
