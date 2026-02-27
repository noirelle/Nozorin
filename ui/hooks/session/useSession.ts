'use client';

import { useEffect } from 'react';
import { useSessionState } from './useSessionState';
import { useSessionActions } from './useSessionActions';

import { useSessionEffects } from './useSessionEffects';

interface UseSessionOptions {
    token: string | null;
    isChecking: boolean;
    user: any;
}

export const useSession = (options?: UseSessionOptions) => {
    const { token = null, isChecking = false, user = null } = options || {};
    const state = useSessionState();
    const actions = useSessionActions({
        setInitialCallData: state.setInitialCallData,
        setInitialReconnecting: state.setInitialReconnecting,
        setIsVerifyingSession: state.setIsVerifyingSession,
    });

    useSessionEffects({
        token,
        isChecking,
        user,
        verifyActiveCallSession: actions.verifyActiveCallSession,
        setIsVerifyingSession: state.setIsVerifyingSession,
    });

    return {
        sessionId: state.sessionId,
        isVerifyingSession: state.isVerifyingSession,
        initialReconnecting: state.initialReconnecting,
        initialCallData: state.initialCallData,
        getSessionId: actions.getSessionId,
    };
};
