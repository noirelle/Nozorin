import { useMediaState } from './useMediaState';
import { useMediaActions } from './useMediaActions';

export type { CallRoomState } from './useMediaState';

export const useCallRoom = (mode: 'voice') => {
    const { state, setState, mediaManager } = useMediaState();
    const actions = useMediaActions({ setState, mediaManager, mode });

    return {
        state,
        mediaManager,
        initMediaManager: actions.initMediaManager,
        cleanupMedia: actions.cleanupMedia,
        toggleMute: actions.toggleMute,
        setSearching: actions.setSearching,
        setConnected: actions.setConnected,
        setPartner: actions.setPartner,
        setPartnerSignalStrength: actions.setPartnerSignalStrength,
        setPermissionDenied: actions.setPermissionDenied,
        setHasPromptedForPermission: actions.setHasPromptedForPermission,
        resetState: actions.resetState,
    };
};
