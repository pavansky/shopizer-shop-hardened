import { formatOrderAmount, formatMoney, orderGrandTotal } from './money';

describe('formatOrderAmount', () => {
  it('uses the server-formatted total when present', () => {
    expect(formatOrderAmount({ value: 249, total: 'CA$249.00' }, 'CAD', 'en')).toBe('CA$249.00');
  });

  it('formats the value in the order currency, not US dollars', () => {
    expect(formatOrderAmount({ value: 249 }, 'CAD', 'en')).toBe('CA$249.00');
    expect(formatOrderAmount({ value: 1200 }, 'JPY', 'en')).toBe('¥1,200');
    expect(formatOrderAmount({ value: 10.5 }, 'EUR', 'fr').replace(/\s/g, ' ')).toBe('10,50 €');
    expect(formatOrderAmount({ value: 249 }, 'CAD', 'en')).not.toContain('US$');
  });

  it('does not throw on an unknown currency code', () => {
    expect(formatMoney(5, 'XX', 'en')).toBe('5.00 XX');
  });

  it('returns an empty string when there is no amount', () => {
    expect(formatOrderAmount(undefined, 'CAD')).toBe('');
    expect(formatOrderAmount({ value: null }, 'CAD')).toBe('');
  });
});

describe('orderGrandTotal', () => {
  it('prefers the order total over the last line', () => {
    const total = { code: 'order.total.total', value: 30 };
    expect(orderGrandTotal({ total, totals: [{ value: 1 }] })).toBe(total);
  });

  it('finds the TOTAL line, otherwise the last line', () => {
    const lines = [{ code: 'order.total.subtotal', value: 20 }, { code: 'order.total.total', module: 'total', value: 30 }, { code: 'x', value: 1 }];
    expect(orderGrandTotal({ totals: lines }).value).toBe(30);
    expect(orderGrandTotal({ totals: [{ value: 1 }, { value: 2 }] }).value).toBe(2);
  });
});
