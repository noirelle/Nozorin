import { useCallback } from 'react';
import { emitToggleMute, emitUpdateMediaState } from '../../../../lib/socket/media/media.actions';
import { MatchFoundPayload } from '../../../../lib/socket/matching/matching.types';
import { CallRoomState } from '@/hooks';
import { UseRoomActionsStateReturn } from './useRoomActionsState';

interface UseRoomActionsCallbacksProps {
    mode: 'voice';
    callRoomState: CallRoomState;
    setSearching: (v: boolean) => void;
    setConnected: (v: boolean) => void;
    setPartner: (id: string | null, country?: string, countryCode?: string, username?: string, avatar?: string, gender?: string, userId?: string | null) => void;
    resetState: () => void;
    createOffer: (partnerId: string) => Promise<void>;
    closePeerConnection: () => void;
    clearMessages: () => void;
    sendMessage: (text: string) => void;
    trackSessionStart: (partnerId: string, mode: 'voice') => void;
    trackSessionEnd: (reason: 'user-action' | 'partner-disconnect' | 'error' | 'skip' | 'network' | 'answered-another') => void;
    selectedCountry: string;
    toggleLocalMute: () => void;
    roomActionsState: UseRoomActionsStateReturn;
}

export const useRoomActionsCallbacks = ({
    mode,
    callRoomState,
    setSearching,
    setConnected,
    setPartner,
    resetState,
    createOffer,
    closePeerConnection,
    clearMessages,
    sendMessage,
    trackSessionStart,
    trackSessionEnd,
    selectedCountry,
    toggleLocalMute,
    roomActionsState,
}: UseRoomActionsCallbacksProps) => {
    const {
        setPartnerIsMuted,
        manualStopRef,
        pendingRejoinPartnerRef,
        nextTimeoutRef,
        reconnectTimeoutRef,
        startSearchRef,
        stopSearchRef,
        endCallRef,
    } = roomActionsState;

    const partnerIdRef = { current: callRoomState.partnerId };

    const handleStop = useCallback(() => {
        if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        stopSearchRef.current();
        endCallRef.current(callRoomState.partnerId);
        closePeerConnection();
        resetState();
        clearMessages();
        setPartnerIsMuted(false);
    }, [closePeerConnection, resetState, clearMessages, setPartnerIsMuted, callRoomState.partnerId, stopSearchRef, endCallRef, nextTimeoutRef, reconnectTimeoutRef]);

    const findMatch = useCallback((forceSkip: boolean = false) => {
        if (callRoomState.partnerId && !forceSkip) return;
        manualStopRef.current = false;
        resetState();
        clearMessages();
        setPartnerIsMuted(false);
        closePeerConnection();
        setSearching(true);
        startSearchRef.current({ preferredCountry: selectedCountry === 'GLOBAL' ? undefined : selectedCountry });
    }, [callRoomState.partnerId, resetState, clearMessages, closePeerConnection, setSearching, selectedCountry, setPartnerIsMuted, manualStopRef, startSearchRef]);

    const handleNext = useCallback(() => {
        manualStopRef.current = true;
        try { localStorage.removeItem('nz_active_call'); } catch { }
        trackSessionEnd('skip');
        if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
        findMatch(true);
    }, [findMatch, trackSessionEnd, manualStopRef, nextTimeoutRef]);

    const handleUserStop = useCallback(() => {
        manualStopRef.current = true;
        try { localStorage.removeItem('nz_active_call'); } catch { }
        trackSessionEnd('user-action');
        handleStop();
    }, [handleStop, trackSessionEnd, manualStopRef]);

    const handleSendMessage = useCallback((text: string, setInputText: (t: string) => void) => {
        if (text.trim()) { sendMessage(text); setInputText(''); }
    }, [sendMessage]);

    const handleToggleMute = useCallback(() => {
        const newMuted = !callRoomState.isMuted;
        toggleLocalMute();
        if (callRoomState.isConnected && callRoomState.partnerId) emitToggleMute(callRoomState.partnerId, newMuted);
        emitUpdateMediaState(newMuted);
    }, [callRoomState.isMuted, callRoomState.isConnected, callRoomState.partnerId, toggleLocalMute]);

    const onMatchFound = useCallback(async (data: MatchFoundPayload) => {
        setSearching(false);
        setConnected(true);
        setPartner(data.partnerId, data.partnerCountry, data.partnerCountryCode, data.partnerUsername, data.partnerAvatar, data.partnerGender, data.partnerUserId);
        setPartnerIsMuted(!!data.partnerIsMuted);
        try {
            localStorage.setItem('nz_active_call', JSON.stringify({
                roomId: data.roomId, peerId: data.partnerId, startedAt: Date.now(),
                partnerProfile: { id: data.partnerId, username: data.partnerUsername, displayName: data.partnerUsername, avatar: data.partnerAvatar, country: data.partnerCountry || 'unknown', city: null, timezone: null },
            }));
        } catch { }
        trackSessionStart(data.partnerId, mode);
        if (mode === 'voice' && data.role === 'offerer') await createOffer(data.partnerId);
    }, [mode, createOffer, setSearching, setConnected, setPartner, setPartnerIsMuted, trackSessionStart]);

    const onCallEnded = useCallback(() => {
        if (manualStopRef.current) { manualStopRef.current = false; return; }
        trackSessionEnd('partner-disconnect');
        handleStop();
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        try { localStorage.removeItem('nz_active_call'); } catch { }
        setSearching(true);
        reconnectTimeoutRef.current = setTimeout(() => findMatch(), 300);
    }, [handleStop, findMatch, trackSessionEnd, setSearching, manualStopRef, reconnectTimeoutRef]);

    const onMatchCancelled = useCallback((data: { reason: string }) => {
        handleStop();
        setSearching(true);
        setTimeout(() => findMatch(), 1000);
    }, [handleStop, findMatch, setSearching]);

    const onPartnerReconnected = useCallback(async (data: { newSocketId: string }) => {
        setPartner(data.newSocketId, callRoomState.partnerCountry, callRoomState.partnerCountryCode, callRoomState.partnerUsername, callRoomState.partnerAvatar, callRoomState.partnerGender, callRoomState.partnerUserId);
        closePeerConnection();
    }, [closePeerConnection, setPartner, callRoomState.partnerCountry, callRoomState.partnerCountryCode, callRoomState.partnerUsername, callRoomState.partnerAvatar, callRoomState.partnerGender, callRoomState.partnerUserId]);

    const onRejoinSuccess = useCallback(async (data: any) => {
        setSearching(false);
        setConnected(true);
        setPartner(data.partnerId, data.partnerCountry || callRoomState.partnerCountry, data.partnerCountryCode || callRoomState.partnerCountryCode, callRoomState.partnerUsername, callRoomState.partnerAvatar, callRoomState.partnerGender, data.partnerUserId || callRoomState.partnerUserId);
        closePeerConnection();
        if (mode === 'voice') pendingRejoinPartnerRef.current = data.partnerId;
    }, [setSearching, setConnected, setPartner, closePeerConnection, mode, pendingRejoinPartnerRef, callRoomState.partnerCountry, callRoomState.partnerCountryCode, callRoomState.partnerUsername, callRoomState.partnerAvatar, callRoomState.partnerGender, callRoomState.partnerUserId]);

    const onRejoinFailed = useCallback((data: { reason: string }) => {
        resetState();
        try { localStorage.removeItem('nz_active_call'); } catch { }
    }, [resetState]);

    return {
        handleStop,
        findMatch,
        handleNext,
        handleUserStop,
        handleSendMessage,
        handleToggleMute,
        onMatchFound,
        onCallEnded,
        onMatchCancelled,
        onPartnerReconnected,
        onRejoinSuccess,
        onRejoinFailed,
    };
};
