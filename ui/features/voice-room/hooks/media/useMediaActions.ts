import { useCallback } from 'react';
import { UseMediaStateReturn } from './useMediaState';
import { getAvatarUrl } from '@/utils/avatar';

interface UseMediaActionsProps {
    setState: UseMediaStateReturn['setState'];
}

export const useMediaActions = ({ setState }: UseMediaActionsProps) => {
    const setSearching = useCallback((searching: boolean) => {
        setState(prev => ({ ...prev, is_searching: searching }));
    }, [setState]);

    const setConnected = useCallback((connected: boolean) => {
        setState(prev => ({ ...prev, is_connected: connected }));
    }, [setState]);

    const setPartner = useCallback((
        partner_id: string | null,
        country_name?: string,
        country?: string,
        username?: string,
        avatar?: string,
        gender?: string,
        user_id?: string | null,
        friendship_status?: 'none' | 'friends' | 'pending_sent' | 'pending_received',
        role?: 'offerer' | 'answerer' | null,
    ) => {
        setState(prev => ({
            ...prev,
            partner_id,
            partner_user_id: user_id || null,
            partner_country_name: country_name || '',
            partner_country: country || '',
            partner_username: username || '',
            partner_avatar: getAvatarUrl(avatar),
            partner_gender: gender || '',
            friendship_status: friendship_status || 'none',
            role: role || null,
        }));
    }, [setState]);

    const setPartnerSignalStrength = useCallback((strength: 'good' | 'fair' | 'poor' | 'reconnecting') => {
        setState(prev => ({ ...prev, partner_signal_strength: strength }));
    }, [setState]);

    const resetState = useCallback(() => {
        setState(prev => ({
            is_searching: false,
            is_connected: false,
            partner_country_name: '',
            partner_country: '',
            partner_username: '',
            partner_avatar: '',
            partner_gender: '',
            partner_id: null,
            partner_user_id: null,
            role: null,
            // We preserve local media states but reset connection states
            is_muted: prev.is_muted,
            is_media_ready: prev.is_media_ready,
            permission_denied: prev.permission_denied,
            partner_signal_strength: 'good',
            has_prompted_for_permission: prev.has_prompted_for_permission,
            friendship_status: 'none',
        }));
    }, [setState]);

    return {
        setSearching,
        setConnected,
        setPartner,
        setPartnerSignalStrength,
        resetState,
    };
};
