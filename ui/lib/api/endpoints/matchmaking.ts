import { apiRequest } from '../core/apiRequest';

export const matchmaking = {
    joinQueue: (data: {
        user_id: string;
        mode: 'voice';
        preferences?: { language?: string; selected_country?: string; min_rating?: number };
        session?: { peer_id?: string; connection_id?: string };
        request_id?: string;
    }, headers?: HeadersInit) =>
        apiRequest<void>('/api/matchmaking/join', {
            method: 'POST',
            body: JSON.stringify(data),
            headers
        }),

    leaveQueue: (headers?: HeadersInit) =>
        apiRequest<void>('/api/matchmaking/leave', {
            method: 'POST',
            headers
        })
};
