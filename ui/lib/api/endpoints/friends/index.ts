import { api } from '../../index';
import type { FriendUser, FriendRequest } from './types';

export type { FriendUser, FriendRequest };

export const friends = {
    list: (headers?: HeadersInit) =>
        api.get<FriendUser[]>('/api/friends', { headers }),

    getRequests: (headers?: HeadersInit) =>
        api.get<FriendRequest[]>('/api/friends/requests', { headers }),

    sendRequest: (friendId: string, headers?: HeadersInit) =>
        api.post(`/api/friends/${friendId}/request`, {}, { headers }),

    acceptRequest: (requestId: string, headers?: HeadersInit) =>
        api.post(`/api/friends/${requestId}/accept`, {}, { headers }),

    declineRequest: (requestId: string, headers?: HeadersInit) =>
        api.post(`/api/friends/${requestId}/decline`, {}, { headers }),

    removeFriend: (friendId: string, headers?: HeadersInit) =>
        api.delete(`/api/friends/${friendId}`, { headers }),
};
