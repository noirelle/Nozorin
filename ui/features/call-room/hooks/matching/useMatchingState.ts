import { useState, useRef, useCallback } from 'react';

export type MatchStatus = 'IDLE' | 'FINDING' | 'NEGOTIATING' | 'MATCHED' | 'RECONNECTING';

export const useMatchingState = () => {
    const [status, setStatus] = useState<MatchStatus>('IDLE');
    const [position, setPosition] = useState<number | null>(null);
    const [reconnectCountdown, setReconnectCountdown] = useState<number | null>(null);
    const [isSkipping, setIsSkipping] = useState(false);

    const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
    const skipTimerRef = useRef<NodeJS.Timeout | null>(null);

    const clearReconnectTimer = useCallback(() => {
        if (reconnectTimerRef.current) {
            clearInterval(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        setReconnectCountdown(null);
    }, []);

    return {
        status,
        position,
        reconnectCountdown,
        isSkipping,
        reconnectTimerRef,
        skipTimerRef,
        setStatus,
        setPosition,
        setReconnectCountdown,
        setIsSkipping,
        clearReconnectTimer,
    };
};

export type UseMatchingStateReturn = ReturnType<typeof useMatchingState>;
