import { useSessionState } from './useSessionState';
import { useSessionActions } from './useSessionActions';

export const useSession = () => {
    const state = useSessionState();
    const actions = useSessionActions({
        setInitialCallData: state.setInitialCallData,
        setInitialReconnecting: state.setInitialReconnecting,
        setIsVerifyingSession: state.setIsVerifyingSession,
    });

    return {
        sessionId: state.sessionId,
        isVerifyingSession: state.isVerifyingSession,
        initialReconnecting: state.initialReconnecting,
        initialCallData: state.initialCallData,
        getSessionId: actions.getSessionId,
        verifyActiveCallSession: actions.verifyActiveCallSession,
    };
};
