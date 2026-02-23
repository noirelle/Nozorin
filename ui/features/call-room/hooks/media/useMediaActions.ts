import { useCallback } from 'react';
import { MediaStreamManager } from '../../../../lib/mediaStream';
import { UseMediaStateReturn, CallRoomState } from './useMediaState';

interface UseMediaActionsProps {
    setState: UseMediaStateReturn['setState'];
    mediaManager: UseMediaStateReturn['mediaManager'];
    mode: 'voice';
}

export const useMediaActions = ({ setState, mediaManager, mode }: UseMediaActionsProps) => {
    const cleanupMedia = useCallback(() => {
        mediaManager.current?.cleanup();
        mediaManager.current = null;
        setState(prev => ({ ...prev, isMediaReady: false }));
    }, [mediaManager, setState]);

    const initMediaManager = useCallback(async (): Promise<boolean> => {
        const existingStream = mediaManager.current?.getStream();
        const isHealthy = existingStream && existingStream.active && existingStream.getAudioTracks().some(t => t.readyState === 'live');

        if (isHealthy) return true;

        if (mediaManager.current) {
            console.log('[MediaActions] Existing media stream unhealthy, re-initializing...');
            cleanupMedia();
        }

        const manager = new MediaStreamManager();
        mediaManager.current = manager;

        try {
            await manager.init();

            // CRITICAL: If cleanupMedia was called while we were waiting for user permission,
            // mediaManager.current will be null. We MUST instantly stop these tracks as the user
            // has already pressed stop.
            if (mediaManager.current !== manager) {
                console.log('[MediaActions] Initialization finished, but stream was already cleaned up (e.g. user clicked stop). Shutting down immediately.');
                manager.cleanup();
                return false;
            }

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
            return true;
        } catch (err) {
            console.error('Failed to initialize media:', err);
            if (mediaManager.current === manager) {
                setState(prev => ({ ...prev, permissionDenied: true }));
                mediaManager.current = null;
            }
            return false;
        }
    }, [mediaManager, setState, cleanupMedia]);

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

    const setPermissionDenied = useCallback((denied: boolean) => {
        setState(prev => ({ ...prev, permissionDenied: denied }));
    }, [setState]);

    const setHasPromptedForPermission = useCallback((prompted: boolean) => {
        setState(prev => ({ ...prev, hasPromptedForPermission: prompted }));
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
            hasPromptedForPermission: prev.hasPromptedForPermission,
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
        setPermissionDenied,
        setHasPromptedForPermission,
        resetState,
    };
};
