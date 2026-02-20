import { useDirectCallState } from './useDirectCallState';
import { useDirectCallActions } from './useDirectCallActions';
import { useDirectCallListeners } from './useDirectCallListeners';

export const useDirectCall = (onCallStarted?: () => void) => {
    const state = useDirectCallState();
    const actions = useDirectCallActions({ ...state, onCallStarted });
    useDirectCallListeners(state);

    return {
        // State
        incomingCall: state.incomingCall,
        isCalling: state.isCalling,
        callTarget: state.callTarget,
        error: state.error,
        // Actions
        initiateCall: actions.initiateCall,
        acceptCall: actions.acceptCall,
        declineCall: actions.declineCall,
        cancelCall: actions.cancelCall,
        clearCallState: actions.clearCallState,
    };
};
