import { useState, useRef, useEffect } from 'react';

export const useRoomActionsState = () => {
    const [partnerIsMuted, setPartnerIsMuted] = useState(false);
    const [isDirectCall, setIsDirectCall] = useState(false);

    const manualStopRef = useRef(false);
    const nextTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Stable ref-forwarded matching action handles
    const startSearchRef = useRef<(options?: { preferred_country?: string; user_id?: string; peer_id?: string }) => Promise<void>>(() => Promise.resolve());
    const stopSearchRef = useRef<() => void>(() => { });
    const endCallRef = useRef<(id: string | null) => void>(() => { });

    // Cleanup deferred timers on unmount
    useEffect(() => {
        return () => {
            if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };
    }, []);

    return {
        partnerIsMuted,
        setPartnerIsMuted,
        isDirectCall,
        setIsDirectCall,
        manualStopRef,
        nextTimeoutRef,
        reconnectTimeoutRef,
        startSearchRef,
        stopSearchRef,
        endCallRef,
    };
};

export type UseRoomActionsStateReturn = ReturnType<typeof useRoomActionsState>;
