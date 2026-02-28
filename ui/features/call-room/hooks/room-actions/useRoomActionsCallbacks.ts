import { useCallback } from 'react';
import { emitToggleMute, emitUpdateMediaState } from '../../../../lib/socket/media/media.actions';
import { MatchFoundPayload } from '../../../../lib/socket/matching/matching.types';
import { CallRoomState, useUser } from '@/hooks';
import { UseRoomActionsStateReturn } from './useRoomActionsState';

interface UseRoomActionsCallbacksProps {
    mode: 'voice';
    callRoomState: CallRoomState;
    setSearching: (v: boolean) => void;
    setConnected: (v: boolean) => void;
    setPartner: (
        id: string | null,
        country_name?: string,
        country?: string,
        username?: string,
        avatar?: string,
        gender?: string,
        user_id?: string | null,
        friendship_status?: 'none' | 'friends' | 'pending_sent' | 'pending_received'
    ) => void;
    setHasPromptedForPermission: (prompted: boolean) => void;
    resetState: () => void;
    createOffer: (partnerId: string) => Promise<void>;
    closePeerConnection: () => void;
    clearMessages: () => void;
    sendMessage: (text: string) => void;
    trackSessionStart: (partnerId: string, mode: 'voice') => void;
    trackSessionEnd: (reason: 'user-action' | 'partner-disconnect' | 'error' | 'skip' | 'network' | 'answered-another') => void;
    selectedCountry: string;
    toggleLocalMute: () => void;
    initMediaManager: () => Promise<boolean>;
    cleanupMedia: () => void;
    roomActionsState: UseRoomActionsStateReturn;
}

