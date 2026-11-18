import { describe, it, expect } from 'vitest';
import { compareBenchmark, marketDate } from './benchmarkComparison';

describe('S&P 500 comparison', () => {
  it('normalizes to the prior close on a weekend and carries fund NAV across benchmark days', () => {
    const result = compareBenchmark([['2026-01-03', 1], ['2026-01-06', 1.2]], [
      { date: '2026-01-06', closePrice: 110 },
      { date: '2026-01-02', closePrice: 100 },
      { date: '2026-01-05', closePrice: 105 },
      { date: '2026-01-07', closePrice: 200 },
    ]);
    expect(result.rows).toEqual([['2026-01-03', 1, 1], ['2026-01-05', 1, 1.05], ['2026-01-06', 1.2, 1.1]]);
    expect(result.totalReturn).toBeCloseTo(0.1);
  });
  it('rejects missing, invalid and stale coverage instead of showing a misleading return', () => {
    const fund: [string, number][] = [['2026-01-05', 1], ['2026-02-05', 1.2]];
    for (const prices of [[], [{ date: '2026-01-05', closePrice: 0 }], [{ date: '2026-01-05', closePrice: 100 }], [{ date: '2026-02-05', closePrice: 100 }]]) {
      expect(() => compareBenchmark(fund, prices)).toThrow('do not cover');
    }
  });
  it('keeps calendar dates stable and final snapshot for same-day exits', () => {
    expect(marketDate('2026-01-05T00:00:00+08:00')).toBe('2026-01-05');
    const result = compareBenchmark([['2026-01-05', 1], ['2026-01-06', 1.1], ['2026-01-06', 1.3]], [
      { date: '2026-01-05', closePrice: 100 }, { date: '2026-01-06', closePrice: 120 },
    ]);
    expect(result.rows[1]).toEqual(['2026-01-06', 1.3, 1.2]);
  });
  it('leaves gaps for stale prices inside an otherwise covered period', () => {
    const result = compareBenchmark([['2026-01-01', 1], ['2026-01-15', 1.1], ['2026-01-20', 1.2]], [
      { date: '2026-01-01', closePrice: 100 }, { date: '2026-01-20', closePrice: 120 },
    ]);
    expect(result.rows[1][2]).toBeNull();
  });
});
