import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { CallRoomState } from './useCallRoom';

interface UseRoomEffectsProps {
    socket: Socket | null;
    mode: 'voice';
    callRoomState: CallRoomState;
    setPartnerIsMuted: (muted: boolean) => void;
    setPartnerSignalStrength: (strength: 'good' | 'fair' | 'poor' | 'reconnecting') => void;
    initMediaManager: () => Promise<void>;
    cleanupMedia: () => void;
    onConnectionChange: (connected: boolean) => void;
    initialMatchData?: any;
    createOffer: (partnerId: string) => Promise<void>;
    pendingRejoinPartnerRef: React.MutableRefObject<string | null>;
    handleStop: () => void;
    handleNext: () => void;
    findMatch: () => void;
    handleUserStop: () => void;
    onMatchFound: (data: any) => void;
}

export const useRoomEffects = ({
    socket,
    mode,
    callRoomState,
    setPartnerIsMuted,
    setPartnerSignalStrength,
    initMediaManager,
    cleanupMedia,
    onConnectionChange,
    initialMatchData,
    createOffer,
    pendingRejoinPartnerRef,
    handleStop,
    handleNext,
    findMatch,
    handleUserStop,
    onMatchFound,
}: UseRoomEffectsProps) => {

    // Notify parent about connection state changes
    useEffect(() => {
        onConnectionChange(callRoomState.isConnected);
    }, [callRoomState.isConnected, onConnectionChange]);

    // Deferred WebRTC offer for rejoin — fires once media is ready
    useEffect(() => {
        const partnerId = pendingRejoinPartnerRef.current;
        if (!partnerId || !callRoomState.isMediaReady) return;

        pendingRejoinPartnerRef.current = null;
        console.log('[Room] Media ready — creating deferred WebRTC offer for rejoin.');
        createOffer(partnerId);
    }, [callRoomState.isMediaReady, createOffer, pendingRejoinPartnerRef]);

    // Initialization & Cleanup
    useEffect(() => {
        // Always init media for voice
        initMediaManager();
        socket?.connect();

        return () => {
            handleStop();
            cleanupMedia();
        };
    }, [mode, socket, initMediaManager, cleanupMedia, handleStop]);

    // Handle initial match data (for direct calls from landing page)
    const initialDataConsumed = useRef(false);

    useEffect(() => {
        if (initialMatchData && !callRoomState.isConnected && !initialDataConsumed.current) {
            console.log('[Room] Initializing with direct match data:', initialMatchData);
            initialDataConsumed.current = true;
            onMatchFound(initialMatchData);
        }
    }, [initialMatchData, onMatchFound, callRoomState.isConnected]);

    // Socket Listeners (for media state)
    useEffect(() => {
        if (!socket) return;

        const onPartnerMute = (data: { isMuted: boolean }) => setPartnerIsMuted(data.isMuted);
        const onPartnerSignal = (data: { strength: 'good' | 'fair' | 'poor' | 'reconnecting' }) => {
            setPartnerSignalStrength(data.strength);
        };

        socket.on('partner-mute-state', onPartnerMute);
        socket.on('partner-signal-strength', onPartnerSignal);

        return () => {
            socket.off('partner-mute-state', onPartnerMute);
            socket.off('partner-signal-strength', onPartnerSignal);
        };
    }, [socket, setPartnerIsMuted, setPartnerSignalStrength]);

    // Sync Local Media State with Server (Initial + Updates)
    useEffect(() => {
        if (!socket || !callRoomState.isMediaReady) return;

        socket.emit('update-media-state', {
            isMuted: callRoomState.isMuted,
        });
    }, [socket, callRoomState.isMediaReady, callRoomState.isMuted]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleUserStop();
            } else if (e.key === 'ArrowRight') {
                if (callRoomState.isConnected || callRoomState.isSearching) {
                    handleNext();
                } else {
                    findMatch();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUserStop, handleNext, findMatch, callRoomState.isConnected, callRoomState.isSearching]);
};
