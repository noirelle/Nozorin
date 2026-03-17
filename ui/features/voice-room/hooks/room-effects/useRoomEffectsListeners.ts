import { useRef, useEffect } from 'react';
import { useSocketEvent, SocketEvents } from '../../../../lib/socket';
import { PartnerMuteStatePayload, PartnerSignalStrengthPayload } from '../../../../lib/socket/media/media.types';

interface UseRoomEffectsListenersProps {
    setPartnerIsMuted: (muted: boolean) => void;
    setPartnerSignalStrength: (strength: 'good' | 'fair' | 'poor' | 'reconnecting') => void;
    setPartnerReady: (ready: boolean) => void;
    updatePartnerProfile: (profile: any) => void;
}

export const useRoomEffectsListeners = ({
    setPartnerIsMuted,
    setPartnerSignalStrength,
    setPartnerReady,
    updatePartnerProfile,
}: UseRoomEffectsListenersProps) => {
    // Partner media state listeners
    const handlePartnerMute = useRef((data: PartnerMuteStatePayload) => setPartnerIsMuted(data.is_muted));
    const handlePartnerSignal = useRef((data: PartnerSignalStrengthPayload) => setPartnerSignalStrength(data.strength));
    const handlePartnerReady = useRef(() => setPartnerReady(true));
    const handleProfileUpdate = useRef((profile: any) => updatePartnerProfile?.(profile));

    useEffect(() => { handlePartnerMute.current = (data) => setPartnerIsMuted(data.is_muted); }, [setPartnerIsMuted]);
    useEffect(() => { handlePartnerSignal.current = (data) => setPartnerSignalStrength(data.strength); }, [setPartnerSignalStrength]);
    useEffect(() => { handlePartnerReady.current = () => setPartnerReady(true); }, [setPartnerReady]);
    useEffect(() => { handleProfileUpdate.current = (profile: any) => updatePartnerProfile?.(profile); }, [updatePartnerProfile]);

    useSocketEvent<PartnerMuteStatePayload>(
        SocketEvents.PARTNER_MUTE_STATE,
        useRef((data: PartnerMuteStatePayload) => handlePartnerMute.current(data)).current
    );
    useSocketEvent<PartnerSignalStrengthPayload>(
        SocketEvents.PARTNER_SIGNAL_STRENGTH,
        useRef((data: PartnerSignalStrengthPayload) => handlePartnerSignal.current(data)).current
    );
    useSocketEvent(
        SocketEvents.PARTNER_REJOIN_READY,
        useRef(() => handlePartnerReady.current()).current
    );
    useSocketEvent<{ profile: any }>(
        SocketEvents.PARTNER_PROFILE_UPDATED,
        useRef((data: { profile: any }) => handleProfileUpdate.current(data.profile)).current
    );
};
