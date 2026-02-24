import { useEffect } from 'react';
import type React from 'react';
import { connectSocket } from '../../../../lib/socket';
import { emitUpdateMediaState } from '../../../../lib/socket/media/media.actions';
import { CallRoomState } from '@/hooks';
import { useRoomEffectsListeners } from './useRoomEffectsListeners';

interface UseRoomEffectsProps {
    mode: 'voice';
    callRoomState: CallRoomState;
    setPartnerIsMuted: (muted: boolean) => void;
    setPartnerSignalStrength: (strength: 'good' | 'fair' | 'poor' | 'reconnecting') => void;
    initMediaManager: () => Promise<boolean>;
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
    mode,
    callRoomState,
    setPartnerIsMuted,
    setPartnerSignalStrength,
    cleanupMedia,
    onConnectionChange,
    createOffer,
    pendingRejoinPartnerRef,
    handleStop,
    handleNext,
    findMatch,
    handleUserStop,
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
        connectSocket();
        return () => { cleanupMedia(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    useRoomEffectsListeners({
        setPartnerIsMuted,
        setPartnerSignalStrength,
    });

    // Sync local media state with server
    useEffect(() => {
        if (!callRoomState.isMediaReady) return;
        emitUpdateMediaState(callRoomState.isMuted);
    }, [callRoomState.isMediaReady, callRoomState.isMuted]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleUserStop();
            else if (e.key === 'ArrowRight') {
                if (callRoomState.isConnected || callRoomState.isSearching) handleNext();
                else findMatch();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUserStop, handleNext, findMatch, callRoomState.isConnected, callRoomState.isSearching]);
};
