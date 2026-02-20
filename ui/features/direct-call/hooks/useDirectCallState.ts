import { useState } from 'react';
import { IncomingCallPayload } from '../../../lib/socket/direct-call/directCall.types';

export interface DirectCallState {
    incomingCall: IncomingCallPayload | null;
    isCalling: boolean;
    callTarget: string | null;
    error: string | null;
}

export const INITIAL_DIRECT_CALL_STATE: DirectCallState = {
    incomingCall: null,
    isCalling: false,
    callTarget: null,
    error: null,
};

export const useDirectCallState = () => {
    const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);
    const [isCalling, setIsCalling] = useState(false);
    const [callTarget, setCallTarget] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    return {
        incomingCall,
        isCalling,
        callTarget,
        error,
        setIncomingCall,
        setIsCalling,
        setCallTarget,
        setError,
    };
};

export type UseDirectCallStateReturn = ReturnType<typeof useDirectCallState>;
