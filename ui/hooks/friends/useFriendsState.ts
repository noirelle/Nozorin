import { useState, useRef } from 'react';

export const useFriendsState = () => {
    const [friends, setFriends] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [sentRequests, setSentRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isFetchingFriends = useRef(false);
    const isFetchingPending = useRef(false);
    const isFetchingSent = useRef(false);

    return {
        friends,
        pendingRequests,
        sentRequests,
        isLoading,
        error,
        setFriends,
        setPendingRequests,
        setSentRequests,
        setIsLoading,
        setError,
        isFetchingFriends,
        isFetchingPending,
        isFetchingSent,
    };
};

export type UseFriendsStateReturn = ReturnType<typeof useFriendsState>;
