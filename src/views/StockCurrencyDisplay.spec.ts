import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';
import { createMemoryHistory, createRouter } from 'vue-router';
import StockPrice from './StockPrice.vue';
import MoversView from './MoversView.vue';
import { StockInfoClient, StockPriceClient } from '@/core/services/marketWatchClient';
import ApiService from '@/core/services/apiService';

vi.mock('@/core/services/apiService', () => ({ default: { baseUrl: '', vueInstance: { axios: { get: vi.fn() } } } }));
afterEach(() => { vi.restoreAllMocks(); });

const entries = [
  { code: 'BHP.AX', name: 'Australian', currencyCode: 'AUD', currentPrice: 1234.5, previousPrice: 1000, changePercent: 23.45, volume: 100, date: new Date() },
  { code: '005930.KS', name: 'Korean', currencyCode: 'KRW', currentPrice: 70000, previousPrice: 69000, changePercent: 1.45, volume: 200, date: new Date() },
  { code: 'UNKNOWN', name: 'Unknown', currencyCode: null, currentPrice: 0, previousPrice: 10, changePercent: -100, volume: 0, date: new Date() },
];

async function createTestRouter() {
  const placeholder = { template: '<div />' };
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: placeholder },
      { path: '/stockChart', name: 'stockChart', component: placeholder },
    ],
  });
  await router.push('/');
  return router;
}

describe('stock currency display surfaces', () => {
  it('renders mixed currencies in the price table and retains numeric price data', async () => {
    vi.spyOn(StockInfoClient.prototype, 'stockInfoGetList').mockResolvedValue({ items: [] } as any);
    const getQuotes = vi.spyOn(StockPriceClient.prototype, 'stockPriceGetStockPriceWithDetails').mockResolvedValue({ items: entries, totalCount: 3 } as any);
    const wrapper = mount(StockPrice, { global: { plugins: [ElementPlus, await createTestRouter()] } });
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(wrapper.text()).toContain('AUD 1,234.50');
    expect(wrapper.text()).toContain('KRW 70,000.00');
    expect(wrapper.text()).toContain('0.00 (currency unknown)');
    expect((wrapper.vm as any).formattedProducts[0].currentPrice).toBe(1234.5);
    expect(getQuotes).toHaveBeenCalledWith(undefined, 0, 25, undefined, undefined, undefined);
    expect(wrapper.get('a.quote-symbol').attributes('href')).toBe('/stockChart?stockCode=BHP.AX');
    await wrapper.get('th .sort-button').trigger('click');
    expect(getQuotes).toHaveBeenLastCalledWith('StockInfo.Name asc, Id asc', 0, 25, undefined, undefined, undefined);
    wrapper.unmount();
  });

  it('renders current/previous mover prices with per-row currency and keeps percentages', async () => {
    vi.mocked(ApiService.vueInstance.axios.get).mockResolvedValue({ data: { topGainers: entries.slice(0, 2), topLosers: entries.slice(2) } });
    const wrapper = mount(MoversView, { global: { plugins: [ElementPlus, await createTestRouter()] } });
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(wrapper.text()).toContain('AUD 1,234.50');
    expect(wrapper.text()).toContain('KRW 69,000.00');
    expect(wrapper.text()).toContain('0.00 (currency unknown)');
    expect(wrapper.text()).toContain('+23.45%');
    expect(wrapper.text()).toContain('−100.00%');
    const disclosure = wrapper.get('button[aria-label="Price details for 005930.KS"]');
    expect(disclosure.attributes('aria-expanded')).toBe('false');
    await disclosure.trigger('click');
    expect(disclosure.attributes('aria-expanded')).toBe('true');
    const detail = wrapper.get('#' + disclosure.attributes('aria-controls'));
    expect(detail.text()).toContain('Previous price KRW 69,000.00');
    expect(detail.get('a').attributes('target')).toBe('_blank');
    wrapper.unmount();
  });
});
