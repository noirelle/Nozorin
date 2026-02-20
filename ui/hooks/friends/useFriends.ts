import { useFriendsState } from './useFriendsState';
import { useFriendsActions } from './useFriendsActions';
import { useFriendsListeners } from './useFriendsListeners';

export const useFriends = (token: string | null) => {
    const state = useFriendsState();
    const actions = useFriendsActions({
        token,
        setFriends: state.setFriends,
        setPendingRequests: state.setPendingRequests,
        setIsLoading: state.setIsLoading,
        setError: state.setError,
        isFetchingFriends: state.isFetchingFriends,
        isFetchingPending: state.isFetchingPending,
    });
    useFriendsListeners({
        setFriends: state.setFriends,
        setPendingRequests: state.setPendingRequests,
    });

    return {
        friends: state.friends,
        pendingRequests: state.pendingRequests,
        isLoading: state.isLoading,
        error: state.error,
        fetchFriends: actions.fetchFriends,
        fetchPendingRequests: actions.fetchPendingRequests,
        sendRequest: actions.sendRequest,
        acceptRequest: actions.acceptRequest,
        declineRequest: actions.declineRequest,
        removeFriend: actions.removeFriend,
    };
};
