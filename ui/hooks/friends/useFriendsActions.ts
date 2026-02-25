import { useCallback } from 'react';
import { api } from '../../lib/api';
import { UseFriendsStateReturn } from './useFriendsState';
import * as historyActions from '../../lib/socket/history/history.actions';

interface UseFriendsActionsProps {
    token: string | null;
    setFriends: UseFriendsStateReturn['setFriends'];
    setPendingRequests: UseFriendsStateReturn['setPendingRequests'];
    setSentRequests: UseFriendsStateReturn['setSentRequests'];
    setIsLoading: UseFriendsStateReturn['setIsLoading'];
    setError: UseFriendsStateReturn['setError'];
    isFetchingFriends: UseFriendsStateReturn['isFetchingFriends'];
    isFetchingPending: UseFriendsStateReturn['isFetchingPending'];
    isFetchingSent: UseFriendsStateReturn['isFetchingSent'];
}

export const useFriendsActions = ({
    token,
    setFriends,
    setPendingRequests,
    setSentRequests,
    setIsLoading,
    setError,
    isFetchingFriends,
    isFetchingPending,
    isFetchingSent,
}: UseFriendsActionsProps) => {
    const fetchFriends = useCallback(async () => {
        if (!token || isFetchingFriends.current) return;
        isFetchingFriends.current = true;
        setIsLoading(true);
        try {
            const response = await api.get<any[]>('/api/friends', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data) {
                setFriends(response.data);
                setError(null);
                const friendIds = response.data.map((f: any) => f.id);
                if (friendIds.length > 0) historyActions.emitWatchUserStatus(friendIds);
            }
            else setError(response.error ?? null);
        } finally {
            setIsLoading(false);
            isFetchingFriends.current = false;
        }
    }, [token, setFriends, setIsLoading, setError, isFetchingFriends]);

    const fetchPendingRequests = useCallback(async () => {
        if (!token || isFetchingPending.current) return;
        isFetchingPending.current = true;
        try {
            const response = await api.get<any[]>('/api/friends/requests', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data) {
                setPendingRequests(response.data);
                const userIds = response.data.map((r: any) => r.user?.id).filter(Boolean);
                if (userIds.length > 0) historyActions.emitWatchUserStatus(userIds);
            }
        } finally {
            isFetchingPending.current = false;
        }
    }, [token, setPendingRequests, isFetchingPending]);

    const fetchSentRequests = useCallback(async () => {
        if (!token || isFetchingSent.current) return;
        isFetchingSent.current = true;
        try {
            const response = await api.get<any[]>('/api/friends/sent', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data) {
                setSentRequests(response.data);
                const userIds = response.data.map((r: any) => r.user?.id).filter(Boolean);
                if (userIds.length > 0) historyActions.emitWatchUserStatus(userIds);
            }
        } finally {
            isFetchingSent.current = false;
        }
    }, [token, setSentRequests, isFetchingSent]);

    const sendRequest = useCallback(async (receiverId: string) => {
        if (!token) return { success: false, error: 'Not authenticated' };
        const response = await api.post<any>(`/api/friends/${receiverId}/request`, {}, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.error) { fetchPendingRequests(); return { success: true }; }
        return { success: false, error: response.error };
    }, [token, fetchPendingRequests]);

    const acceptRequest = useCallback(async (requestId: string) => {
        if (!token) return { success: false, error: 'Not authenticated' };
        const response = await api.post<any>(`/api/friends/${requestId}/accept`, {}, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.error) {
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
            fetchFriends();
            return { success: true };
        }
        return { success: false, error: response.error };
    }, [token, fetchFriends, setPendingRequests]);

    const declineRequest = useCallback(async (requestId: string) => {
        if (!token) return { success: false, error: 'Not authenticated' };
        const response = await api.post<any>(`/api/friends/${requestId}/decline`, {}, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.error) {
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
            return { success: true };
        }
        return { success: false, error: response.error };
    }, [token, setPendingRequests]);

    const removeFriend = useCallback(async (friendId: string) => {
        if (!token) return { success: false, error: 'Not authenticated' };
        const response = await api.delete<any>(`/api/friends/${friendId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.error) {
            setFriends(prev => prev.filter(f => f.id !== friendId));
            return { success: true };
        }
        return { success: false, error: response.error };
    }, [token, setFriends]);

    return {
        fetchFriends,
        fetchPendingRequests,
        fetchSentRequests,
        sendRequest,
        acceptRequest,
        declineRequest,
        removeFriend
    };
};
