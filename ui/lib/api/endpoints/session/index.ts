import { api } from '../../index';
import type { SessionRecord, HistoryStats } from './types';

export type { SessionRecord, HistoryStats };

export const session = {
    getHistory: (userId: string, headers?: HeadersInit) =>
        api.get<{ history: SessionRecord[]; stats: HistoryStats }>(`/api/session/history/${userId}`, { headers }),

    deleteHistory: (userId: string, headers?: HeadersInit) =>
        api.delete(`/api/session/history/${userId}`, { headers }),

    getActiveCall: (headers?: HeadersInit) =>
        api.get<any>(`/api/session/call`, { headers }),

    getCurrentSession: (headers?: HeadersInit) =>
        api.get<{ active: boolean }>(`/api/session/current`, { headers }),
};
