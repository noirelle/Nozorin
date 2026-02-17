import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export const useFriends = (socket: any, token: string | null) => {
    const [friends, setFriends] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFriends = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        const response = await api.get<any[]>('/api/friends/list', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data) {
            setFriends(response.data);
            setError(null);
        } else {
            setError(response.error);
        }
        setIsLoading(false);
    }, [token]);

    const fetchPendingRequests = useCallback(async () => {
        if (!token) return;
        const response = await api.get<any[]>('/api/friends/pending', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data) {
            setPendingRequests(response.data);
        }
    }, [token]);

    const sendRequest = useCallback(async (receiverId: string) => {
        if (!token) return { success: false, error: 'Not authenticated' };
        const response = await api.post<any>('/api/friends/request', { receiverId }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return { success: !response.error, error: response.error };
    }, [token]);

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
        if (token) {
            fetchFriends();
            fetchPendingRequests();
        }
    }, [token, fetchFriends, fetchPendingRequests]);

    useEffect(() => {
        if (!socket) return;

        const handleRequestReceived = (data: any) => {
            console.log('[FRIENDS] Friend request received:', data);
            setPendingRequests(prev => [data, ...prev]);
        };

        const handleRequestAccepted = (data: any) => {
            console.log('[FRIENDS] Friend request accepted:', data);
            setFriends(prev => [data.friend, ...prev]);
        };

        socket.on('friend-request-received', handleRequestReceived);
        socket.on('friend-request-accepted', handleRequestAccepted);

        return () => {
            socket.off('friend-request-received', handleRequestReceived);
            socket.off('friend-request-accepted', handleRequestAccepted);
        };
    }, [socket]);

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
