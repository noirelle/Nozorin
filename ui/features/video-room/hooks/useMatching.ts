import { useCallback, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

export type MatchStatus = 'IDLE' | 'FINDING' | 'NEGOTIATING' | 'MATCHED';

interface UseMatchingProps {
    socket: Socket | null;
    mode: 'chat' | 'video';
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
    mode,
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
            setStatus('IDLE');
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
            socket.off('waiting-for-match', handleWaitingForMatch);
            socket.off('prepare-match', handlePrepareMatch);
            socket.off('match-cancelled', handleMatchCancelled);
            socket.off('match-found', handleMatchFound);
            socket.off('call-ended', handleCallEnded);
            socket.off('multi-session', handleMultiSession);
        };
    }, [socket, onMatchFound, onMatchCancelled, onCallEnded, onMultiSession]);

    // Start searching for a match
    const startSearch = useCallback((preferredCountry?: string) => {
        if (!socket) return;
        console.log(`[Matching] Starting search for ${mode} with preference: ${preferredCountry || 'None'}`);
        setStatus('FINDING');
        socket.emit('find-match', { mode, preferredCountry });
    }, [socket, mode]);

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

    // Skip to next partner (end current call and start new search)
    const skipToNext = useCallback(
        (partnerId: string | null, preferredCountry?: string) => {
            endCall(partnerId);
            // Small delay to ensure server processes end-call first
            setTimeout(() => {
                startSearch(preferredCountry);
            }, 100);
        },
        [endCall, startSearch]
    );

    return {
        startSearch,
        stopSearch,
        endCall,
        skipToNext,
        status,
        position,
    };
};
