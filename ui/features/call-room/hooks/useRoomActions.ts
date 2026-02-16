import { useState, useRef, useCallback, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useMatching } from './useMatching';
import { CallRoomState } from './useCallRoom';

interface UseRoomActionsProps {
    socket: Socket | null;
    mode: 'voice';
    callRoomState: CallRoomState;
    setSearching: (searching: boolean) => void;
    setConnected: (connected: boolean) => void;
    setPartner: (id: string | null, country?: string, countryCode?: string, username?: string, avatar?: string) => void;
    resetState: () => void;
    createOffer: (partnerId: string) => Promise<void>;
    closePeerConnection: () => void;
    clearMessages: () => void;
    sendMessage: (text: string) => void;
    trackSessionStart: (partnerId: string, mode: 'voice') => void;
    trackSessionEnd: (reason: "user-action" | "partner-disconnect" | "error" | "skip" | "network" | "answered-another") => void;
    selectedCountry: string;
    toggleLocalMute: () => void;
}

export const useRoomActions = ({
    socket,
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
}: UseRoomActionsProps) => {
    // UI State managed here related to actions
    const [partnerIsMuted, setPartnerIsMuted] = useState(false);

    // Refs
    const partnerIdRef = useRef(callRoomState.partnerId);
    const startSearchRef = useRef<(preferredCountry?: string) => void>(() => { });
    const stopSearchRef = useRef<() => void>(() => { });
    const endCallRef = useRef<(id: string | null) => void>(() => { });
    const manualStopRef = useRef(false);
    const pendingRejoinPartnerRef = useRef<string | null>(null);
    const nextTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sync ref
    useEffect(() => {
        partnerIdRef.current = callRoomState.partnerId;
    }, [callRoomState.partnerId]);

    // --- Action Callbacks ---

    const handleStop = useCallback(() => {
        console.log('[Room] Stopping search or ending call');

        if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

        stopSearchRef.current();
        endCallRef.current(partnerIdRef.current);
        closePeerConnection();
        partnerIdRef.current = null;
        resetState();
        clearMessages();
        setPartnerIsMuted(false);
    }, [closePeerConnection, resetState, clearMessages]);

    const findMatch = useCallback((forceSkip: boolean = false) => {
        if (partnerIdRef.current && !forceSkip) {
            console.log('[Room] Already in a call, skipping redundant findMatch');
            return;
        }

        console.log('[Room] Initiating new match search (Force Skip:', forceSkip, ')');
        manualStopRef.current = false;
        resetState();
        clearMessages();
        setPartnerIsMuted(false);
        closePeerConnection();
        setSearching(true);
        startSearchRef.current(selectedCountry === 'GLOBAL' ? undefined : selectedCountry);
    }, [resetState, clearMessages, closePeerConnection, setSearching, selectedCountry]);

    const handleNext = useCallback(() => {
        console.log('[Room] Skipping to next partner (Atomic Skip)');
        // Ensure we don't treat the partner-disconnect as an auto-reconnect event
        manualStopRef.current = true;

        try { localStorage.removeItem('nz_active_call'); } catch { }

        trackSessionEnd('skip');

        if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);

        findMatch(true);

    }, [findMatch, trackSessionEnd]);

    const handleUserStop = useCallback(() => {
        console.log('[Room] User manually stopped');
        manualStopRef.current = true;
        try { localStorage.removeItem('nz_active_call'); } catch { }
        trackSessionEnd('user-action');
        handleStop();
    }, [handleStop, trackSessionEnd]);

    const handleSendMessage = useCallback((text: string, setInputText: (t: string) => void) => {
        if (text.trim()) {
            sendMessage(text);
            setInputText('');
        }
    }, [sendMessage]);

    const handleToggleMute = useCallback(() => {
        const newMuted = !callRoomState.isMuted;
        toggleLocalMute();
        setPartnerIsMuted(prev => prev); // re-render hack? No, actually just emit
        if (socket) {
            if (callRoomState.isConnected && callRoomState.partnerId) {
                socket.emit('toggle-mute', { target: callRoomState.partnerId, isMuted: newMuted });
            }
            socket.emit('update-media-state', { isMuted: newMuted });
        }
    }, [callRoomState.isMuted, callRoomState.isConnected, callRoomState.partnerId, toggleLocalMute, socket]);

    // --- Matching Callbacks ---

    const onMatchFound = useCallback(async (data: any) => {
        console.log('[Room] Match found:', data);
        setSearching(false);
        setConnected(true);
        setPartner(data.partnerId, data.partnerCountry, data.partnerCountryCode, data.partnerUsername, data.partnerAvatar);
        setPartnerIsMuted(!!data.partnerIsMuted);

        try {
            localStorage.setItem('nz_active_call', JSON.stringify({
                roomId: data.roomId,
                peerId: data.partnerId,
                startedAt: Date.now(),
                partnerProfile: {
                    id: data.partnerId,
                    username: data.partnerUsername,
                    displayName: data.partnerUsername,
                    avatar: data.partnerAvatar,
                    country: data.partnerCountry || 'unknown',
                    city: null,
                    timezone: null,
                },
            }));
        } catch { }

        trackSessionStart(data.partnerId, mode);

        if (mode === 'voice' && data.role === 'offerer') {
            await createOffer(data.partnerId);
        }
    }, [mode, createOffer, setSearching, setConnected, setPartner, trackSessionStart]);

    const onCallEnded = useCallback(() => {
        if (manualStopRef.current) {
            console.log('[Room] Call ended manually, suppressing auto-reconnect');
            manualStopRef.current = false;
            return;
        }

        console.log('[Room] Call ended by partner or system');
        trackSessionEnd('partner-disconnect');
        handleStop();

        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        try { localStorage.removeItem('nz_active_call'); } catch { }

        setSearching(true);
        reconnectTimeoutRef.current = setTimeout(() => {
            findMatch();
        }, 300);
    }, [handleStop, findMatch, trackSessionEnd, setSearching]);

    const onMatchCancelled = useCallback((data: { reason: string }) => {
        console.warn(`[Room] Match cancelled: ${data.reason}. Re-searching...`);
        handleStop();
        setSearching(true);
        setTimeout(() => {
            console.log('[Room] Attempting auto-reconnect after cancellation');
            findMatch();
        }, 1000);
    }, [handleStop, findMatch, setSearching]);

    const onPartnerReconnected = useCallback(async (data: { newSocketId: string }) => {
        console.log('[Room] Partner reconnected with new socket:', data.newSocketId);
        partnerIdRef.current = data.newSocketId;
        setPartner(data.newSocketId, callRoomState.partnerCountry || '', callRoomState.partnerCountryCode || '', callRoomState.partnerUsername || '', callRoomState.partnerAvatar || '');
        closePeerConnection();
    }, [closePeerConnection, setPartner, callRoomState.partnerCountry, callRoomState.partnerCountryCode, callRoomState.partnerUsername, callRoomState.partnerAvatar]);

    const onRejoinSuccess = useCallback(async (data: any) => {
        console.log('[Room] Rejoin success, restoring call state:', data);
        setSearching(false);
        setConnected(true);

        const partnerId = data.partnerId;
        partnerIdRef.current = partnerId;
        setPartner(
            partnerId,
            data.partnerCountry || callRoomState.partnerCountry || '',
            data.partnerCountryCode || callRoomState.partnerCountryCode || '',
            callRoomState.partnerUsername || '',
            callRoomState.partnerAvatar || '',
        );

        closePeerConnection();

        if (mode === 'voice') {
            pendingRejoinPartnerRef.current = partnerId;
        }
    }, [setSearching, setConnected, setPartner, closePeerConnection, mode, callRoomState.partnerCountry, callRoomState.partnerCountryCode, callRoomState.partnerUsername, callRoomState.partnerAvatar]);

    const onRejoinFailed = useCallback((data: { reason: string }) => {
        console.warn('[Room] Rejoin failed:', data.reason);
        resetState();
        try { localStorage.removeItem('nz_active_call'); } catch { }
    }, [resetState]);

    // Use Matching Hook
    const matching = useMatching({
        socket,
        onMatchFound,
        onMatchCancelled,
        onCallEnded,
        onPartnerReconnected,
        onRejoinSuccess,
        onRejoinFailed,
    });

    // Update refs with matching functions
    useEffect(() => {
        startSearchRef.current = matching.startSearch;
        stopSearchRef.current = matching.stopSearch;
        endCallRef.current = matching.endCall;
    }, [matching]);

    return {
        handleStop,
        findMatch,
        handleNext,
        handleUserStop,
        handleSendMessage,
        handleToggleMute,
        partnerIsMuted,
        setPartnerIsMuted,
        matching,
        pendingRejoinPartnerRef,
        onMatchFound,
    };
};
