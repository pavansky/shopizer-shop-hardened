// Order amounts in the order's own currency.
//
// ReadableOrderTotal.total is the amount already formatted by the server in
// the store's currency (pricingService.getDisplayAmount); the order list and
// detail endpoints do not always fill it, so the numeric value is formatted
// with the order's ISO currency code (ReadableOrder.currency) instead.
// Nothing here assumes US dollars.
export function formatOrderAmount(total, currency, locale) {
  if (total === undefined || total === null) {
    return '';
  }
  if (typeof total === 'object') {
    if (total.total) {
      return total.total;
    }
    return formatMoney(total.value, currency, locale);
  }
  return formatMoney(total, currency, locale);
}

export function formatMoney(value, currency, locale) {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return String(value);
  }
  if (currency) {
    try {
      return new Intl.NumberFormat(locale || 'en', { style: 'currency', currency: currency }).format(amount);
    } catch (e) {
      // Unknown currency code: show the code next to the number.
      return amount.toFixed(2) + ' ' + currency;
    }
  }
  return amount.toFixed(2);
}

// The grand total of an order: the TOTAL line if present, otherwise the last line.
export function orderGrandTotal(order) {
  if (!order) {
    return undefined;
  }
  if (order.total) {
    return order.total;
  }
  const totals = order.totals || [];
  const grand = totals.find((t) => t && (t.code === 'order.total.total' || t.module === 'total'));
  return grand || totals[totals.length - 1];
}
