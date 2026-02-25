import { useFriendsState } from './useFriendsState';
import { useFriendsActions } from './useFriendsActions';
import { useFriendsListeners } from './useFriendsListeners';

export const useFriends = (token: string | null) => {
    const state = useFriendsState();
    const actions = useFriendsActions({
        token,
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
        removeFriend: actions.removeFriend,
    };
};
