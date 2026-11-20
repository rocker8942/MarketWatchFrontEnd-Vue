import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import type { AxiosInstance } from 'axios';
import { ElMessageBox } from 'element-plus';
import AnalysisUpdatePanel from './AnalysisUpdatePanel.vue';

const confirm = vi.spyOn(ElMessageBox, 'confirm');
const idle = { id: null, state: 'Idle', message: 'No update running.' };
const running = { id: 'job-1', state: 'Running', message: 'Rebuilding all stocks.' };
const failed = { id: 'job-1', state: 'Failed', message: '001800.KS on 2014-10-09: unresolved non-trading session.' };
const stubs = { ElButton: { props: ['disabled', 'loading'], template: '<button :disabled="disabled"><slot /></button>' } };
const wrappers: Array<{ unmount(): void }> = [];
function panel(client: unknown, disabled = false) {
    const wrapper = mount(AnalysisUpdatePanel, { props: { client: client as AxiosInstance, disabled }, global: { stubs } });
    wrappers.push(wrapper);
    return wrapper;
}
afterEach(() => { wrappers.splice(0).forEach(wrapper => wrapper.unmount()); vi.useRealTimers(); vi.clearAllMocks(); });

describe('Analysis update panel', () => {
    it('renders the skipped-row report on successful completion', async () => {
        const wrapper = panel({ get: vi.fn().mockResolvedValue({ data: { id: 'job-1', state: 'Completed', message: 'Updated with 1 skipped row',
            summary: { acceptedDailyRows: 100, skippedDailyRows: 1, skippedRows: [
                { stockCode: '001800.KS', tradeDate: '2014-10-09T00:00:00', reason: 'Unresolved invalid price' }] } } }), post: vi.fn() });
        await flushPromises();
        expect(wrapper.text()).toContain('Completed');
        expect(wrapper.get('details').text()).toContain('001800.KS');
        expect(wrapper.get('details').text()).toContain('2014-10-09');
        expect(wrapper.get('details').text()).toContain('Unresolved invalid price');
    });

    it('explains a permission denial and stops retrying forbidden requests', async () => {
        vi.useFakeTimers();
        const get = vi.fn().mockRejectedValue({ response: { status: 403 } });
        const post = vi.fn();
        const wrapper = panel({ get, post });
        await flushPromises();
        expect(wrapper.get('[role="alert"]').text()).toContain('server denied access');
        expect(wrapper.get('button').attributes('disabled')).toBeDefined();
        vi.advanceTimersByTime(9000);
        await flushPromises();
        expect(get).toHaveBeenCalledTimes(1);
        expect(post).not.toHaveBeenCalled();
    });

    it('confirms global scope, starts once, polls and exposes quality failure details', async () => {
        vi.useFakeTimers();
        confirm.mockImplementation(async () => 'confirm' as Awaited<ReturnType<typeof ElMessageBox.confirm>>);
        const get = vi.fn().mockResolvedValueOnce({ data: idle }).mockResolvedValue({ data: failed });
        const post = vi.fn().mockResolvedValue({ data: running });
        const wrapper = panel({ get, post });
        await flushPromises();
        await wrapper.get('button').trigger('click');
        await flushPromises();
        expect(ElMessageBox.confirm).toHaveBeenCalledWith(expect.stringContaining('all stocks'), expect.any(String), expect.any(Object));
        expect(post).toHaveBeenCalledWith('/api/app/analysis-update/start');
        expect(wrapper.get('button').attributes('disabled')).toBeDefined();
        vi.advanceTimersByTime(3000);
        await flushPromises();
        expect(wrapper.text()).toContain('001800.KS on 2014-10-09');
        expect(wrapper.get('button').attributes('disabled')).toBeUndefined();
        expect(post).toHaveBeenCalledTimes(1);
    });

    it('resumes monitoring an existing job and stops polling after unmount', async () => {
        vi.useFakeTimers();
        const get = vi.fn().mockResolvedValue({ data: running });
        const post = vi.fn();
        const wrapper = panel({ get, post });
        await flushPromises();
        expect(wrapper.text()).toContain('Rebuilding all stocks');
        expect(wrapper.get('button').attributes('disabled')).toBeDefined();
        wrapper.unmount();
        vi.advanceTimersByTime(9000);
        expect(get).toHaveBeenCalledTimes(1);
        expect(post).not.toHaveBeenCalled();
    });

    it('cancelling confirmation does not start an update', async () => {
        confirm.mockRejectedValue('cancel');
        const post = vi.fn();
        const wrapper = panel({ get: vi.fn().mockResolvedValue({ data: idle }), post });
        await flushPromises();
        await wrapper.get('button').trigger('click');
        await flushPromises();
        expect(post).not.toHaveBeenCalled();
    });

    it('does not claim completion when status polling fails', async () => {
        const wrapper = panel({ get: vi.fn().mockRejectedValue(new Error('Network unavailable')), post: vi.fn() });
        await flushPromises();
        expect(wrapper.get('[role="alert"]').text()).toContain('may still be running');
        expect(wrapper.text()).not.toContain('Completed');
    });
});
