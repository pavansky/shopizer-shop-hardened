// WCAG 2.x contrast helpers for the merchant theme colour.
//
// The theme colour (APP_THEME_COLOR) is used both as a background behind
// white text (buttons such as "Place your order") and as a text colour on
// white. WCAG 1.4.3 asks for 4.5:1 in both cases, which is the same test:
// contrast between the colour and white. A colour that fails is darkened,
// keeping its hue, until it passes.

const MIN_CONTRAST = 4.5;

export function parseHex(color) {
  if (typeof color !== 'string') return null;
  let hex = color.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  return [0, 2, 4].map((i) => parseInt(hex.substr(i, 2), 16));
}

function toHex(rgb) {
  return '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function channel(v) {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function luminance(rgb) {
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

export function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const WHITE = [255, 255, 255];

// Returns the colour unchanged when it already reaches 4.5:1 against white,
// otherwise the lightest darker shade of it that does. Unparseable values
// (named colours, rgb()) are returned as they are.
export function accessibleThemeColor(color) {
  const rgb = parseHex(color);
  if (!rgb) return color;
  if (contrastRatio(rgb, WHITE) >= MIN_CONTRAST) return toHex(rgb);
  let low = 0;
  let high = 1;
  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const shade = rgb.map((v) => v * mid);
    if (contrastRatio(shade, WHITE) >= MIN_CONTRAST) low = mid; else high = mid;
  }
  return toHex(rgb.map((v) => Math.floor(v * low)));
}
