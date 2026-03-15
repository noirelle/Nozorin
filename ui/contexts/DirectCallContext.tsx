'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDirectCallState } from '@/features/direct-call/hooks/direct-call/useDirectCallState';
import { useDirectCallActions } from '@/features/direct-call/hooks/direct-call/useDirectCallActions';
import { useDirectCallListeners } from '@/features/direct-call/hooks/direct-call/useDirectCallListeners';
import { useMedia } from '@/contexts/MediaContext';
import { IncomingCallPayload } from '@/lib/socket/direct-call/directCall.types';
import { IncomingCallOverlay } from '@/features/direct-call/components/IncomingCallOverlay';
import { OutgoingCallOverlay } from '@/features/direct-call/components/OutgoingCallOverlay';

interface DirectCallContextType {
    incomingCall: IncomingCallPayload | null;
    isCalling: boolean;
    callTarget: string | null;
    error: string | null;
    initiateCall: (targetUserId: string, mode: 'voice') => Promise<void>;
    acceptCall: () => Promise<void>;
    declineCall: () => Promise<void>;
    cancelCall: () => void;
    clearCallState: () => void;
}

const DirectCallContext = createContext<DirectCallContextType | undefined>(undefined);

export const DirectCallProvider = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const state = useDirectCallState();

    const onCallStarted = useCallback(() => {
        router.push('/app/voice');
    }, [router]);

    const { initMediaManager } = useMedia();

    const actions = useDirectCallActions({
        incomingCall: state.incomingCall,
        callTarget: state.callTarget,
        error: state.error,
        setIsCalling: state.setIsCalling,
        setCallTarget: state.setCallTarget,
        setIncomingCall: state.setIncomingCall,
        setError: state.setError,
        onCallStarted,
        initMediaManager,
    });

    useDirectCallListeners({
        setIncomingCall: state.setIncomingCall,
        setIsCalling: state.setIsCalling,
        setCallTarget: state.setCallTarget,
        setError: state.setError,
    });

    return (
        <DirectCallContext.Provider value={{
            incomingCall: state.incomingCall,
            isCalling: state.isCalling,
            callTarget: state.callTarget,
            error: state.error,
            initiateCall: actions.initiateCall,
            acceptCall: actions.acceptCall,
            declineCall: actions.declineCall,
            cancelCall: actions.cancelCall,
            clearCallState: actions.clearCallState,
        }}>
            {children}

            {/* Global Overlays */}
            {state.incomingCall && (
                <IncomingCallOverlay
                    from_username={state.incomingCall.from_username}
                    from_avatar={state.incomingCall.from_avatar}
                    from_country_name={state.incomingCall.from_country_name}
                    from_country={state.incomingCall.from_country}
                    mode={state.incomingCall.mode}
                    onAccept={actions.acceptCall}
                    onDecline={actions.declineCall}
                    error={state.error}
                />
            )}

            {state.isCalling && (
                <OutgoingCallOverlay
                    onCancel={actions.cancelCall}
                    error={state.error}
                />
            )}
        </DirectCallContext.Provider>
    );
};

export const useDirectCallContext = () => {
    const context = useContext(DirectCallContext);
    if (context === undefined) {
        throw new Error('useDirectCallContext must be used within a DirectCallProvider');
    }
    return context;
};
