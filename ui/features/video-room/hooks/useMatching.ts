import { useCallback, useEffect } from 'react';
import { Socket } from 'socket.io-client';

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
}

export const useMatching = ({
    socket,
    mode,
    onMatchFound,
    onMatchCancelled,
    onCallEnded,
}: UseMatchingProps) => {
    // Listen for matching events
    useEffect(() => {
        if (!socket) return;

        const handlePrepareMatch = (data: any) => {
            console.log('[Matching] Match prepared, acknowledging...', data);
            socket.emit('match-ready');
        };

        const handleMatchCancelled = (data: { reason: string }) => {
            console.warn('[Matching] Match cancelled:', data.reason);
            if (onMatchCancelled) onMatchCancelled(data);
        };

        const handleMatchFound = (data: any) => {
            if (onMatchFound) onMatchFound(data);
        };

        const handleCallEnded = () => {
            if (onCallEnded) onCallEnded();
        };

        socket.on('prepare-match', handlePrepareMatch);
        socket.on('match-cancelled', handleMatchCancelled);
        socket.on('match-found', handleMatchFound);
        socket.on('call-ended', handleCallEnded);

        return () => {
            socket.off('prepare-match', handlePrepareMatch);
            socket.off('match-cancelled', handleMatchCancelled);
            socket.off('match-found', handleMatchFound);
            socket.off('call-ended', handleCallEnded);
        };
    }, [socket, onMatchFound, onMatchCancelled, onCallEnded]);

    // Start searching for a match
    const startSearch = useCallback((preferredCountry?: string) => {
        if (!socket) return;
        console.log(`[Matching] Starting search for ${mode} with preference: ${preferredCountry || 'None'}`);
        socket.emit('find-match', { mode, preferredCountry });
    }, [socket, mode]);

    // Stop searching (cancel)
    const stopSearch = useCallback(() => {
        if (!socket) return;
        socket.emit('stop-searching');
    }, [socket]);

    // End the current call
    const endCall = useCallback(
        (partnerId: string | null) => {
            if (!socket) return;
            // Always emit end-call, even if partnerId is null (server will look up in activeCalls)
            socket.emit('end-call', { target: partnerId });
        },
        [socket]
    );

    // Skip to next partner (end current call and start new search)
    const skipToNext = useCallback(
        (partnerId: string | null) => {
            endCall(partnerId);
            // Small delay to ensure server processes end-call first
            setTimeout(() => {
                startSearch(); // Note: skipToNext might need to pass preference if we want to persist it. 
                // But usually skip means "Next Random". If user wants "Next from Country X", they should use the UI filter.
                // We should probably allow passing it here too or let the parent component handle the argument.
            }, 100);
        },
        [endCall, startSearch]
    );

    return {
        startSearch,
        stopSearch,
        endCall,
        skipToNext,
    };
};
