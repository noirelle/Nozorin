import { useState, useRef, useEffect } from 'react';

export const useRoomActionsState = () => {
    const [partnerIsMuted, setPartnerIsMuted] = useState(false);

    const manualStopRef = useRef(false);
    const pendingRejoinPartnerRef = useRef<string | null>(null);
    const nextTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Stable ref-forwarded matching action handles
    const startSearchRef = useRef<(options?: { preferredCountry?: string; userId?: string; peerId?: string }) => Promise<void>>(() => Promise.resolve());
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
        manualStopRef,
        pendingRejoinPartnerRef,
        nextTimeoutRef,
        reconnectTimeoutRef,
        startSearchRef,
        stopSearchRef,
        endCallRef,
    };
};

export type UseRoomActionsStateReturn = ReturnType<typeof useRoomActionsState>;
