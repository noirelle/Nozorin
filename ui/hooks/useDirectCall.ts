import { useCallback, useEffect, useState } from 'react';
import { useSocketEvent } from '../lib/socket';
import { SocketEvents } from '../lib/socket';
import * as directCallActions from '../lib/socket/direct-call/directCall.actions';
import { IncomingCallPayload, CallErrorPayload } from '../lib/socket/direct-call/directCall.types';

export const useDirectCall = (onCallStarted?: () => void) => {
    const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);
    const [isCalling, setIsCalling] = useState(false);
    const [callTarget, setCallTarget] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // ── Listeners ─────────────────────────────────────────────────────────────

    const handleIncomingCall = useCallback((data: IncomingCallPayload) => {
        console.log('[DirectCall] Incoming call from:', data.fromUserId);
        setError(null);
        setIncomingCall(data);
    }, []);

    const handleCallCancelled = useCallback(() => {
        console.log('[DirectCall] Call cancelled by caller');
        setError('User aborted the call');
        setTimeout(() => { setIncomingCall(null); setError(null); }, 3000);
    }, []);

    const handleCallError = useCallback((data: CallErrorPayload) => {
        setError(data.message);
        setTimeout(() => { setIsCalling(false); setCallTarget(null); setError(null); }, 3000);
    }, []);

    const handleCallDeclined = useCallback(() => {
        console.log('[DirectCall] Call declined by partner');
        setError('User declined');
        setTimeout(() => { setIsCalling(false); setCallTarget(null); setError(null); }, 3000);
    }, []);

    const handleMatchFound = useCallback(() => {
        setIsCalling(false);
        setCallTarget(null);
    }, []);

    useSocketEvent<IncomingCallPayload>(SocketEvents.INCOMING_CALL, handleIncomingCall);
    useSocketEvent(SocketEvents.CALL_CANCELLED_BY_CALLER, handleCallCancelled);
    useSocketEvent<CallErrorPayload>(SocketEvents.CALL_ERROR, handleCallError);
    useSocketEvent(SocketEvents.CALL_DECLINED, handleCallDeclined);
    useSocketEvent(SocketEvents.MATCH_FOUND, handleMatchFound);

    // ── Actions ───────────────────────────────────────────────────────────────

    const initiateCall = useCallback((targetUserId: string, mode: 'voice') => {
        setError(null);
        setIsCalling(true);
        setCallTarget(targetUserId);
        onCallStarted?.();
        directCallActions.emitInitiateCall(targetUserId, mode);
    }, [onCallStarted]);

    const acceptCall = useCallback(() => {
        if (!incomingCall) return;
        onCallStarted?.();
        directCallActions.emitRespondToCall(incomingCall.fromSocketId, true, incomingCall.mode);
        setIncomingCall(null);
    }, [incomingCall, onCallStarted]);

    const declineCall = useCallback(() => {
        if (!incomingCall) return;
        onCallStarted?.();
        directCallActions.emitRespondToCall(incomingCall.fromSocketId, false, incomingCall.mode);
        setIncomingCall(null);
    }, [incomingCall, onCallStarted]);

    const cancelCall = useCallback(() => {
        if (!callTarget) return;
        directCallActions.emitCancelCall(callTarget);
        setIsCalling(false);
        setCallTarget(null);
    }, [callTarget]);

    const clearCallState = useCallback(() => {
        if (error) {
            console.log('[DirectCall] Skipping manual clear - error message active:', error);
            return;
        }
        console.log('[DirectCall] Manually clearing call state');
        setIsCalling(false);
        setCallTarget(null);
        setIncomingCall(null);
    }, [error]);

    return {
        incomingCall,
        isCalling,
        callTarget,
        error,
        initiateCall,
        acceptCall,
        declineCall,
        cancelCall,
        clearCallState,
    };
};
