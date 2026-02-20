import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocketEvent } from '../lib/socket';
import { SocketEvents } from '../lib/socket';
import { api } from '../lib/api';
import {
    FriendRequestReceivedPayload,
    FriendRequestAcceptedPayload,
} from '../lib/socket/friends/friends.types';

export const useFriends = (token: string | null) => {
    const [friends, setFriends] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isFetchingFriends = useRef(false);
    const isFetchingPending = useRef(false);

    const fetchFriends = useCallback(async () => {
        if (!token || isFetchingFriends.current) return;
        isFetchingFriends.current = true;
        setIsLoading(true);
        try {
            const response = await api.get<any[]>('/api/friends/list', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data) { setFriends(response.data); setError(null); }
            else setError(response.error);
        } finally {
            setIsLoading(false);
            isFetchingFriends.current = false;
        }
    }, [token]);

    const fetchPendingRequests = useCallback(async () => {
        if (!token || isFetchingPending.current) return;
        isFetchingPending.current = true;
        try {
            const response = await api.get<any[]>('/api/friends/pending', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data) setPendingRequests(response.data);
        } finally {
            isFetchingPending.current = false;
        }
    }, [token]);

    const sendRequest = useCallback(async (receiverId: string) => {
        if (!token) return { success: false, error: 'Not authenticated' };
        const response = await api.post<any>('/api/friends/request', { receiverId }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.error) { fetchPendingRequests(); return { success: true }; }
        return { success: false, error: response.error };
    }, [token, fetchPendingRequests]);

    const acceptRequest = useCallback(async (requestId: string) => {
        if (!token) return { success: false, error: 'Not authenticated' };
        const response = await api.post<any>('/api/friends/accept', { requestId }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.error) {
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
            fetchFriends();
            return { success: true };
        }
        return { success: false, error: response.error };
    }, [token, fetchFriends]);

    const declineRequest = useCallback(async (requestId: string) => {
        if (!token) return { success: false, error: 'Not authenticated' };
        const response = await api.post<any>('/api/friends/decline', { requestId }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.error) {
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
            return { success: true };
        }
        return { success: false, error: response.error };
    }, [token]);

    const removeFriend = useCallback(async (friendId: string) => {
        if (!token) return { success: false, error: 'Not authenticated' };
        const response = await api.delete<any>('/api/friends/remove', {
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({ friendId })
        });
        if (!response.error) {
            setFriends(prev => prev.filter(f => f.id !== friendId));
            return { success: true };
        }
        return { success: false, error: response.error };
    }, [token]);

    useEffect(() => {
        if (token) { fetchFriends(); fetchPendingRequests(); }
    }, [token, fetchFriends, fetchPendingRequests]);

    // ── Socket Listeners ──────────────────────────────────────────────────────

    const handleRequestReceived = useCallback((data: FriendRequestReceivedPayload) => {
        console.log('[FRIENDS] Friend request received:', data);
        setPendingRequests(prev => {
            if (prev.find(r => r.id === data.id)) return prev;
            return [data, ...prev];
        });
    }, []);

    const handleRequestAccepted = useCallback((data: FriendRequestAcceptedPayload) => {
        console.log('[FRIENDS] Friend request accepted:', data);
        setFriends(prev => {
            if (prev.find(f => f.id === data.friend.id)) return prev;
            return [data.friend, ...prev];
        });
        setPendingRequests(prev => prev.filter(r => r.id !== data.requestId));
    }, []);

    useSocketEvent<FriendRequestReceivedPayload>(SocketEvents.FRIEND_REQUEST_RECEIVED, handleRequestReceived);
    useSocketEvent<FriendRequestAcceptedPayload>(SocketEvents.FRIEND_REQUEST_ACCEPTED, handleRequestAccepted);

    return {
        friends,
        pendingRequests,
        isLoading,
        error,
        fetchFriends,
        fetchPendingRequests,
        sendRequest,
        acceptRequest,
        declineRequest,
        removeFriend
    };
};
