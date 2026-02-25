import { useCallback } from 'react';
import { useSocketEvent, SocketEvents } from '../../lib/socket';
import {
    FriendRequestReceivedPayload,
    FriendRequestAcceptedPayload,
} from '../../lib/socket/friends/friends.types';
import { PartnerStatusChangePayload } from '../../lib/socket/history/history.types';
import { UseFriendsStateReturn } from './useFriendsState';

interface UseFriendsListenersProps {
    setFriends: UseFriendsStateReturn['setFriends'];
    setPendingRequests: UseFriendsStateReturn['setPendingRequests'];
    setSentRequests: UseFriendsStateReturn['setSentRequests'];
}

export const useFriendsListeners = ({
    setFriends,
    setPendingRequests,
    setSentRequests
}: UseFriendsListenersProps) => {
    const handleRequestReceived = useCallback((data: FriendRequestReceivedPayload) => {
        setPendingRequests(prev => {
            if (prev.find(r => r.id === data.id)) return prev;
            return [data, ...prev];
        });
    }, [setPendingRequests]);

    const handleRequestAccepted = useCallback((data: FriendRequestAcceptedPayload) => {
        setFriends(prev => {
            if (prev.find(f => f.id === data.friend.id)) return prev;
            return [data.friend, ...prev];
        });
        setPendingRequests(prev => prev.filter(r => r.id !== data.request_id));
    }, [setFriends, setPendingRequests]);

    const handlePartnerStatusChange = useCallback((data: PartnerStatusChangePayload) => {
        setFriends(prev => prev.map(f =>
            f.id === data.user_id ? { ...f, ...data.status } : f
        ));
        setPendingRequests(prev => prev.map(r =>
            r.user?.id === data.user_id ? { ...r, user: { ...r.user, ...data.status } } : r
        ));
        setSentRequests(prev => prev.map(r =>
            r.user?.id === data.user_id ? { ...r, user: { ...r.user, ...data.status } } : r
        ));
    }, [setFriends, setPendingRequests, setSentRequests]);

    useSocketEvent<FriendRequestReceivedPayload>(SocketEvents.FRIEND_REQUEST_RECEIVED, handleRequestReceived);
    useSocketEvent<FriendRequestAcceptedPayload>(SocketEvents.FRIEND_REQUEST_ACCEPTED, handleRequestAccepted);
    useSocketEvent<PartnerStatusChangePayload>(SocketEvents.PARTNER_STATUS_CHANGE, handlePartnerStatusChange);
};
