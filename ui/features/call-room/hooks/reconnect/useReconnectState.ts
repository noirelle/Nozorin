import { useState, useRef, useEffect } from 'react';

export interface ActiveCallData {
    roomId?: string;
    peerId: string;
    startedAt: number;
    partnerProfile?: {
        id: string;
        username: string;
        displayName: string;
        avatar: string;
        country: string;
    };
}

export const useReconnectState = () => {
    const [isReconnecting, setIsReconnecting] = useState(false);
    const attemptedRef = useRef(false);
    const activeCallRef = useRef<ActiveCallData | null>(null);
    const reconnectStartRef = useRef<number>(0);
    const minDisplayTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (minDisplayTimerRef.current) clearTimeout(minDisplayTimerRef.current);
        };
    }, []);

    return {
        isReconnecting,
        setIsReconnecting,
        attemptedRef,
        activeCallRef,
        reconnectStartRef,
        minDisplayTimerRef,
    };
};
