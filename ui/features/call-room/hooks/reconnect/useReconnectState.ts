import { useState, useRef, useEffect } from 'react';

export interface ActiveCallData {
    room_id?: string;
    peerId: string;
    startedAt: number;
    partnerProfile?: {
        id: string;
        username: string;
        displayName: string;
        avatar: string;
        country_name: string;
    };
}

export const useReconnectState = (initialReconnecting = false) => {
    const [isReconnecting, setIsReconnecting] = useState(initialReconnecting);
    const hasCheckedRef = useRef(false);
    const rejoinEmittedRef = useRef(false);
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
        hasCheckedRef,
        rejoinEmittedRef,
        activeCallRef,
        reconnectStartRef,
        minDisplayTimerRef,
    };
};
