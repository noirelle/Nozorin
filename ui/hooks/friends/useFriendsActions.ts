import { useCallback } from 'react';
import { api } from '../../lib/api';
import { UseFriendsStateReturn } from './useFriendsState';
import * as historyActions from '../../lib/socket/history/history.actions';

interface UseFriendsActionsProps {
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
        if (isFetchingFriends.current) return;
        isFetchingFriends.current = true;
        setIsLoading(true);
        try {
            const response = await api.get<any[]>('/api/friends');
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
    }, [setFriends, setIsLoading, setError, isFetchingFriends]);

    const fetchPendingRequests = useCallback(async () => {
        if (isFetchingPending.current) return;
        isFetchingPending.current = true;
        try {
            const response = await api.get<any[]>('/api/friends/requests');
            if (response.data) {
                setPendingRequests(response.data);
                const userIds = response.data.map((r: any) => r.user?.id).filter(Boolean);
                if (userIds.length > 0) historyActions.emitWatchUserStatus(userIds);
            }
        } finally {
            isFetchingPending.current = false;
        }
    }, [setPendingRequests, isFetchingPending]);

    const fetchSentRequests = useCallback(async () => {
        if (isFetchingSent.current) return;
        isFetchingSent.current = true;
        try {
            const response = await api.get<any[]>('/api/friends/sent');
            if (response.data) {
                setSentRequests(response.data);
                const userIds = response.data.map((r: any) => r.user?.id).filter(Boolean);
                if (userIds.length > 0) historyActions.emitWatchUserStatus(userIds);
            }
        } finally {
            isFetchingSent.current = false;
        }
    }, [setSentRequests, isFetchingSent]);

    const sendRequest = useCallback(async (receiverId: string) => {
        const response = await api.post<any>(`/api/friends/${receiverId}/request`, {});
        if (!response.error) { fetchPendingRequests(); return { success: true }; }
        return { success: false, error: response.error };
    }, [fetchPendingRequests]);

    const acceptRequest = useCallback(async (requestId: string) => {
        const response = await api.post<any>(`/api/friends/${requestId}/accept`, {});
        if (!response.error) {
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
            fetchFriends();
            return { success: true };
        }
        return { success: false, error: response.error };
    }, [fetchFriends, setPendingRequests]);

    const declineRequest = useCallback(async (requestId: string) => {
        const response = await api.post<any>(`/api/friends/${requestId}/decline`, {});
        if (!response.error) {
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
            return { success: true };
        }
        return { success: false, error: response.error };
    }, [setPendingRequests]);

    const removeFriend = useCallback(async (friendId: string) => {
        const response = await api.delete<any>(`/api/friends/${friendId}`);
        if (!response.error) {
            setFriends(prev => prev.filter(f => f.id !== friendId));
            return { success: true };
        }
        return { success: false, error: response.error };
    }, [setFriends]);

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
