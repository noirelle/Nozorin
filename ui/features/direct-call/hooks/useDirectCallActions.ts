import { useCallback } from 'react';
import * as directCallActions from '../../../lib/socket/direct-call/directCall.actions';
import { UseDirectCallStateReturn } from './useDirectCallState';

interface UseDirectCallActionsProps extends UseDirectCallStateReturn {
    onCallStarted?: () => void;
}

export const useDirectCallActions = ({
    incomingCall,
    callTarget,
    error,
    setIsCalling,
    setCallTarget,
    setIncomingCall,
    setError,
    onCallStarted,
}: UseDirectCallActionsProps) => {
    const initiateCall = useCallback((targetUserId: string, mode: 'voice') => {
        setError(null);
        setIsCalling(true);
        setCallTarget(targetUserId);
        onCallStarted?.();
        directCallActions.emitInitiateCall(targetUserId, mode);
    }, [onCallStarted, setError, setIsCalling, setCallTarget]);

    const acceptCall = useCallback(() => {
        if (!incomingCall) return;
        onCallStarted?.();
        directCallActions.emitRespondToCall(incomingCall.fromSocketId, true, incomingCall.mode);
        setIncomingCall(null);
    }, [incomingCall, onCallStarted, setIncomingCall]);

    const declineCall = useCallback(() => {
        if (!incomingCall) return;
        onCallStarted?.();
        directCallActions.emitRespondToCall(incomingCall.fromSocketId, false, incomingCall.mode);
        setIncomingCall(null);
    }, [incomingCall, onCallStarted, setIncomingCall]);

    const cancelCall = useCallback(() => {
        if (!callTarget) return;
        directCallActions.emitCancelCall(callTarget);
        setIsCalling(false);
        setCallTarget(null);
    }, [callTarget, setIsCalling, setCallTarget]);

    const clearCallState = useCallback(() => {
        if (error) {
            console.log('[DirectCall] Skipping manual clear - error message active:', error);
            return;
        }
        console.log('[DirectCall] Manually clearing call state');
        setIsCalling(false);
        setCallTarget(null);
        setIncomingCall(null);
    }, [error, setIsCalling, setCallTarget, setIncomingCall]);

    return {
        initiateCall,
        acceptCall,
        declineCall,
        cancelCall,
        clearCallState,
    };
};
