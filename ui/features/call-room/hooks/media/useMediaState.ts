import { useState, useRef } from 'react';
import { MediaStreamManager } from '../../../../lib/mediaStream';

export interface CallRoomState {
    isSearching: boolean;
    isConnected: boolean;
    partnerCountry: string;
    partnerCountryCode: string;
    partnerUsername: string;
    partnerAvatar: string;
    partnerGender: string;
    partnerId: string | null;
    partnerUserId: string | null;
    isMuted: boolean;
    isMediaReady: boolean;
    permissionDenied: boolean;
    partnerSignalStrength: 'good' | 'fair' | 'poor' | 'reconnecting';
    hasPromptedForPermission: boolean;
}

export const INITIAL_CALL_ROOM_STATE: CallRoomState = {
    isSearching: false,
    isConnected: false,
    partnerCountry: '',
    partnerCountryCode: '',
    partnerUsername: '',
    partnerAvatar: '',
    partnerGender: '',
    partnerId: null,
    partnerUserId: null,
    isMuted: false,
    isMediaReady: false,
    permissionDenied: false,
    partnerSignalStrength: 'good',
    hasPromptedForPermission: false,
};

export const useMediaState = () => {
    const [state, setState] = useState<CallRoomState>(INITIAL_CALL_ROOM_STATE);
    const mediaManager = useRef<MediaStreamManager | null>(null);

    return { state, setState, mediaManager };
};

export type UseMediaStateReturn = ReturnType<typeof useMediaState>;
