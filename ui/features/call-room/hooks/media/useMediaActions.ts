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
        setState(prev => ({ ...prev, is_media_ready: false }));
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
                    setState(prev => ({ ...prev, permission_denied: true, is_media_ready: false }));
                }
            };

            stream.getAudioTracks().forEach(track => {
                track.onended = handleTrackEnded;
            });

            if (mediaManager.current === manager) {
                setState(prev => ({ ...prev, is_media_ready: true, permission_denied: false }));
            }
            return true;
        } catch (err) {
            console.error('Failed to initialize media:', err);
            if (mediaManager.current === manager) {
                setState(prev => ({ ...prev, permission_denied: true }));
                mediaManager.current = null;
            }
            return false;
        }
    }, [mediaManager, setState, cleanupMedia]);

    const toggleMute = useCallback(() => {
        setState(prev => {
            const newMuted = !prev.is_muted;
            mediaManager.current?.setAudioEnabled(!newMuted);
            return { ...prev, is_muted: newMuted };
        });
    }, [mediaManager, setState]);

    const setSearching = useCallback((searching: boolean) => {
        setState(prev => ({ ...prev, is_searching: searching }));
    }, [setState]);

    const setConnected = useCallback((connected: boolean) => {
        setState(prev => ({ ...prev, is_connected: connected }));
    }, [setState]);

    const setPartner = useCallback((
        partner_id: string | null,
        country?: string,
        country_code?: string,
        username?: string,
        avatar?: string,
        gender?: string,
        user_id?: string | null,
        friendship_status?: 'none' | 'friends' | 'pending_sent' | 'pending_received',
    ) => {
        setState(prev => ({
            ...prev,
            partner_id,
            partner_user_id: user_id || null,
            partner_country: country || '',
            partner_country_code: country_code || '',
            partner_username: username || '',
            partner_avatar: avatar || '',
            partner_gender: gender || '',
            friendship_status: friendship_status || 'none',
        }));
    }, [setState]);

    const setPartnerSignalStrength = useCallback((strength: 'good' | 'fair' | 'poor' | 'reconnecting') => {
        setState(prev => ({ ...prev, partner_signal_strength: strength }));
    }, [setState]);

    const setPermissionDenied = useCallback((denied: boolean) => {
        setState(prev => ({ ...prev, permission_denied: denied }));
    }, [setState]);

    const setHasPromptedForPermission = useCallback((prompted: boolean) => {
        setState(prev => ({ ...prev, has_prompted_for_permission: prompted }));
    }, [setState]);

    const resetState = useCallback(() => {
        setState(prev => ({
            is_searching: false,
            is_connected: false,
            partner_country: '',
            partner_country_code: '',
            partner_username: '',
            partner_avatar: '',
            partner_gender: '',
            partner_id: null,
            partner_user_id: null,
            is_muted: prev.is_muted,
            is_media_ready: prev.is_media_ready,
            permission_denied: prev.permission_denied,
            partner_signal_strength: 'good',
            has_prompted_for_permission: prev.has_prompted_for_permission,
            friendship_status: 'none',
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
