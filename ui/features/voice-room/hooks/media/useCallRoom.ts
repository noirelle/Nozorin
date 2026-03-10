import { useRef } from 'react';
import { useMediaState } from './useMediaState';
import { useMediaActions } from './useMediaActions';
import { useMedia } from '@/contexts/MediaContext';
import { MediaStreamManager } from '@/lib/mediaStream';

export type { CallRoomState } from './useMediaState';

export const useCallRoom = (mode: 'voice') => {
    const { state, setState } = useMediaState();
    const actions = useMediaActions({ setState });
    const media = useMedia();

    // Combine local state with global media state
    const combinedState = {
        ...state,
        is_muted: media.isMuted,
        is_media_ready: media.isMediaReady,
        permission_denied: media.permissionDenied,
        has_prompted_for_permission: media.hasPromptedForPermission,
    };

    // A stable ref-shaped object whose `.current` always reads the live value from
    // MediaContext. The previous `{ current: media.getMediaManager() }` was a plain
    // object snapshot captured at render time — after `initMediaManager()` sets the
    // stream, any closure in useWebRTCActions still saw the old null snapshot.
    const mediaManagerRef = useRef<{ current: MediaStreamManager | null }>(null!);
    if (!mediaManagerRef.current) {
        const proxy = {} as { current: MediaStreamManager | null };
        Object.defineProperty(proxy, 'current', {
            get: () => media.getMediaManager(),
            enumerable: true,
        });
        mediaManagerRef.current = proxy;
    }

    return {
        state: combinedState,
        mediaManager: mediaManagerRef.current,
        initMediaManager: media.initMediaManager,
        cleanupMedia: media.cleanupMedia,
        toggleMute: media.toggleMute,
        setSearching: actions.setSearching,
        setConnected: actions.setConnected,
        setPartner: actions.setPartner,
        setPartnerSignalStrength: actions.setPartnerSignalStrength,
        setPermissionDenied: (_denied: boolean) => { },
        setHasPromptedForPermission: (_prompted: boolean) => { },
        resetState: actions.resetState,
    };
};
