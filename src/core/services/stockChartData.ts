export const MOVING_AVERAGE_DAYS = 250;

interface ChartPrice {
  date?: Date;
  currentPrice?: number;
}

// Both inputs are oldest-first; history contains only sessions before the visible range.
export function buildStockChartData(prices: ChartPrice[], history: ChartPrice[] = []): any[] {
  if (!prices.length) return [];

  const allPrices = [...history, ...prices];
  const data: any[] = [['Date', 'Price', '250-day SMA']];
  let sum = 0;
  let validCount = 0;
  for (let index = 0; index < allPrices.length; index++) {
    const value = allPrices[index].currentPrice;
    if (typeof value === 'number' && Number.isFinite(value)) {
      sum += value;
      validCount++;
    }
    if (index >= MOVING_AVERAGE_DAYS) {
      const expired = allPrices[index - MOVING_AVERAGE_DAYS].currentPrice;
      if (typeof expired === 'number' && Number.isFinite(expired)) {
        sum -= expired;
        validCount--;
      }
    }
    if (index >= history.length) {
      data.push([
        new Date(allPrices[index].date!),
        value,
        validCount === MOVING_AVERAGE_DAYS ? sum / MOVING_AVERAGE_DAYS : null,
      ]);
    }
  }
  return data;
}
