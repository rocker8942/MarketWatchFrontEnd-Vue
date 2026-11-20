import { describe, it, expect, vi } from 'vitest';
import type { AxiosInstance } from 'axios';
import { refreshPrice, refreshKrxMaximum } from './stockPriceRefresh';

describe('price source selection', () => {
    it('batches maximum KRX history into contiguous exclusive ranges and skips empty batches', async () => {
        const post = vi.fn().mockResolvedValueOnce({ data: { success: true, recordsUpdated: 12 } })
            .mockResolvedValueOnce({ data: { success: true, recordsUpdated: 0 } })
            .mockResolvedValueOnce({ data: { success: true, recordsUpdated: 3 } });
        const progress = vi.fn();
        const result = await refreshKrxMaximum({ post } as unknown as AxiosInstance, '011810.KS', progress, () => false, '2010-03-10');
        expect(post).toHaveBeenCalledTimes(3);
        expect(post.mock.calls.map(call => [call[2].params.startDate, call[2].params.endDate])).toEqual([
            ['2010-01-04', '2010-02-03'], ['2010-02-03', '2010-03-05'], ['2010-03-05', '2010-03-10']
        ]);
        expect(result).toEqual({ success: true, stopped: false, recordsUpdated: 15 });
        expect(progress.mock.calls[2][0].completed).toBe(3);
    });
    it('stops between batches without discarding saved progress', async () => {
        const post = vi.fn().mockResolvedValue({ data: { success: true, recordsUpdated: 5 } });
        const result = await refreshKrxMaximum({ post } as unknown as AxiosInstance, '011810.KS', () => {}, () => post.mock.calls.length === 1, '2010-03-10');
        expect(post).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ success: true, stopped: true, recordsUpdated: 5 });
    });
    it('reports completed work and stops on a failed batch', async () => {
        const post = vi.fn().mockResolvedValueOnce({ data: { success: true, recordsUpdated: 5 } })
            .mockRejectedValueOnce({ response: { data: { error: { message: 'Quota exceeded' } } } });
        await expect(refreshKrxMaximum({ post } as unknown as AxiosInstance, '011810.KS', () => {}, () => false, '2010-03-10'))
            .rejects.toThrow('1/3 batches completed; 5 records updated. Quota exceeded');
        expect(post).toHaveBeenCalledTimes(2);
    });
    it('forwards KRX source and blocks unbounded KRX requests', async () => {
        const post = vi.fn().mockResolvedValue({ data: {} });
        const client = { post } as unknown as AxiosInstance;
        await refreshPrice(client, '011810.KS', 'KRX', false, 90);
        expect(post.mock.calls[0][2].params.source).toBe('KRX');
        await expect(refreshPrice(client, '011810.KS', 'KRX', true)).rejects.toThrow('365');
        await expect(refreshPrice(client, 'AAPL', 'KRX', false)).rejects.toThrow('Korean');
        expect(post).toHaveBeenCalledTimes(1);
    });
    it('passes selected Naver source with the Korean symbol', async () => {
        const post = vi.fn().mockResolvedValue({ data: { success: true } });
        await refreshPrice({ post } as unknown as AxiosInstance, '011810.KS', 'Naver', false);
        expect(post).toHaveBeenCalledWith('/api/app/stock-price/refresh-stock-price-from-yahoo', null,
            { params: { stockCode: '011810.KS', days: 30, fullHistory: false, source: 'Naver' } });
    });
    it('retains full-history Yahoo requests', async () => {
        const post = vi.fn().mockResolvedValue({ data: {} });
        await refreshPrice({ post } as unknown as AxiosInstance, 'AAPL', 'Yahoo', true);
        expect(post.mock.calls[0][2].params).toEqual({ stockCode: 'AAPL', days: undefined, fullHistory: true, source: 'Yahoo' });
    });
    it('blocks unsupported Naver combinations without sending a request', async () => {
        const post = vi.fn();
        const client = { post } as unknown as AxiosInstance;
        await expect(refreshPrice(client, 'AAPL', 'Naver', false)).rejects.toThrow('Naver supports');
        expect(post).not.toHaveBeenCalled();
    });
    it.each([90, 365, 1826])('forwards a %i day Naver range', async (days) => {
        const post = vi.fn().mockResolvedValue({ data: {} });
        await refreshPrice({ post } as unknown as AxiosInstance, '011810.KS', 'Naver', false, days);
        expect(post.mock.calls[0][2].params.days).toBe(days);
    });
    it('allows explicitly selected maximum available Naver history', async () => {
        const post = vi.fn().mockResolvedValue({ data: {} });
        await refreshPrice({ post } as unknown as AxiosInstance, '011810.KS', 'Naver', true);
        expect(post.mock.calls[0][2].params).toEqual({ stockCode: '011810.KS', days: undefined, fullHistory: true, source: 'Naver' });
    });
});
