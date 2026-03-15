import { useCallback } from 'react';
import { UseDirectCallStateReturn } from './useDirectCallState';
import { useCall } from '../../../../hooks/call/useCall';
import { emitCancelCall } from '../../../../lib/socket/direct-call/directCall.actions';

interface UseDirectCallActionsProps {
    incomingCall: UseDirectCallStateReturn['incomingCall'];
    callTarget: UseDirectCallStateReturn['callTarget'];
    error: UseDirectCallStateReturn['error'];
    setIsCalling: UseDirectCallStateReturn['setIsCalling'];
    setCallTarget: UseDirectCallStateReturn['setCallTarget'];
    setIncomingCall: UseDirectCallStateReturn['setIncomingCall'];
    setError: UseDirectCallStateReturn['setError'];
    onCallStarted?: () => void;
    initMediaManager: () => Promise<boolean>;
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
    initMediaManager,
}: UseDirectCallActionsProps) => {
    const { requestCall, respondToCall } = useCall({ setError });

    const initiateCall = useCallback(async (targetUserId: string, mode: 'voice') => {
        setError(null);
        setIsCalling(true);
        setCallTarget(targetUserId);
        onCallStarted?.();

        const success = await requestCall(targetUserId, mode);
        if (!success) {
            setIsCalling(false);
            setCallTarget(null);
        }
    }, [onCallStarted, setError, setIsCalling, setCallTarget, requestCall]);

    const acceptCall = useCallback(async () => {
        if (!incomingCall) return;

        // Proactively warm up media manager before joining the room
        // to ensure tracks are ready by the time WebRTC handshake begins.
        await initMediaManager();

        onCallStarted?.();

        const success = await respondToCall(incomingCall.from_user_id, true, incomingCall.mode);
        if (success) {
            setIncomingCall(null);
        }
    }, [incomingCall, onCallStarted, setIncomingCall, respondToCall, initMediaManager]);

    const declineCall = useCallback(async () => {
        if (!incomingCall) return;

        const success = await respondToCall(incomingCall.from_user_id, false, incomingCall.mode);
        if (success) {
            setIncomingCall(null);
        }
    }, [incomingCall, setIncomingCall, respondToCall]);

    const cancelCall = useCallback(() => {
        if (!callTarget) return;

        emitCancelCall(callTarget);
        setIsCalling(false);
        setCallTarget(null);
    }, [callTarget, setIsCalling, setCallTarget]);

    const clearCallState = useCallback(() => {
        if (error) {
            return;
        }
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
