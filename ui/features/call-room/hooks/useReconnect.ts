import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';

interface ActiveCallData {
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

interface UseReconnectOptions {
    socket: Socket | null;
    rejoinCall: (roomId?: string) => void;
    onRestorePartner?: (data: ActiveCallData) => void;
}

/**
 * Encapsulates the reconnect-on-refresh logic.
 *
 * 1. Reads `nz_active_call` from localStorage on mount.
 * 2. Waits for the socket to be identified (`identify-success`).
 * 3. Emits `rejoin-call` through the provided callback.
 *
 * Returns `isReconnecting` so the UI can show inline status.
 */
export const useReconnect = ({ socket, rejoinCall, onRestorePartner }: UseReconnectOptions) => {
    const [isReconnecting, setIsReconnecting] = useState(false);
    const attemptedRef = useRef(false);
    const onRestorePartnerRef = useRef(onRestorePartner);

    useEffect(() => {
        onRestorePartnerRef.current = onRestorePartner;
    }, [onRestorePartner]);

    useEffect(() => {
        if (attemptedRef.current || !socket) return;

        // --- Read localStorage ---
        let stored: string | null = null;
        try {
            stored = localStorage.getItem('nz_active_call');
        } catch { }
        if (!stored) return;

        let activeCall: ActiveCallData;
        try {
            activeCall = JSON.parse(stored);
        } catch {
            localStorage.removeItem('nz_active_call');
            return;
        }

        // Client-side sanity: discard entries older than 2 minutes.
        // The server enforces the real 30s window via pendingReconnects.
        const elapsed = Date.now() - activeCall.startedAt;
        if (elapsed > 120_000 || !activeCall.peerId) {
            localStorage.removeItem('nz_active_call');
            return;
        }

        console.log('[Reconnect] Active call found, trying to reconnect.');
        setIsReconnecting(true);

        // Restore partner info immediately for UI feedback
        if (onRestorePartnerRef.current) {
            onRestorePartnerRef.current(activeCall);
        }

        // Wait for identify-success before emitting rejoin-call
        const handleIdentified = () => {
            if (attemptedRef.current) return;
            attemptedRef.current = true;

            console.log('[Reconnect] Socket identified — emitting rejoin-call.');
            rejoinCall(activeCall.roomId);
        };

        socket.on('identify-success', handleIdentified);

        return () => {
            socket.off('identify-success', handleIdentified);
        };
    }, [socket, rejoinCall]);

    // Listen for rejoin resolution to clear reconnecting state
    // Enforce a minimum display time to prevent flicker
    const reconnectStartRef = useRef<number>(0);
    const minDisplayTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isReconnecting) {
            reconnectStartRef.current = Date.now();
        }
    }, [isReconnecting]);

    useEffect(() => {
        if (!socket || !isReconnecting) return;

        const MIN_DISPLAY_MS = 3000;

        // Success: clear immediately — the call is live
        const clearImmediately = () => {
            if (minDisplayTimerRef.current) {
                clearTimeout(minDisplayTimerRef.current);
                minDisplayTimerRef.current = null;
            }
            setIsReconnecting(false);
        };

        // Failure: enforce minimum display time to prevent flicker
        const clearWithMinDelay = () => {
            const elapsed = Date.now() - reconnectStartRef.current;
            const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

            if (remaining === 0) {
                setIsReconnecting(false);
            } else {
                minDisplayTimerRef.current = setTimeout(() => {
                    setIsReconnecting(false);
                }, remaining);
            }
        };

        socket.on('rejoin-success', clearImmediately);
        socket.on('rejoin-failed', clearWithMinDelay);
        socket.on('call-ended', clearWithMinDelay);

        return () => {
            socket.off('rejoin-success', clearImmediately);
            socket.off('rejoin-failed', clearWithMinDelay);
            socket.off('call-ended', clearWithMinDelay);
            if (minDisplayTimerRef.current) {
                clearTimeout(minDisplayTimerRef.current);
                minDisplayTimerRef.current = null;
            }
        };
    }, [socket, isReconnecting]);

    return { isReconnecting };
};
