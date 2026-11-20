import { describe, expect, it } from 'vitest';
import { buildStockChartData } from './stockChartData';

const prices = (count: number) => Array.from({ length: count }, (_, index) => ({
  date: new Date(2025, 0, index + 1), currentPrice: index + 1,
}));

describe('250-day stock moving average', () => {
  it('waits for 250 sessions, then rolls forward without future prices', () => {
    const rows = buildStockChartData(prices(251));
    expect(rows[249][2]).toBeNull();
    expect(rows[250][2]).toBe(125.5);
    expect(rows[251][2]).toBe(126.5);
  });

  it('uses prior sessions without expanding the visible range', () => {
    const all = prices(251);
    const rows = buildStockChartData(all.slice(249), all.slice(0, 249));
    expect(rows).toHaveLength(3);
    expect(rows[1]).toEqual([all[249].date, 250, 125.5]);
    expect(rows[2][2]).toBe(126.5);
  });

  it('leaves gaps for incomplete or invalid windows and recovers after they expire', () => {
    const all = prices(501);
    all[249].currentPrice = NaN;
    const rows = buildStockChartData(all);
    expect(rows[250][2]).toBeNull();
    expect(rows[499][2]).toBeNull();
    expect(rows[500][2]).toBe(375.5);
    expect(buildStockChartData(prices(10)).slice(1).every(row => row[2] === null)).toBe(true);
    expect(buildStockChartData([])).toEqual([]);
  });
});
