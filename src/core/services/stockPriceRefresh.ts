import type { AxiosInstance } from 'axios';

export type PriceSource = 'Yahoo' | 'Naver' | 'KRX';
export const supportsNaver = (code: string): boolean => /^[0-9]{6}\.(KS|KQ)$/i.test(code);

export interface KrxProgress { completed: number; total: number; recordsUpdated: number; startDate: string; endDate: string; }

// End dates are exclusive. Monthly batches keep every HTTP request bounded.
export async function refreshKrxMaximum(client: AxiosInstance, code: string,
    onProgress: (progress: KrxProgress) => void, shouldStop: () => boolean,
    endDate = new Date().toISOString().slice(0, 10)) {
    if (!supportsNaver(code)) throw new Error('KRX supports Korean .KS/.KQ stocks only.');
    const end = new Date(`${endDate}T00:00:00Z`).getTime();
    const first = Date.UTC(2010, 0, 4);
    const batch = 30 * 86400000;
    if (!Number.isFinite(end) || end <= first) throw new Error('Invalid KRX history end date.');
    const total = Math.ceil((end - first) / batch);
    let recordsUpdated = 0;
    let completed = 0;
    for (let start = first; start < end; start += batch) {
        if (shouldStop()) return { success: true, stopped: true, recordsUpdated };
        const startDate = new Date(start).toISOString().slice(0, 10);
        const batchEnd = new Date(Math.min(start + batch, end)).toISOString().slice(0, 10);
        try {
            const response = (await client.post('/api/app/stock-price/refresh-stock-price-from-yahoo', null, {
                params: { stockCode: code, source: 'KRX', fullHistory: false, startDate, endDate: batchEnd }
            })).data;
            if (!response?.success) throw new Error(response?.message || 'KRX batch failed.');
            recordsUpdated += response.recordsUpdated || 0;
        } catch (error: any) {
            const reason = error?.response?.data?.error?.message || error?.message || 'Request failed.';
            throw new Error(`KRX refresh stopped at ${startDate}–${batchEnd}. ${completed}/${total} batches completed; ${recordsUpdated} records updated. ${reason}`);
        }
        completed++;
        onProgress({ completed, total, recordsUpdated, startDate, endDate: batchEnd });
    }
    return { success: true, stopped: false, recordsUpdated };
}

export async function refreshPrice(client: AxiosInstance, code: string, source: PriceSource, fullHistory: boolean, days = 30) {
    if ((source === 'Naver' || source === 'KRX') && !supportsNaver(code)) {
        throw new Error(`${source} supports Korean .KS/.KQ stocks only.`);
    }
    if (source === 'KRX' && (fullHistory || days > 365)) throw new Error('KRX supports up to 365 calendar days per refresh.');
    return (await client.post('/api/app/stock-price/refresh-stock-price-from-yahoo', null, {
        params: { stockCode: code, days: fullHistory ? undefined : days, fullHistory, source }
    })).data;
}
