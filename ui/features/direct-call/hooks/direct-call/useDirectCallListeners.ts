import { useCallback } from 'react';
import { useSocketEvent, SocketEvents } from '../../../../lib/socket';
import { IncomingCallPayload, CallErrorPayload } from '../../../../lib/socket/direct-call/directCall.types';
import { UseDirectCallStateReturn } from './useDirectCallState';

interface UseDirectCallListenersProps {
    setIncomingCall: UseDirectCallStateReturn['setIncomingCall'];
    setIsCalling: UseDirectCallStateReturn['setIsCalling'];
    setCallTarget: UseDirectCallStateReturn['setCallTarget'];
    setError: UseDirectCallStateReturn['setError'];
}

export const useDirectCallListeners = ({
    setIncomingCall,
    setIsCalling,
    setCallTarget,
    setError,
}: UseDirectCallListenersProps) => {
    const handleIncomingCall = useCallback((data: IncomingCallPayload) => {
        console.log('[DirectCall] Incoming call from:', data.from_user_id);
        setError(null);
        setIncomingCall(data);
    }, [setError, setIncomingCall]);

    const handleCallCancelled = useCallback(() => {
        console.log('[DirectCall] Call cancelled by caller');
        setError('User aborted the call');
        setTimeout(() => { setIncomingCall(null); setError(null); }, 3000);
    }, [setIncomingCall, setError]);

    const handleCallError = useCallback((data: CallErrorPayload) => {
        setError(data.message);
        setTimeout(() => { setIsCalling(false); setCallTarget(null); setError(null); }, 3000);
    }, [setError, setIsCalling, setCallTarget]);

    const handleCallDeclined = useCallback(() => {
        console.log('[DirectCall] Call declined by partner');
        setError('User declined');
        setTimeout(() => { setIsCalling(false); setCallTarget(null); setError(null); }, 3000);
    }, [setError, setIsCalling, setCallTarget]);

    const handleMatchFound = useCallback(() => {
        setIsCalling(false);
        setCallTarget(null);
    }, [setIsCalling, setCallTarget]);

    useSocketEvent<IncomingCallPayload>(SocketEvents.INCOMING_CALL, handleIncomingCall);
    useSocketEvent(SocketEvents.CALL_CANCELLED_BY_CALLER, handleCallCancelled);
    useSocketEvent<CallErrorPayload>(SocketEvents.CALL_ERROR, handleCallError);
    useSocketEvent(SocketEvents.CALL_DECLINED, handleCallDeclined);
    useSocketEvent(SocketEvents.MATCH_FOUND, handleMatchFound);
};
