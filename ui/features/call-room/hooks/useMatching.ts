import { useCallback, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { matchmaking } from '@/lib/api';
import { useUser } from '@/hooks/useUser';

export type MatchStatus = 'IDLE' | 'FINDING' | 'NEGOTIATING' | 'MATCHED' | 'RECONNECTING';

interface UseMatchingProps {
    socket: Socket | null;
    onMatchFound?: (data: {
        role: 'offerer' | 'answerer';
        partnerId: string;
        partnerUsername: string;
        partnerAvatar: string;
        partnerGender: string;
        partnerCountry: string;
        partnerCountryCode: string;
    }) => void;
    onMatchCancelled?: (data: { reason: string }) => void;
    onCallEnded?: () => void;
    onPartnerReconnecting?: (data: { timeoutMs: number }) => void;
    onPartnerReconnected?: (data: { newSocketId: string }) => void;
    onRejoinSuccess?: (data: { partnerId: string; partnerCountry: string; partnerCountryCode: string }) => void;
    onRejoinFailed?: (data: { reason: string }) => void;
}

export const useMatching = ({
    socket,
    onMatchFound,
    onMatchCancelled,
    onCallEnded,
    onPartnerReconnecting,
    onPartnerReconnected,
    onRejoinSuccess,
    onRejoinFailed,
}: UseMatchingProps) => {
    const { user } = useUser();
    const [status, setStatus] = useState<MatchStatus>('IDLE');
    const [position, setPosition] = useState<number | null>(null);
    const [reconnectCountdown, setReconnectCountdown] = useState<number | null>(null);

    // Refs for callbacks to ensure stable listeners
    const onMatchFoundRef = useRef(onMatchFound);
    const onMatchCancelledRef = useRef(onMatchCancelled);
    const onCallEndedRef = useRef(onCallEnded);
    const onPartnerReconnectingRef = useRef(onPartnerReconnecting);
    const onPartnerReconnectedRef = useRef(onPartnerReconnected);
    const onRejoinSuccessRef = useRef(onRejoinSuccess);
    const onRejoinFailedRef = useRef(onRejoinFailed);

    const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        onMatchFoundRef.current = onMatchFound;
        onMatchCancelledRef.current = onMatchCancelled;
        onCallEndedRef.current = onCallEnded;
        onPartnerReconnectingRef.current = onPartnerReconnecting;
        onPartnerReconnectedRef.current = onPartnerReconnected;
        onRejoinSuccessRef.current = onRejoinSuccess;
        onRejoinFailedRef.current = onRejoinFailed;
    }, [onMatchFound, onMatchCancelled, onCallEnded, onPartnerReconnecting, onPartnerReconnected, onRejoinSuccess, onRejoinFailed]);

    // Cleanup reconnect countdown timer
    const clearReconnectTimer = useCallback(() => {
        if (reconnectTimerRef.current) {
            clearInterval(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        setReconnectCountdown(null);
    }, []);

    // Listen for matching events
    useEffect(() => {
        if (!socket) return;

        const handleWaitingForMatch = (data: { position: number }) => {
            console.log(`[Matching] In queue, position: ${data.position}`);
            setStatus('FINDING');
            setPosition(data.position);
        };

        const handlePrepareMatch = (data: any) => {
            console.log('[Matching] Match prepared, acknowledging...', data);
            setStatus('NEGOTIATING');
            socket.emit('match-ready');
        };

        const handleMatchCancelled = (data: { reason: string }) => {
            console.warn('[Matching] Match cancelled:', data.reason);
            setStatus('FINDING'); // Server auto-requeues at the front
            setPosition(null);
            if (onMatchCancelledRef.current) onMatchCancelledRef.current(data);
        };

        const handleMatchFound = (data: any) => {
            clearReconnectTimer();
            setStatus('MATCHED');
            setPosition(null);
            if (onMatchFoundRef.current) onMatchFoundRef.current(data);
        };

        const handleCallEnded = () => {
            console.log('[Matching] Call ended. Resetting state to IDLE.');
            clearReconnectTimer();
            setStatus('IDLE');
            setPosition(null);
            if (onCallEndedRef.current) onCallEndedRef.current();
        };

        // --- RECONNECT EVENT HANDLERS ---

        const handlePartnerReconnecting = (data: { timeoutMs: number }) => {
            console.log(`[Matching] Partner is reconnecting... timeout: ${data.timeoutMs}ms`);
            setStatus('RECONNECTING');

            // Start countdown
            const totalSeconds = Math.ceil(data.timeoutMs / 1000);
            setReconnectCountdown(totalSeconds);

            if (reconnectTimerRef.current) clearInterval(reconnectTimerRef.current);
            reconnectTimerRef.current = setInterval(() => {
                setReconnectCountdown(prev => {
                    if (prev === null || prev <= 1) {
                        clearReconnectTimer();
                        return null;
                    }
                    return prev - 1;
                });
            }, 1000);

            if (onPartnerReconnectingRef.current) onPartnerReconnectingRef.current(data);
        };

        const handlePartnerReconnected = (data: { newSocketId: string }) => {
            console.log('[Matching] Partner reconnected!');
            clearReconnectTimer();
            setStatus('MATCHED');
            if (onPartnerReconnectedRef.current) onPartnerReconnectedRef.current(data);
        };

        const handleRejoinSuccess = (data: any) => {
            console.log('[Matching] Rejoin successful!', data);
            clearReconnectTimer();
            setStatus('MATCHED');
            if (onRejoinSuccessRef.current) onRejoinSuccessRef.current(data);
        };

        const handleRejoinFailed = (data: { reason: string }) => {
            console.warn('[Matching] Rejoin failed:', data.reason);
            clearReconnectTimer();
            setStatus('IDLE');
            // Clear stale active call from localStorage
            try { localStorage.removeItem('nz_active_call'); } catch { }
            if (onRejoinFailedRef.current) onRejoinFailedRef.current(data);
        };

        socket.on('waiting-for-match', handleWaitingForMatch);
        socket.on('prepare-match', handlePrepareMatch);
        socket.on('match-cancelled', handleMatchCancelled);
        socket.on('match-found', handleMatchFound);
        socket.on('call-ended', handleCallEnded);
        socket.on('partner-reconnecting', handlePartnerReconnecting);
        socket.on('partner-reconnected', handlePartnerReconnected);
        socket.on('rejoin-success', handleRejoinSuccess);
        socket.on('rejoin-failed', handleRejoinFailed);

        return () => {
            console.log('[Matching] Cleaning up socket listeners...');
            socket.off('waiting-for-match', handleWaitingForMatch);
            socket.off('prepare-match', handlePrepareMatch);
            socket.off('match-cancelled', handleMatchCancelled);
            socket.off('match-found', handleMatchFound);
            socket.off('call-ended', handleCallEnded);
            socket.off('partner-reconnecting', handlePartnerReconnecting);
            socket.off('partner-reconnected', handlePartnerReconnected);
            socket.off('rejoin-success', handleRejoinSuccess);
            socket.off('rejoin-failed', handleRejoinFailed);

            clearReconnectTimer();

            // AUTHORITATIVE RESET on unmount
            setStatus('IDLE');
            setPosition(null);
        };
    }, [socket, clearReconnectTimer]); // Only re-run if socket instance changes

    // Start searching for a match
    const startSearch = useCallback(async (options?: {
        preferredCountry?: string;
        userId?: string;
        peerId?: string;
    }) => {
        if (!socket) return;

        const effectiveUserId = options?.userId || user?.id; // Use hook user as fallback
        if (!effectiveUserId) {
            console.error('[Matching] No user ID, cannot join queue');
            return;
        }

        console.log(`[Matching] Starting search for voice with preference: ${options?.preferredCountry || 'None'}`);
        setStatus('FINDING');

        try {
            const requestId = Math.random().toString(36).substring(7);
            const payload = {
                userId: effectiveUserId,
                mode: 'voice' as const,
                preferences: {
                    region: options?.preferredCountry
                },
                session: {
                    peerId: options?.peerId,
                    connectionId: socket.id
                },
                requestId
            };

            const { error } = await matchmaking.joinQueue(payload);

            if (error) {
                console.error('[Matching] Join queue failed:', error);
                setStatus('IDLE');
                // Could emit a toast error here
            }
        } catch (err) {
            console.error('[Matching] Join queue exception:', err);
            setStatus('IDLE');
        }
    }, [socket, user]);

    // Stop searching (cancel)
    const stopSearch = useCallback(async () => {
        if (!socket) return;
        setStatus('IDLE');
        setPosition(null);
        try {
            await matchmaking.leaveQueue();
        } catch (err) {
            console.error('[Matching] Leave queue exception:', err);
        }
    }, [socket]);

    // End the current call
    const endCall = useCallback(
        (partnerId: string | null) => {
            if (!socket) return;
            setStatus('IDLE');
            socket.emit('end-call', { target: partnerId });
        },
        [socket]
    );

    // Rejoin an active call after disconnect/refresh
    const rejoinCall = useCallback((roomId?: string) => {
        if (!socket) return;
        console.log('[Matching] Attempting to rejoin call...');
        setStatus('RECONNECTING');
        socket.emit('rejoin-call', { roomId });
    }, [socket]);

    // Cancel a pending reconnect (either side)
    const cancelReconnect = useCallback(() => {
        if (!socket) return;
        console.log('[Matching] Cancelling reconnect...');
        clearReconnectTimer();
        setStatus('IDLE');
        socket.emit('cancel-reconnect');
        // Clear stale active call from localStorage
        try { localStorage.removeItem('nz_active_call'); } catch { }
    }, [socket, clearReconnectTimer]);

    const [isSkipping, setIsSkipping] = useState(false);
    const skipTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (skipTimerRef.current) {
                clearTimeout(skipTimerRef.current);
            }
        };
    }, []);

    // Skip to next partner (Atomic operation on server)
    const skipToNext = useCallback(
        (partnerId: string | null, preferredCountry?: string) => {
            if (!socket || isSkipping) return;

            console.log(`[Matching] Skipping to next for voice...`);
            setIsSkipping(true);

            if (skipTimerRef.current) clearTimeout(skipTimerRef.current);

            startSearch({
                preferredCountry,
                // userId and peerId need to be passed or accessible. 
                // For now passing undefined, which might fail validation if strict, 
                // but validation currently checks userId from token in controller, so payload userId is just for consistency check.
                // peerId is missing.
            });

            // Safety timeout to reset skipping state if server doesn't respond
            skipTimerRef.current = setTimeout(() => {
                setIsSkipping(false);
                skipTimerRef.current = null;
            }, 2000);
        },
        [socket, startSearch, isSkipping]
    );

    // Reset skipping state when a match is found or position updated
    useEffect(() => {
        if (status === 'MATCHED') {
            setIsSkipping(false);
        } else if (status === 'FINDING') {
            const timer = setTimeout(() => setIsSkipping(false), 500);
            return () => clearTimeout(timer);
        }
    }, [status]);

    return {
        startSearch,
        stopSearch,
        endCall,
        skipToNext,
        rejoinCall,
        cancelReconnect,
        status,
        position,
        isSkipping,
        reconnectCountdown,
    };
};
