import { apiRequest } from '../core/apiRequest';

export const matchmaking = {
    joinQueue: (data: {
        userId: string;
        mode: 'voice';
        preferences?: { language?: string; selectedCountry?: string; minRating?: number };
        session?: { peerId?: string; connectionId?: string };
        requestId?: string;
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
