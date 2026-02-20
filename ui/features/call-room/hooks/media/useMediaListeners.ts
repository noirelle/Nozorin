import { useCallback, useEffect, useRef } from 'react';
import { useSocketEvent, SocketEvents } from '../../../../lib/socket';
import { emitUpdateMediaState } from '../../../../lib/socket/media/media.actions';
import { PartnerMuteStatePayload, PartnerSignalStrengthPayload } from '../../../../lib/socket/media/media.types';
import { CallRoomState } from './useMediaState';

interface UseMediaListenersProps {
    callRoomState: CallRoomState;
    setPartnerIsMuted: (muted: boolean) => void;
    setPartnerSignalStrength: (strength: 'good' | 'fair' | 'poor' | 'reconnecting') => void;
    handleNext: () => void;
    handleUserStop: () => void;
    findMatch: () => void;
}

export const useMediaListeners = ({
    callRoomState,
    setPartnerIsMuted,
    setPartnerSignalStrength,
    handleNext,
    handleUserStop,
    findMatch,
}: UseMediaListenersProps) => {
    // Keep handlers stable via refs to avoid re-registering socket listeners
    const handlePartnerMuteRef = useRef((data: PartnerMuteStatePayload) => setPartnerIsMuted(data.isMuted));
    const handlePartnerSignalRef = useRef((data: PartnerSignalStrengthPayload) => setPartnerSignalStrength(data.strength));

    useEffect(() => { handlePartnerMuteRef.current = (data) => setPartnerIsMuted(data.isMuted); }, [setPartnerIsMuted]);
    useEffect(() => { handlePartnerSignalRef.current = (data) => setPartnerSignalStrength(data.strength); }, [setPartnerSignalStrength]);

    useSocketEvent<PartnerMuteStatePayload>(
        SocketEvents.PARTNER_MUTE_STATE,
        useRef((data: PartnerMuteStatePayload) => handlePartnerMuteRef.current(data)).current,
    );
    useSocketEvent<PartnerSignalStrengthPayload>(
        SocketEvents.PARTNER_SIGNAL_STRENGTH,
        useRef((data: PartnerSignalStrengthPayload) => handlePartnerSignalRef.current(data)).current,
    );

    // Sync local mute state with server whenever media state changes
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
