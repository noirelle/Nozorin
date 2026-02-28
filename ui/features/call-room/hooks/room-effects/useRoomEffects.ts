import { useEffect } from 'react';
import type React from 'react';
import { connectSocket } from '../../../../lib/socket';
import { emitUpdateMediaState, emitPing } from '../../../../lib/socket';
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
    initialMatchData,
    createOffer,
    handleStop,
    handleNext,
    findMatch,
    handleUserStop,
    onMatchFound,
}: UseRoomEffectsProps) => {

    // Notify parent about connection state changes
    useEffect(() => {
        onConnectionChange(callRoomState.is_connected);
    }, [callRoomState.is_connected, onConnectionChange]);

    // Handle initial direct call match data
    useEffect(() => {
        if (initialMatchData) {
            console.log('[Room] Processing initial direct call match data');
            onMatchFound(initialMatchData);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        if (!callRoomState.is_media_ready) return;
        emitUpdateMediaState(callRoomState.is_muted);
    }, [callRoomState.is_media_ready, callRoomState.is_muted]);

    // Heartbeat for presence detection
    useEffect(() => {
        if (!callRoomState.is_connected || callRoomState.is_searching) return;

        console.log('[Room] Starting heartbeat ping interval');
        const interval = setInterval(() => {
            emitPing();
        }, 5000);

        return () => {
            console.log('[Room] Stopping heartbeat ping interval');
            clearInterval(interval);
        };
    }, [callRoomState.is_connected, callRoomState.is_searching]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleUserStop();
            else if (e.key === 'ArrowRight') {
                if (callRoomState.is_connected || callRoomState.is_searching) handleNext();
                else findMatch();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUserStop, handleNext, findMatch, callRoomState.is_connected, callRoomState.is_searching]);
};
