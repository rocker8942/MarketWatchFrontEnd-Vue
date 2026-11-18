import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SimulationExclusions from './SimulationExclusions.vue';

const finding = { stockCode: 'AAA', tradeDate: '2024-01-05T00:00:00', severity: 'Invalid', ruleId: 'invalid-ohlc', reason: 'Negative close price.' };

describe('simulation exclusions', () => {
  it('hides the notice when an older API omits exclusions', () => {
    expect(mount(SimulationExclusions).find('section').exists()).toBe(false);
  });
  it('shows every reason and reports skipped dates without claiming the whole stock was excluded', () => {
    const wrapper = mount(SimulationExclusions, { props: { exclusions: [finding, { ...finding, reason: 'High below low.' }] } });
    expect(wrapper.find('h3').text()).toContain('across 1 stock');
    expect(wrapper.text()).toContain('Other valid dates');
    expect(wrapper.findAll('tbody tr')).toHaveLength(2);
    for (const text of ['AAA', '2024-01-05', 'Invalid', 'invalid-ohlc', 'Negative close price.', 'High below low.']) {
      expect(wrapper.text()).toContain(text);
    }
  });
  it('updates the notice when async status supplies exclusions', async () => {
    const wrapper = mount(SimulationExclusions);
    await wrapper.setProps({ exclusions: [finding] });
    expect(wrapper.find('[role="status"]').text()).toContain('Negative close price.');
    await wrapper.setProps({ exclusions: [] });
    expect(wrapper.find('section').exists()).toBe(false);
  });
});
