import { useCallback } from 'react';
import { MediaStreamManager } from '../../../../lib/mediaStream';
import { UseMediaStateReturn, CallRoomState } from './useMediaState';

interface UseMediaActionsProps {
    setState: UseMediaStateReturn['setState'];
    mediaManager: UseMediaStateReturn['mediaManager'];
    mode: 'voice';
}

export const useMediaActions = ({ setState, mediaManager, mode }: UseMediaActionsProps) => {
    const initMediaManager = useCallback(async () => {
        const existingStream = mediaManager.current?.getStream();
        const isHealthy = existingStream && existingStream.active && existingStream.getAudioTracks().some(t => t.readyState === 'live');

        if (!mediaManager.current || !isHealthy) {
            if (mediaManager.current && !isHealthy) {
                console.log('[MediaActions] Existing media stream unhealthy, re-initializing...');
                cleanupMedia();
            }

            const manager = new MediaStreamManager();
            mediaManager.current = manager;

            try {
                await manager.init();

                const stream = manager.getStream();
                if (!stream || stream.getAudioTracks().length === 0) {
                    throw new Error('Missing audio tracks');
                }

                const handleTrackEnded = () => {
                    if (mediaManager.current === manager) {
                        console.log('Track ended unexpectedly');
                        cleanupMedia();
                        setState(prev => ({ ...prev, permissionDenied: true, isMediaReady: false }));
                    }
                };

                stream.getAudioTracks().forEach(track => {
                    track.onended = handleTrackEnded;
                });

                if (mediaManager.current === manager) {
                    setState(prev => ({ ...prev, isMediaReady: true, permissionDenied: false }));
                }
            } catch (err) {
                console.error('Failed to initialize media:', err);
                if (mediaManager.current === manager) {
                    setState(prev => ({ ...prev, permissionDenied: true }));
                    mediaManager.current = null;
                }
            }
        }
    }, [mode, mediaManager, setState]);

    const cleanupMedia = useCallback(() => {
        mediaManager.current?.cleanup();
        mediaManager.current = null;
        setState(prev => ({ ...prev, isMediaReady: false }));
    }, [mediaManager, setState]);

    const toggleMute = useCallback(() => {
        setState(prev => {
            const newMuted = !prev.isMuted;
            mediaManager.current?.setAudioEnabled(!newMuted);
            return { ...prev, isMuted: newMuted };
        });
    }, [mediaManager, setState]);

    const setSearching = useCallback((searching: boolean) => {
        setState(prev => ({ ...prev, isSearching: searching }));
    }, [setState]);

    const setConnected = useCallback((connected: boolean) => {
        setState(prev => ({ ...prev, isConnected: connected }));
    }, [setState]);

    const setPartner = useCallback((
        partnerId: string | null,
        country?: string,
        countryCode?: string,
        username?: string,
        avatar?: string,
        gender?: string,
        userId?: string | null,
    ) => {
        setState(prev => ({
            ...prev,
            partnerId,
            partnerUserId: userId || null,
            partnerCountry: country || '',
            partnerCountryCode: countryCode || '',
            partnerUsername: username || '',
            partnerAvatar: avatar || '',
            partnerGender: gender || '',
        }));
    }, [setState]);

    const setPartnerSignalStrength = useCallback((strength: 'good' | 'fair' | 'poor' | 'reconnecting') => {
        setState(prev => ({ ...prev, partnerSignalStrength: strength }));
    }, [setState]);

    const resetState = useCallback(() => {
        setState(prev => ({
            isSearching: false,
            isConnected: false,
            partnerCountry: '',
            partnerCountryCode: '',
            partnerUsername: '',
            partnerAvatar: '',
            partnerGender: '',
            partnerId: null,
            partnerUserId: null,
            isMuted: prev.isMuted,
            isMediaReady: prev.isMediaReady,
            permissionDenied: prev.permissionDenied,
            partnerSignalStrength: 'good',
        }));
    }, [setState]);

    return {
        initMediaManager,
        cleanupMedia,
        toggleMute,
        setSearching,
        setConnected,
        setPartner,
        setPartnerSignalStrength,
        resetState,
    };
};
