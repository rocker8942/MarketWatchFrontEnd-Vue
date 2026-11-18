import { describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import AreaChart from './AreaChart.vue';
import { formatChartAxisDateLabel } from './composables/useChartTheme';

vi.mock('vue-echarts', () => ({ default: { name: 'VChart', props: ['option'], template: '<div />' } }));

describe('AreaChart moving average overlay', () => {
  it('labels price series and tooltips without changing numerical chart data', () => {
    const wrapper = shallowMount(AreaChart, { props: { priceCurrency: 'KRW', data: [
      ['Date', 'Price', '250-day SMA'], ['2026-01-05', 70000, 69000],
    ] } });
    const option = wrapper.findComponent({ name: 'VChart' }).props('option');
    expect(option.yAxis.name).toBe('KRW');
    expect(option.tooltip.valueFormatter(70000)).toBe('KRW 70,000.00');
    expect(option.series[0].data).toEqual([70000]);
    wrapper.unmount();
  });
  it('keeps the price area and adds a distinct unfilled SMA with gaps', () => {
    const wrapper = shallowMount(AreaChart, { props: { data: [
      ['Date', 'Price', '250-day SMA'], ['2026-01-05', 2000, null], ['2026-01-06', 2200, 2100],
    ], color: '#d93025' } });
    const option = wrapper.findComponent({ name: 'VChart' }).props('option');
    expect(option.series.map((series: any) => series.name)).toEqual(['Price', '250-day SMA']);
    expect(option.series[0].areaStyle).toBeDefined();
    expect(option.series[1].areaStyle).toBeUndefined();
    expect(option.series[1].lineStyle.color).not.toBe(option.series[0].lineStyle.color);
    expect(option.series[1].lineStyle.type).toBe('dashed');
    expect(option.series[1].data).toEqual([null, 2100]);
    expect(option.series[1].connectNulls).toBe(false);
    expect(option.legend).toBeDefined();
    expect(option.tooltip.formatter).toBeUndefined();
    expect(option.tooltip.valueFormatter(2100)).toBe('2,100.00');
    expect(option.tooltip.valueFormatter(null)).toBe('—');
  });

  it('preserves charts with only a price series', () => {
    const wrapper = shallowMount(AreaChart, { props: { data: [['Date', 'Price'], ['2026-01-05', 20]] } });
    const option = wrapper.findComponent({ name: 'VChart' }).props('option');
    expect(option.series).toHaveLength(1);
    expect(option.legend).toBeUndefined();
    expect(option.tooltip.formatter).toBeTypeOf('function');
  });

  it('uses a simple yyyy-mm-dd date for the overlay tooltip heading', () => {
    const wrapper = shallowMount(AreaChart, { props: { data: [
      ['Date', 'Price', '250-day SMA'], [new Date(2026, 0, 5), 2000, 1900],
      [new Date(2026, 10, 15), 2200, 2100],
    ] } });
    const option = wrapper.findComponent({ name: 'VChart' }).props('option');
    // The default multi-series tooltip displays the category value as its heading.
    expect(option.tooltip.formatter).toBeUndefined();
    expect(option.xAxis.data).toEqual(['2026-01-05', '2026-11-15']);
  });

  it('keeps calendar dates intact on the daily axis and preserves time on timestamped axes', () => {
    const wrapper = shallowMount(AreaChart, { props: { data: [['Date', 'Price'], ['2026-01-05', 20]] } });
    const option = wrapper.findComponent({ name: 'VChart' }).props('option');
    expect(option.xAxis.data).toEqual(['2026-01-05']);
    expect(option.xAxis.axisLabel.formatter(option.xAxis.data[0])).toBe('Jan 05');
    expect(formatChartAxisDateLabel(new Date(2026, 0, 5, 13, 45))).toContain('01:45 PM');
    wrapper.unmount();
  });
});
