import { accessibleThemeColor, contrastRatio, parseHex } from './contrast';

const WHITE = [255, 255, 255];
const PANEL = [249, 249, 249]; // cart and checkout totals background

describe('accessibleThemeColor', () => {
  it('darkens the default #D1D1D1 (1.53:1) until white text passes 4.5:1', () => {
    expect(contrastRatio(parseHex('#D1D1D1'), WHITE)).toBeCloseTo(1.53, 2);
    const fixed = accessibleThemeColor('#D1D1D1');
    expect(contrastRatio(parseHex(fixed), WHITE)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(parseHex(fixed), PANEL)).toBeGreaterThanOrEqual(4.5);
    // Grey stays grey.
    const [r, g, b] = parseHex(fixed);
    expect(r).toBe(g);
    expect(g).toBe(b);
  });

  it('keeps the hue of a light brand colour', () => {
    const fixed = parseHex(accessibleThemeColor('#fb799c'));
    expect(contrastRatio(fixed, WHITE)).toBeGreaterThanOrEqual(4.5);
    expect(fixed[0]).toBeGreaterThan(fixed[1]);
  });

  it('leaves a colour that already passes unchanged', () => {
    expect(accessibleThemeColor('#333333')).toBe('#333333');
    expect(accessibleThemeColor('#005fcc')).toBe('#005FCC');
  });

  it('passes through values it cannot parse', () => {
    expect(accessibleThemeColor('rebeccapurple')).toBe('rebeccapurple');
    expect(accessibleThemeColor(undefined)).toBe(undefined);
  });
});
