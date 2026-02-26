import { apiRequest } from '../../core/apiRequest';
import { JoinQueueRequest } from './types';

export type { JoinQueueRequest };

export const matchmaking = {
    joinQueue: (data: JoinQueueRequest, headers?: HeadersInit) =>
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
