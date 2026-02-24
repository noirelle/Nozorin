'use client';

import { useState, useRef, useEffect } from 'react';
import {
    HistoryStats,
    SessionRecord,
} from '../../lib/api/endpoints/session/types';

export type { SessionRecord, HistoryStats };

export const useHistoryState = (onUnauthorized?: () => void) => {
    const [history, setHistory] = useState<SessionRecord[]>([]);
    const [stats, setStats] = useState<HistoryStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onUnauthorizedRef = useRef(onUnauthorized);
    useEffect(() => { onUnauthorizedRef.current = onUnauthorized; }, [onUnauthorized]);

    return {
        history,
        stats,
        isLoading,
        error,
        setHistory,
        setStats,
        setIsLoading,
        setError,
        onUnauthorizedRef,
    };
};

export type UseHistoryStateReturn = ReturnType<typeof useHistoryState>;
