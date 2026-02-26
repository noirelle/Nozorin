import { useEffect } from 'react';
import { useMatching } from '@/hooks';
import { useRoomActionsState } from './useRoomActionsState';
import { useRoomActionsCallbacks } from './useRoomActionsCallbacks';
import { CallRoomState } from '@/hooks';

interface UseRoomActionsProps {
    mode: 'voice';
    callRoomState: CallRoomState;
    setSearching: (v: boolean) => void;
    setConnected: (v: boolean) => void;
    setPartner: (id: string | null, country_name?: string, country?: string, username?: string, avatar?: string, gender?: string, user_id?: string | null) => void;
    setHasPromptedForPermission: (prompted: boolean) => void;
    resetState: () => void;
    initMediaManager: () => Promise<boolean>;
    cleanupMedia: () => void;
    createOffer: (partnerId: string) => Promise<void>;
    closePeerConnection: () => void;
    clearMessages: () => void;
    sendMessage: (text: string) => void;
    trackSessionStart: (partnerId: string, mode: 'voice') => void;
    trackSessionEnd: (reason: 'user-action' | 'partner-disconnect' | 'error' | 'skip' | 'network' | 'answered-another') => void;
    selectedCountry: string;
    toggleLocalMute: () => void;
    isDirectCall?: boolean;
}

export const useRoomActions = (props: UseRoomActionsProps) => {
    const roomActionsState = useRoomActionsState();
    const callbacks = useRoomActionsCallbacks({ ...props, roomActionsState });

    const matching = useMatching({
        onMatchFound: callbacks.onMatchFound,
        onMatchCancelled: callbacks.onMatchCancelled,
        onCallEnded: callbacks.onCallEnded,
        onPartnerReconnected: callbacks.onPartnerReconnected,
        onRejoinSuccess: callbacks.onRejoinSuccess,
        onRejoinFailed: callbacks.onRejoinFailed,
        onFatalError: props.resetState,
    });

    useEffect(() => {
        roomActionsState.startSearchRef.current = matching.startSearch;
        roomActionsState.stopSearchRef.current = matching.stopSearch;
        roomActionsState.endCallRef.current = matching.endCall;
    }, [matching, roomActionsState.startSearchRef, roomActionsState.stopSearchRef, roomActionsState.endCallRef]);

    useEffect(() => {
        roomActionsState.setIsDirectCall(!!props.isDirectCall);
    }, [props.isDirectCall, roomActionsState.setIsDirectCall]);

    return {
        handleStop: callbacks.handleStop,
        findMatch: callbacks.findMatch,
        handleNext: callbacks.handleNext,
        handleUserStop: callbacks.handleUserStop,
        handleSendMessage: callbacks.handleSendMessage,
        handleToggleMute: callbacks.handleToggleMute,
        partnerIsMuted: roomActionsState.partnerIsMuted,
        setPartnerIsMuted: roomActionsState.setPartnerIsMuted,
        isDirectCall: roomActionsState.isDirectCall,
        pendingRejoinPartnerRef: roomActionsState.pendingRejoinPartnerRef,
        matching,
        onMatchFound: callbacks.onMatchFound,
    };
};
