'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useSessionState } from '@/hooks/session/useSessionState';
import { useSessionActions } from '@/hooks/session/useSessionActions';
import { useAuth } from './AuthContext';

interface SessionContextType {
    sessionId: string | null;
    isVerifyingSession: boolean;
    initialReconnecting: boolean;
    initialCallData: any;
    verifyActiveCallSession: () => Promise<void>;
    setInitialCallData: (data: any) => void;
    setInitialReconnecting: (reconnecting: boolean) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
    const { token, isChecked } = useAuth();
    const state = useSessionState();
    const actions = useSessionActions({
        setInitialCallData: state.setInitialCallData,
        setInitialReconnecting: state.setInitialReconnecting,
        setIsVerifyingSession: state.setIsVerifyingSession,
    });

    const hasVerifiedRef = useRef(false);

    useEffect(() => {
        if (isChecked) {
            if (token && !hasVerifiedRef.current) {
                hasVerifiedRef.current = true;
                actions.verifyActiveCallSession();
            } else if (!token) {
                // If checked but no token, we aren't in a session
                state.setIsVerifyingSession(false);
            }
        }
    }, [isChecked, token, actions]);

    return (
        <SessionContext.Provider value={{
            sessionId: state.sessionId,
            isVerifyingSession: state.isVerifyingSession,
            initialReconnecting: state.initialReconnecting,
            initialCallData: state.initialCallData,
            verifyActiveCallSession: actions.verifyActiveCallSession,
            setInitialCallData: state.setInitialCallData,
            setInitialReconnecting: state.setInitialReconnecting,
        }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSessionContext = () => {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSessionContext must be used within a SessionProvider');
    }
    return context;
};
