import { useState, useRef } from 'react';
import { MediaStreamManager } from '../../../../lib/mediaStream';

export interface CallRoomState {
    is_searching: boolean;
    is_connected: boolean;
    partner_country_name: string;
    partner_country: string;
    partner_username: string;
    partner_avatar: string;
    partner_gender: string;
    partner_id: string | null;
    partner_user_id: string | null;
    is_muted: boolean;
    is_media_ready: boolean;
    permission_denied: boolean;
    partner_signal_strength: 'good' | 'fair' | 'poor' | 'reconnecting';
    has_prompted_for_permission: boolean;
    friendship_status: 'none' | 'friends' | 'pending_sent' | 'pending_received';
}

export const INITIAL_CALL_ROOM_STATE: CallRoomState = {
    is_searching: false,
    is_connected: false,
    partner_country_name: '',
    partner_country: '',
    partner_username: '',
    partner_avatar: '',
    partner_gender: '',
    partner_id: null,
    partner_user_id: null,
    is_muted: false,
    is_media_ready: false,
    permission_denied: false,
    partner_signal_strength: 'good',
    has_prompted_for_permission: false,
    friendship_status: 'none',
};

export const useMediaState = () => {
    const [state, setState] = useState<CallRoomState>(INITIAL_CALL_ROOM_STATE);
    const mediaManager = useRef<MediaStreamManager | null>(null);

    return { state, setState, mediaManager };
};

export type UseMediaStateReturn = ReturnType<typeof useMediaState>;
