import { useState, useRef } from 'react';

export const useFriendsState = () => {
    const [friends, setFriends] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isFetchingFriends = useRef(false);
    const isFetchingPending = useRef(false);

    return {
        friends,
        pendingRequests,
        isLoading,
        error,
        setFriends,
        setPendingRequests,
        setIsLoading,
        setError,
        isFetchingFriends,
        isFetchingPending,
    };
};

export type UseFriendsStateReturn = ReturnType<typeof useFriendsState>;
