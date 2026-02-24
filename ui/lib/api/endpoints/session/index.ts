import { api } from '../../index';
import type { SessionRecord, HistoryStats } from './types';

export type { SessionRecord, HistoryStats };

export const session = {
    getHistory: (userId: string, headers?: HeadersInit) =>
        api.get<SessionRecord[]>(`/api/session/history/list/${userId}`, { headers }),

    getStats: (userId: string, headers?: HeadersInit) =>
        api.get<HistoryStats>(`/api/session/history/stats/${userId}`, { headers }),

    deleteHistory: (userId: string, headers?: HeadersInit) =>
        api.delete(`/api/session/history/delete/${userId}`, { headers }),
};
