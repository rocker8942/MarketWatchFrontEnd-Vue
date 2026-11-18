import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import SkippedAnalysisRows from './SkippedAnalysisRows.vue';

describe('Skipped analysis rows report', () => {
    it('shows symbols, calendar dates and reasons with bounded pagination', async () => {
        const rows = Array.from({ length: 52 }, (_, index) => ({ stockCode: `SYM${index}`,
            tradeDate: new Date(Date.UTC(2024, 0, index + 1)).toISOString(), reason: 'Unresolved [price.zero-volume-discontinuity, Suspicious]' }));
        const wrapper = mount(SkippedAnalysisRows, { props: { rows } });
        expect(wrapper.get('summary').text()).toContain('52 skipped price rows');
        expect(wrapper.findAll('tbody tr')).toHaveLength(50);
        expect(wrapper.text()).toContain('2024-01-01');
        expect(wrapper.text()).toContain('ordinary warning rows are kept');
        await wrapper.findAll('button')[1].trigger('click');
        expect(wrapper.findAll('tbody tr')).toHaveLength(2);
        expect(wrapper.text()).toContain('SYM51');
        expect(wrapper.get('[role="status"]').text()).toBe('Page 2 of 2');
        await wrapper.setProps({ rows: rows.slice(0, 1) });
        expect(wrapper.get('[role="status"]').text()).toBe('Page 1 of 1');
        wrapper.unmount();
    });

    it('does not show an empty skipped report', () => {
        const wrapper = mount(SkippedAnalysisRows, { props: { rows: [] } });
        expect(wrapper.find('details').exists()).toBe(false);
        wrapper.unmount();
    });
});
