'use client';

import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { apiRequest } from '../../lib/api';

const LOCATION_KEY = 'nz_location';

interface UseSessionActionsProps {
    setInitialCallData: (data: any) => void;
    setInitialReconnecting: (reconnecting: boolean) => void;
    setIsVerifyingSession: (verifying: boolean) => void;
}

export const useSessionActions = ({
    setInitialCallData,
    setInitialReconnecting,
    setIsVerifyingSession,
}: UseSessionActionsProps) => {
    const getSessionId = useCallback(() => {
        if (typeof window === 'undefined') return null;

        let sid = '';
        try {
            const stored = localStorage.getItem(LOCATION_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.sessionId) sid = parsed.sessionId;
            }
        } catch (e) {
            // Ignore error
        }

        if (!sid) {
            sid = uuidv4();
        }

        return sid;
    }, []);

    const verifyActiveCallSession = useCallback(async () => {
        try {
            const res = await apiRequest<{ active: boolean }>('/api/session/current');
            if (!res.error && res.data?.active) {
                console.log('[useSession] Active session found, fetching full details...');
                const fullRes = await apiRequest<any>('/api/session/call');
                if (!fullRes.error && fullRes.data) {
                    setInitialCallData(fullRes.data);
                    setInitialReconnecting(true);
                }
            }
        } catch (err) {
            console.error('[useSession] Failed to verify active session:', err);
        } finally {
            setIsVerifyingSession(false);
        }
    }, [setInitialCallData, setInitialReconnecting, setIsVerifyingSession]);

    return { getSessionId, verifyActiveCallSession };
};
