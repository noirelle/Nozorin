import { useCallback } from 'react';
import { useSocketEvent, SocketEvents } from '../../lib/socket';
import {
    FriendRequestReceivedPayload,
    FriendRequestAcceptedPayload,
} from '../../lib/socket/friends/friends.types';
import { UseFriendsStateReturn } from './useFriendsState';

interface UseFriendsListenersProps {
    setFriends: UseFriendsStateReturn['setFriends'];
    setPendingRequests: UseFriendsStateReturn['setPendingRequests'];
}

export const useFriendsListeners = ({ setFriends, setPendingRequests }: UseFriendsListenersProps) => {
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
        setPendingRequests(prev => prev.filter(r => r.id !== data.requestId));
    }, [setFriends, setPendingRequests]);

    useSocketEvent<FriendRequestReceivedPayload>(SocketEvents.FRIEND_REQUEST_RECEIVED, handleRequestReceived);
    useSocketEvent<FriendRequestAcceptedPayload>(SocketEvents.FRIEND_REQUEST_ACCEPTED, handleRequestAccepted);
};
