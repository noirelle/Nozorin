import { useCallback, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

export type MatchStatus = 'IDLE' | 'FINDING' | 'NEGOTIATING' | 'MATCHED';

interface UseMatchingProps {
    socket: Socket | null;
    onMatchFound?: (data: {
        role: 'offerer' | 'answerer';
        partnerId: string;
        partnerCountry: string;
        partnerCountryCode: string;
    }) => void;
    onMatchCancelled?: (data: { reason: string }) => void;
    onCallEnded?: () => void;
    onMultiSession?: (message: string) => void;
}

export const useMatching = ({
    socket,
    onMatchFound,
    onMatchCancelled,
    onCallEnded,
    onMultiSession,
}: UseMatchingProps) => {
    const [status, setStatus] = useState<MatchStatus>('IDLE');
    const [position, setPosition] = useState<number | null>(null);

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
            if (onMatchCancelled) onMatchCancelled(data);
        };

        const handleMatchFound = (data: any) => {
            setStatus('MATCHED');
            setPosition(null);
            if (onMatchFound) onMatchFound(data);
        };

        const handleCallEnded = () => {
            console.log('[Matching] Call ended. Resetting state to IDLE.');
            setStatus('IDLE');
            setPosition(null);
            if (onCallEnded) onCallEnded();
        };

        const handleMultiSession = (data: { message: string }) => {
            console.error('[Matching] Multi-session detected:', data.message);
            setStatus('IDLE');
            if (onMultiSession) onMultiSession(data.message);
        };

        socket.on('waiting-for-match', handleWaitingForMatch);
        socket.on('prepare-match', handlePrepareMatch);
        socket.on('match-cancelled', handleMatchCancelled);
        socket.on('match-found', handleMatchFound);
        socket.on('call-ended', handleCallEnded);
        socket.on('multi-session', handleMultiSession);

        return () => {
            console.log('[Matching] Cleaning up socket listeners...');
            socket.off('waiting-for-match', handleWaitingForMatch);
            socket.off('prepare-match', handlePrepareMatch);
            socket.off('match-cancelled', handleMatchCancelled);
            socket.off('match-found', handleMatchFound);
            socket.off('call-ended', handleCallEnded);
            socket.off('multi-session', handleMultiSession);

            // AUTHORITATIVE RESET on unmount
            setStatus('IDLE');
            setPosition(null);
        };
    }, [socket, onMatchFound, onMatchCancelled, onCallEnded, onMultiSession]);

    // Start searching for a match
    const startSearch = useCallback((preferredCountry?: string) => {
        if (!socket) return;
        console.log(`[Matching] Starting search for video with preference: ${preferredCountry || 'None'}`);
        setStatus('FINDING');
        socket.emit('find-match', { mode: 'video', preferredCountry });
    }, [socket]);

    // Stop searching (cancel)
    const stopSearch = useCallback(() => {
        if (!socket) return;
        setStatus('IDLE');
        setPosition(null);
        socket.emit('stop-searching');
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

            console.log(`[Matching] Skipping to next for video...`);
            setIsSkipping(true);

            if (skipTimerRef.current) clearTimeout(skipTimerRef.current);

            startSearch(preferredCountry);

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
            // Add a small 500ms delay if we're re-entering 'FINDING' (e.g. after a skip or cancel)
            // to prevent rapid button spamming
            const timer = setTimeout(() => setIsSkipping(false), 500);
            return () => clearTimeout(timer);
        }
    }, [status]);

    return {
        startSearch,
        stopSearch,
        endCall,
        skipToNext,
        status,
        position,
        isSkipping,
    };
};
