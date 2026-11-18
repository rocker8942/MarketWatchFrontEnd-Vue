import { afterEach, describe, expect, it, vi } from 'vitest';
import StockChart from './StockChart.vue';
import { StockPriceClient, CompanyClient } from '@/core/services/marketWatchClient';

vi.mock('@/core/services/apiService', () => ({ default: { baseUrl: '', vueInstance: { axios: {} } } }));

afterEach(() => { vi.restoreAllMocks(); });

function context(period = '6M') {
  const options = StockChart as any;
  return { ...options.data(), selectedStockCode: 'AAPL', selectedPeriod: period,
    getPeriodDays: () => 180 };
}

describe('StockChart SMA history loading', () => {
  it('ignores an old response after a different stock has loaded', async () => {
    let finishOld: (value: any) => void = () => {};
    const old = new Promise<any>(resolve => { finishOld = resolve; });
    vi.spyOn(StockPriceClient.prototype, 'stockPriceGetStockPriceWithDetails')
      .mockReturnValueOnce(old).mockResolvedValueOnce({ items: [
        { code: '005930.KS', date: new Date('2026-01-05'), currentPrice: 70000, currencyCode: 'KRW' },
      ] } as any);
    vi.spyOn(CompanyClient.prototype, 'companyGetBySymbol').mockResolvedValue({} as any);
    const vm = context('MAX');
    const pending = (StockChart as any).methods.loadStockData.call(vm);
    vm.selectedStockCode = '005930.KS';
    await (StockChart as any).methods.loadStockData.call(vm);
    finishOld({ items: [{ code: 'AAPL', currencyCode: 'USD', currentPrice: 200 }] });
    await pending;
    expect(vm.loadedStockCode).toBe('005930.KS');
    expect(vm.latestPrice.currencyCode).toBe('KRW');
    expect((StockChart as any).methods.formatCurrency.call(vm, 70000)).toBe('KRW 70,000.00');
    expect(vm.loading).toBe(false);
  });

  it('uses reporting currency for company EPS independently of quote currency', () => {
    const vm = { latestPrice: { currencyCode: 'AUD' }, companyData: { currency: 'USD' } };
    expect((StockChart as any).methods.formatCurrency.call(vm, 10)).toBe('AUD 10.00');
    expect((StockChart as any).methods.formatFinancialCurrency.call(vm, 10)).toBe('USD 10.00');
  });

  it('compares a distinct prior session only when the quote currencies agree', () => {
    const latestPrice = { date: new Date('2026-06-02T16:00:00Z'), currentPrice: 100, currencyCode: 'AUD' };
    const sameSession = { date: new Date('2026-06-02T10:00:00Z'), currentPrice: 90, currencyCode: 'AUD' };
    const prior = { date: new Date('2026-06-01T16:00:00Z'), currentPrice: 80, currencyCode: 'AUD' };
    const quoteChange = (StockChart as any).computed.quoteChange;
    const vm = { latestPrice, stockPrices: [sameSession, latestPrice], movingAverageHistory: [prior] };
    expect(quoteChange.call(vm)).toBe(0.25);
    expect(quoteChange.call({ ...vm, movingAverageHistory: [{ ...prior, currencyCode: 'USD' }] })).toBeNull();
    expect(quoteChange.call({ ...vm, movingAverageHistory: [] })).toBeNull();
  });
  it('requests 249 sessions before the first visible date and retains the visible prices', async () => {
    const visible = [{ date: new Date('2026-06-02T00:00:00Z'), currentPrice: 251 },
      { date: new Date('2026-06-01T00:00:00Z'), currentPrice: 250 }];
    const history = [{ date: new Date('2026-05-29T00:00:00Z'), currentPrice: 249 }];
    const get = vi.spyOn(StockPriceClient.prototype, 'stockPriceGetStockPriceWithDetails')
      .mockResolvedValueOnce({ items: visible } as any).mockResolvedValueOnce({ items: history } as any);
    vi.spyOn(CompanyClient.prototype, 'companyGetBySymbol').mockResolvedValue({} as any);
    const vm = context();
    await (StockChart as any).methods.loadStockData.call(vm);
    expect(get.mock.calls[1]).toEqual(['date desc', 0, 249, 'AAPL', undefined,
      new Date('2026-05-31T23:59:59.999Z')]);
    expect(vm.stockPrices).toEqual(visible.slice().reverse());
    expect(vm.movingAverageHistory).toEqual(history);
    expect(vm.latestPrice).toEqual(visible[0]);
    expect(vm.loading).toBe(false);
  });

  it('uses the fallback dates for history when the selected range is empty', async () => {
    const get = vi.spyOn(StockPriceClient.prototype, 'stockPriceGetStockPriceWithDetails')
      .mockResolvedValueOnce({ items: [] } as any)
      .mockResolvedValueOnce({ items: [{ date: new Date('2024-01-02T00:00:00Z'), currentPrice: 10 }] } as any)
      .mockResolvedValueOnce({ items: [] } as any);
    vi.spyOn(CompanyClient.prototype, 'companyGetBySymbol').mockResolvedValue({} as any);
    await (StockChart as any).methods.loadStockData.call(context());
    expect(get.mock.calls[2][5]).toEqual(new Date('2024-01-01T23:59:59.999Z'));
  });

  it('uses the loaded history directly for MAX and clears previous warm-up data', async () => {
    const get = vi.spyOn(StockPriceClient.prototype, 'stockPriceGetStockPriceWithDetails')
      .mockResolvedValue({ items: [{ date: new Date('2024-01-02T00:00:00Z'), currentPrice: 10 }] } as any);
    vi.spyOn(CompanyClient.prototype, 'companyGetBySymbol').mockResolvedValue({} as any);
    const vm = context('MAX');
    vm.movingAverageHistory = [{ currentPrice: 99 }];
    await (StockChart as any).methods.loadStockData.call(vm);
    expect(get).toHaveBeenCalledTimes(1);
    expect(vm.movingAverageHistory).toEqual([]);
  });
});
