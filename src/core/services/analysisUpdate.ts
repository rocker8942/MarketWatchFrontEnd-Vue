import type { AxiosInstance } from 'axios';

export interface AnalysisUpdateStatus {
    id: string | null;
    state: 'Idle' | 'Queued' | 'Running' | 'Completed' | 'Failed';
    message: string;
    summary?: { acceptedDailyRows: number; skippedDailyRows: number; skippedRows: SkippedAnalysisRow[] } | null;
}

export interface SkippedAnalysisRow { stockCode: string; tradeDate: string; reason: string; }

export const analysisUpdateActive = (status: AnalysisUpdateStatus | null): boolean =>
    status?.state === 'Queued' || status?.state === 'Running';

export async function getAnalysisUpdate(client: AxiosInstance): Promise<AnalysisUpdateStatus> {
    return (await client.get('/api/app/analysis-update/status')).data;
}

export async function startAnalysisUpdate(client: AxiosInstance): Promise<AnalysisUpdateStatus> {
    return (await client.post('/api/app/analysis-update/start')).data;
}
