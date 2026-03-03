import { useMediaState } from './useMediaState';
import { useMediaActions } from './useMediaActions';
import { useMedia } from '@/contexts/MediaContext';

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

    return {
        state: combinedState,
        mediaManager: { current: media.getMediaManager() }, // Shim for existing code expecting a ref
        initMediaManager: media.initMediaManager,
        cleanupMedia: media.cleanupMedia,
        toggleMute: media.toggleMute,
        setSearching: actions.setSearching,
        setConnected: actions.setConnected,
        setPartner: actions.setPartner,
        setPartnerSignalStrength: actions.setPartnerSignalStrength,
        setPermissionDenied: (denied: boolean) => { }, // Handled by context now
        setHasPromptedForPermission: (prompted: boolean) => { }, // Handled by context now
        resetState: actions.resetState,
    };
};
