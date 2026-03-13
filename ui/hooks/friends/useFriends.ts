import { useFriendsState } from './useFriendsState';
import { useFriendsActions } from './useFriendsActions';
import { useFriendsListeners } from './useFriendsListeners';

export const useFriends = (props?: { onFriendOnline?: (friend: any) => void }) => {
    const state = useFriendsState();
    const actions = useFriendsActions({
        setFriends: state.setFriends,
        setPendingRequests: state.setPendingRequests,
        setSentRequests: state.setSentRequests,
        setIsLoading: state.setIsLoading,
        setError: state.setError,
        isFetchingFriends: state.isFetchingFriends,
        isFetchingPending: state.isFetchingPending,
        isFetchingSent: state.isFetchingSent,
    });
    useFriendsListeners({
        setFriends: state.setFriends,
        setPendingRequests: state.setPendingRequests,
        setSentRequests: state.setSentRequests,
        onFriendOnline: props?.onFriendOnline,
    });

    return {
        friends: state.friends,
        pendingRequests: state.pendingRequests,
        sentRequests: state.sentRequests,
        isLoading: state.isLoading,
        error: state.error,
        fetchFriends: actions.fetchFriends,
        fetchPendingRequests: actions.fetchPendingRequests,
        fetchSentRequests: actions.fetchSentRequests,
        sendRequest: actions.sendRequest,
        acceptRequest: actions.acceptRequest,
        declineRequest: actions.declineRequest,
        cancelRequest: actions.cancelRequest,
        removeFriend: actions.removeFriend,
    };
};
