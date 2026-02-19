import { api } from '../../index';
import type { FriendUser, FriendRequest } from './types';

export type { FriendUser, FriendRequest };

export const friends = {
    list: (headers?: HeadersInit) =>
        api.get<FriendUser[]>('/api/friends/lists', { headers }),

    getPending: (headers?: HeadersInit) =>
        api.get<FriendRequest[]>('/api/friends/pending', { headers }),

    sendRequest: (friendId: string, headers?: HeadersInit) =>
        api.post('/api/friends/request', { friendId }, { headers }),

    acceptRequest: (requestId: string, headers?: HeadersInit) =>
        api.post('/api/friends/accept', { requestId }, { headers }),

    declineRequest: (requestId: string, headers?: HeadersInit) =>
        api.post('/api/friends/decline', { requestId }, { headers }),

    removeFriend: (friendId: string, headers?: HeadersInit) =>
        api.delete(`/api/friends/${friendId}`, { headers }),
};
