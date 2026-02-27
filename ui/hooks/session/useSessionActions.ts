import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { apiRequest } from '../../lib/api';

const LOCATION_KEY = 'nz_location';

interface UseSessionActionsProps {
    setInitialCallData: (data: any) => void;
    setInitialReconnecting: (reconnecting: boolean) => void;
    setIsVerifyingSession: (verifying: boolean) => void;
}

// Module-level state for deduplication
let verificationPromise: Promise<void> | null = null;

/**
 * Shared executor for session verification to prevent duplicate network calls.
 * Can be called from hooks or direct utilities.
 */
export const executeSessionVerification = async (callbacks: {
    onStart?: () => void;
    onSuccess?: (data: any) => void;
    onError?: (err: any) => void;
    onFinally?: () => void;
}) => {
    if (verificationPromise) {
        console.log('[Session] Verification already in progress, deduplicating...');
        return verificationPromise;
    }

    verificationPromise = (async () => {
        console.log('[Session] Starting explicit verified session check...');
        callbacks.onStart?.();
        try {
            const res = await apiRequest<{ active: boolean }>('/api/session/current');
            if (!res.error && res.data?.active) {
                console.log('[Session] Active session found, fetching context...');
                const fullRes = await apiRequest<any>('/api/session/call');
                if (!fullRes.error && fullRes.data) {
                    callbacks.onSuccess?.(fullRes.data);
                }
            }
        } catch (err) {
            console.error('[Session] Verification failed:', err);
            callbacks.onError?.(err);
        } finally {
            callbacks.onFinally?.();
            // We keep the promise a bit longer to catch rapid subsequent calls,
            // then clear it to allow future manual refreshes if needed.
            setTimeout(() => { verificationPromise = null; }, 1000);
        }
    })();

    return verificationPromise;
};

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
            // Ignore
        }

        if (!sid) {
            sid = uuidv4();
        }

        return sid;
    }, []);

    const verifyActiveCallSession = useCallback(async () => {
        return executeSessionVerification({
            onStart: () => setIsVerifyingSession(true),
            onSuccess: (data) => {
                setInitialCallData(data);
                setInitialReconnecting(true);
            },
            onFinally: () => setIsVerifyingSession(false)
        });
    }, [setIsVerifyingSession, setInitialCallData, setInitialReconnecting]);

    return { getSessionId, verifyActiveCallSession };
};