export const useRoomActionsCallbacks = ({
    mode,
    callRoomState,
    setSearching,
    setConnected,
    setPartner,
    setHasPromptedForPermission,
    resetState,
    createOffer,
    closePeerConnection,
    clearMessages,
    sendMessage,
    trackSessionStart,
    trackSessionEnd,
    selectedCountry,
    toggleLocalMute,
    initMediaManager,
    cleanupMedia,
    roomActionsState,
}: UseRoomActionsCallbacksProps) => {
    const { user } = useUser();
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

    const partnerIdRef = { current: callRoomState.partner_id };

    const handleStop = useCallback(() => {
        if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        stopSearchRef.current();
        endCallRef.current(callRoomState.partner_id);
        cleanupMedia();
        closePeerConnection();
        resetState();
        clearMessages();
        setPartnerIsMuted(false);
    }, [cleanupMedia, closePeerConnection, resetState, clearMessages, setPartnerIsMuted, callRoomState.partner_id, stopSearchRef, endCallRef, nextTimeoutRef, reconnectTimeoutRef]);

    const findMatch = useCallback(async (forceSkip: boolean = false) => {
        if (callRoomState.partner_id && !forceSkip) return;

        if (callRoomState.permission_denied) {
            console.warn('[RoomActions] Media permission previously denied, aborting search.');
            return;
        }

        if (!callRoomState.has_prompted_for_permission) {
            console.log('[RoomActions] First time finding match, setting permission flag.');
            setHasPromptedForPermission(true);
        }

        // The user wants mic active during the search so there's no spin-up delay
        const success = await initMediaManager();
        if (!success) {
            console.warn('[RoomActions] Media initialization failed, aborting search.');
            return;
        }

        manualStopRef.current = false;
        resetState();
        clearMessages();
        setPartnerIsMuted(false);
        closePeerConnection();
        setSearching(true);
        startSearchRef.current({ preferred_country: selectedCountry === 'GLOBAL' ? undefined : selectedCountry });
    }, [callRoomState.partner_id, callRoomState.permission_denied, resetState, clearMessages, closePeerConnection, setSearching, selectedCountry, setPartnerIsMuted, manualStopRef, startSearchRef]);

    const handleNext = useCallback(() => {
        manualStopRef.current = true;

        trackSessionEnd('skip');
        if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
        if (callRoomState.partner_id) {
            endCallRef.current(callRoomState.partner_id);
        }

        if (roomActionsState.isDirectCall) {
            roomActionsState.setIsDirectCall(false);
        }
        findMatch(true);
    }, [findMatch, trackSessionEnd, manualStopRef, nextTimeoutRef, callRoomState.partner_id, endCallRef, roomActionsState]);

    const handleUserStop = useCallback(() => {
        manualStopRef.current = true;

        trackSessionEnd('user-action');
        handleStop();
    }, [handleStop, trackSessionEnd, manualStopRef]);

    const handleSendMessage = useCallback((text: string, setInputText: (t: string) => void) => {
        if (text.trim()) { sendMessage(text); setInputText(''); }
    }, [sendMessage]);

    const handleToggleMute = useCallback(() => {
        const newMuted = !callRoomState.is_muted;
        toggleLocalMute();
        if (callRoomState.is_connected && callRoomState.partner_id) emitToggleMute(callRoomState.partner_id, newMuted);
        emitUpdateMediaState(newMuted);
    }, [callRoomState.is_muted, callRoomState.is_connected, callRoomState.partner_id, toggleLocalMute]);

    const onMatchFound = useCallback(async (data: MatchFoundPayload) => {
        setSearching(false);
        setConnected(true);
        setPartner(
            data.partner_id,
            data.partner_country_name,
            data.partner_country,
            data.partner_username,
            data.partner_avatar,
            data.partner_gender,
            data.partner_user_id,
            data.friendship_status
        );
        setPartnerIsMuted(!!data.partner_is_muted);

        trackSessionStart(data.partner_id, mode);

        console.log('[RoomActions] Match found. Powering up mic.');
        await initMediaManager();

        if (mode === 'voice' && data.role === 'offerer') await createOffer(data.partner_id);
    }, [mode, createOffer, setSearching, setConnected, setPartner, setPartnerIsMuted, trackSessionStart, initMediaManager]);

    const onCallEnded = useCallback(() => {
        if (manualStopRef.current) { manualStopRef.current = false; return; }

        console.log('[RoomActions] CALL_ENDED received. Partner:', callRoomState.partner_id);

        // Even if partner_id is not yet set in state (race condition), we should cleanup if we are connected or searching
        if (!callRoomState.partner_id && !callRoomState.is_connected && !callRoomState.is_searching) return;

        trackSessionEnd('partner-disconnect');

        // Cleanup UI without triggering /leave or an END_CALL ping-pong
        if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
        cleanupMedia();
        closePeerConnection();
        resetState();
        clearMessages();
        setPartnerIsMuted(false);

        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);


        if (roomActionsState.isDirectCall) {
            console.log('[RoomActions] Direct call ended by partner, stopping.');
            roomActionsState.setIsDirectCall(false);
            return;
        }

        setSearching(true);
        reconnectTimeoutRef.current = setTimeout(() => findMatch(true), 300);
    }, [manualStopRef, callRoomState.partner_id, callRoomState.is_connected, callRoomState.is_searching, trackSessionEnd, nextTimeoutRef, cleanupMedia, closePeerConnection, resetState, clearMessages, setPartnerIsMuted, reconnectTimeoutRef, setSearching, findMatch, roomActionsState]);

    const onMatchCancelled = useCallback((data: { reason: string }) => {
        if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        cleanupMedia();
        closePeerConnection();
        resetState();
        clearMessages();
        setPartnerIsMuted(false);

        setSearching(true);
        setTimeout(() => findMatch(), 1000);
    }, [nextTimeoutRef, reconnectTimeoutRef, cleanupMedia, closePeerConnection, resetState, clearMessages, setPartnerIsMuted, setSearching, findMatch]);

    const onPartnerReconnected = useCallback(async (data: { new_socket_id: string; new_user_id?: string; your_role?: 'offerer' | 'answerer' }) => {
        console.log('[RoomActions] Partner reconnected with new socket:', data.new_socket_id);

        // Ensure UI transitions to connected state (in dual-refresh, this may be the only event)
        closePeerConnection();
        setSearching(false);
        setConnected(true);

        setPartner(
            data.new_socket_id,
            callRoomState.partner_country_name,
            callRoomState.partner_country,
            callRoomState.partner_username,
            callRoomState.partner_avatar,
            callRoomState.partner_gender,
            callRoomState.partner_user_id,
            callRoomState.friendship_status
        );

        // Use assigned role from server
        if (data.your_role === 'offerer') {
            console.log('[RoomActions] I am the assigned offerer for this reconnection.');
            await initMediaManager();
            await createOffer(data.new_socket_id);
        } else {
            console.log('[RoomActions] I am the assigned answerer for this reconnection.');
        }
    }, [closePeerConnection, setSearching, setConnected, setPartner, callRoomState.partner_country_name, callRoomState.partner_country, callRoomState.partner_username, callRoomState.partner_avatar, callRoomState.partner_gender, callRoomState.partner_user_id, callRoomState.friendship_status, initMediaManager, createOffer]);

    const onRejoinSuccess = useCallback(async (data: any) => {
        closePeerConnection();
        setSearching(false);
        setConnected(true);
        setPartner(
            data.partner_id,
            data.partner_country_name || callRoomState.partner_country_name,
            data.partner_country || callRoomState.partner_country,
            data.partner_username || callRoomState.partner_username,
            data.partner_avatar || callRoomState.partner_avatar,
            data.partner_gender || callRoomState.partner_gender,
            data.partner_user_id || callRoomState.partner_user_id,
            data.friendship_status || callRoomState.friendship_status
        );

        console.log('[RoomActions] Rejoin success. Powering up mic.');
        await initMediaManager();

        // Use assigned role from server
        if (data.role === 'offerer') {
            console.log('[RoomActions] I am the assigned offerer for this rejoined session.');
            if (mode === 'voice') pendingRejoinPartnerRef.current = data.partner_id;
        } else {
            console.log('[RoomActions] I am the assigned answerer for this rejoined session. Waiting for offer...');
            pendingRejoinPartnerRef.current = null;
        }
    }, [setSearching, setConnected, setPartner, closePeerConnection, mode, pendingRejoinPartnerRef, callRoomState.partner_country_name, callRoomState.partner_country, callRoomState.partner_username, callRoomState.partner_avatar, callRoomState.partner_gender, callRoomState.partner_user_id, initMediaManager]);

    const onRejoinFailed = useCallback((data: { reason: string }) => {
        resetState();

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
