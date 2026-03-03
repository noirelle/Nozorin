import { useRef, useEffect } from 'react';
import { useSocketEvent, SocketEvents } from '../../../../lib/socket';
import { PartnerMuteStatePayload, PartnerSignalStrengthPayload } from '../../../../lib/socket/media/media.types';

interface UseRoomEffectsListenersProps {
    setPartnerIsMuted: (muted: boolean) => void;
    setPartnerSignalStrength: (strength: 'good' | 'fair' | 'poor' | 'reconnecting') => void;
}

export const useRoomEffectsListeners = ({
    setPartnerIsMuted,
    setPartnerSignalStrength,
}: UseRoomEffectsListenersProps) => {
    // Partner media state listeners
    const handlePartnerMute = useRef((data: PartnerMuteStatePayload) => setPartnerIsMuted(data.is_muted));
    const handlePartnerSignal = useRef((data: PartnerSignalStrengthPayload) => setPartnerSignalStrength(data.strength));

    useEffect(() => { handlePartnerMute.current = (data) => setPartnerIsMuted(data.is_muted); }, [setPartnerIsMuted]);
    useEffect(() => { handlePartnerSignal.current = (data) => setPartnerSignalStrength(data.strength); }, [setPartnerSignalStrength]);

    useSocketEvent<PartnerMuteStatePayload>(
        SocketEvents.PARTNER_MUTE_STATE,
        useRef((data: PartnerMuteStatePayload) => handlePartnerMute.current(data)).current
    );
    useSocketEvent<PartnerSignalStrengthPayload>(
        SocketEvents.PARTNER_SIGNAL_STRENGTH,
        useRef((data: PartnerSignalStrengthPayload) => handlePartnerSignal.current(data)).current
    );
};
