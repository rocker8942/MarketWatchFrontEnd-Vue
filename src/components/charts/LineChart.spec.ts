import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import LineChart from './LineChart.vue';
vi.mock('vue-echarts', () => ({ default: { name: 'VChart', props: ['option'], template: '<div />' } }));

describe('LineChart series', () => {
  it('renders both named lines with a legend and a tooltip for all series', () => {
    const wrapper = shallowMount(LineChart, { props: { data: [
      ['Date', 'Fund NAV', 'S&P 500'], ['2026-01-05', 1, 1], ['2026-01-06', 1.2, 1.1],
    ] } });
    const option = wrapper.findComponent({ name: 'VChart' }).props('option');
    expect(option.series.map((s: any) => s.name)).toEqual(['Fund NAV', 'S&P 500']);
    expect(option.series[1].data).toEqual([1, 1.1]);
    expect(option.series[1].lineStyle.type).toBe('dashed');
    expect(option.series[0].color).not.toBe(option.series[1].color);
    expect(option.legend).toBeDefined();
    expect(option.tooltip.formatter).toBeUndefined();
    expect(option.tooltip.valueFormatter(1)).toBe('1.00');
    expect(option.tooltip.valueFormatter(1.23456)).toBe('1.23');
    expect(option.tooltip.valueFormatter(1.239)).toBe('1.24');
    expect(option.tooltip.valueFormatter(null)).toBe('—');
  });
  it('preserves a single series chart without adding a legend', () => {
    const wrapper = shallowMount(LineChart, { props: { data: [['Date', 'NAV'], ['2026-01-05', 1]] } });
    const option = wrapper.findComponent({ name: 'VChart' }).props('option');
    expect(option.series).toHaveLength(1);
    expect(option.legend).toBeUndefined();
    expect(option.tooltip.formatter).toBeTypeOf('function');
  });
});
