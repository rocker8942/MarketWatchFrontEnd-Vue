import { describe, expect, it } from 'vitest';
import { formatStockPrice } from './stockCurrency';

describe('stock quote currency formatting', () => {
  it.each(['AUD', 'KRW', 'USD'])('shows explicit %s and two decimals', code => {
    expect(formatStockPrice(70000, code)).toBe(`${code} 70,000.00`);
    expect(formatStockPrice(0, code)).toBe(`${code} 0.00`);
    expect(formatStockPrice(-1234.5, code)).toBe(`${code} -1,234.50`);
  });
  it.each([null, undefined, 'GBp', 'WON', 'usd'])('identifies unknown code %s', code => {
    expect(formatStockPrice(10, code)).toBe('10.00 (currency unknown)');
  });
  it.each([null, undefined, NaN, Infinity])('preserves missing values %s', value => {
    expect(formatStockPrice(value, 'AUD')).toBe('—');
  });
});
