export type NavPoint = [string, number];
export type BenchmarkPrice = { date: string; closePrice: number };

// Keep market calendar dates independent of browser locale and time zone.
export function marketDate(value: Date | string): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function compareBenchmark(fund: NavPoint[], prices: BenchmarkPrice[]) {
  const fundByDay = new Map(fund.map(([date, nav]) => [marketDate(date), nav]));
  const days = [...fundByDay.keys()].sort();
  const start = days[0];
  const end = days[days.length - 1];
  const valid = prices.filter(p => Number.isFinite(p.closePrice) && p.closePrice > 0)
    .map(p => ({ date: marketDate(p.date), closePrice: p.closePrice }))
    .filter(p => p.date <= end).sort((a, b) => a.date.localeCompare(b.date));
  const base = valid.filter(p => p.date <= start).pop();
  const last = valid[valid.length - 1];
  const age = (a: string, b: string) => (Date.parse(a) - Date.parse(b)) / 86400000;
  if (!start || !base || !last || age(start, base.date) > 7 || age(end, last.date) > 7) {
    throw new Error('S&P 500 prices do not cover this fund period. The fund chart is shown without the benchmark.');
  }
  const priceByDay = new Map(valid.map(p => [p.date, p.closePrice]));
  const timeline = [...new Set([...days, ...valid.filter(p => p.date >= start).map(p => p.date)])].sort();
  let nav = fundByDay.get(start)!;
  let price = base.closePrice;
  let priceDate = base.date;
  const rows = timeline.map(date => {
    nav = fundByDay.get(date) ?? nav;
    if (priceByDay.has(date)) { price = priceByDay.get(date)!; priceDate = date; }
    return [date, nav, age(date, priceDate) <= 7 ? price / base.closePrice : null];
  });
  return { rows, totalReturn: price / base.closePrice - 1 };
}
