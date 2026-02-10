
import { useCallback, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

interface IncomingCall {
    fromUserId: string;
    fromSocketId: string;
    fromCountry: string;
    fromCountryCode: string;
    mode: 'chat' | 'video';
}

export const useDirectCall = (socket: Socket | null, onCallStarted?: () => void) => {
    const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
    const [isCalling, setIsCalling] = useState(false);
    const [callTarget, setCallTarget] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!socket) return;

        const handleIncomingCall = (data: IncomingCall) => {
            console.log('[DirectCall] Incoming call from:', data.fromUserId);
            setError(null);
            setIncomingCall(data);
        };

        const handleCallCancelled = () => {
            console.log('[DirectCall] Call cancelled by caller');
            setError('User aborted the call');
            setTimeout(() => {
                setIncomingCall(null);
                setError(null);
            }, 3000);
        };

        const handleCallError = (data: { message: string }) => {
            setError(data.message);
            setTimeout(() => {
                setIsCalling(false);
                setCallTarget(null);
                setError(null);
            }, 3000);
        };

        const handleCallDeclined = () => {
            console.log('[DirectCall] Call declined by partner');
            setError('User declined');
            // Keep isCalling true for a bit so the overlay stays visible to show the error
            setTimeout(() => {
                setIsCalling(false);
                setCallTarget(null);
                setError(null);
            }, 3000);
        };

        const handleMatchFound = () => {
            setIsCalling(false);
            setCallTarget(null);
        };

        socket.on('incoming-call', handleIncomingCall);
        socket.on('call-cancelled-by-caller', handleCallCancelled);
        socket.on('call-error', handleCallError);
        socket.on('call-declined', handleCallDeclined);
        socket.on('match-found', handleMatchFound);

        return () => {
            socket.off('incoming-call', handleIncomingCall);
            socket.off('call-cancelled-by-caller', handleCallCancelled);
            socket.off('call-error', handleCallError);
            socket.off('call-declined', handleCallDeclined);
            socket.off('match-found', handleMatchFound);
        };
    }, [socket]);

    const initiateCall = useCallback((targetUserId: string, mode: 'chat' | 'video') => {
        if (!socket) return;
        setError(null);
        setIsCalling(true);
        setCallTarget(targetUserId);
        onCallStarted?.();
        socket.emit('initiate-direct-call', { targetUserId, mode });
    }, [socket, onCallStarted]);

    const acceptCall = useCallback(() => {
        if (!socket || !incomingCall) return;
        onCallStarted?.();
        socket.emit('respond-to-call', {
            callerSocketId: incomingCall.fromSocketId,
            accepted: true,
            mode: incomingCall.mode
        });
        setIncomingCall(null);
    }, [socket, incomingCall, onCallStarted]);

    const declineCall = useCallback(() => {
        if (!socket || !incomingCall) return;
        onCallStarted?.();
        socket.emit('respond-to-call', {
            callerSocketId: incomingCall.fromSocketId,
            accepted: false,
            mode: incomingCall.mode
        });
        setIncomingCall(null);
    }, [socket, incomingCall, onCallStarted]);

    const cancelCall = useCallback(() => {
        if (!socket || !callTarget) return;
        onCallStarted?.();
        socket.emit('cancel-call', { targetUserId: callTarget });
        setIsCalling(false);
        setCallTarget(null);
    }, [socket, callTarget, onCallStarted]);

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
