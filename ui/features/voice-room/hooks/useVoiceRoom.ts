'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { emitSignalStrength } from '@/lib/socket/matching/matching.actions';
import { useRoomActions, useWebRTC, useCallRoom, useChat, useUser } from '@/hooks';
import { useRoomEffects } from '@/features/voice-room/hooks/room-effects/useRoomEffects';
import { useReconnect } from '@/features/voice-room/hooks/reconnect/useReconnect';
import { useCallDuration } from '@/features/voice-room/hooks/duration/useCallDuration';

interface UseVoiceRoomProps {
    mode?: 'voice';
    onConnectionChange?: (connected: boolean) => void;
    initialMatchData?: any;
    initialReconnecting?: boolean;
    initialCallData?: any;
}

export const useVoiceRoom = ({
    mode = 'voice',
    onConnectionChange,
    initialMatchData,
    initialReconnecting,
    initialCallData
}: UseVoiceRoomProps = {}) => {
    // 1. Core State
    const {
        state: callRoomState,
        mediaManager,
        initMediaManager,
        cleanupMedia,
        toggleMute: toggleLocalMute,
        setSearching,
        setConnected,
        setPartner,
        setPartnerSignalStrength,
        setPermissionDenied,
        setHasPromptedForPermission,
        resetState,
    } = useCallRoom(mode);

    const [selectedCountry, setSelectedCountry] = useState('GLOBAL');
    const remoteAudioRef = useRef<HTMLAudioElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Native Permission Check
    useEffect(() => {
        if (!navigator.permissions) return;
        navigator.permissions.query({ name: 'microphone' as PermissionName })
            .then((permissionStatus) => {
                setPermissionDenied(permissionStatus.state === 'denied');
                permissionStatus.onchange = () => {
                    setPermissionDenied(permissionStatus.state === 'denied');
                };
            })
            .catch(err => console.warn('[useVoiceRoom] Failed to query native mic permission:', err));
    }, [setPermissionDenied]);

    // Actions Ref
    const actionsRef = useRef<ReturnType<typeof useRoomActions> | null>(null);

    // WebRTC Hook
    const { createOffer, closePeerConnection } = useWebRTC({
        is_media_ready: callRoomState.is_media_ready,
        mediaManager,
        remoteAudioRef,
        onConnectionStateChange: (state) => {
            if (state === 'failed') actionsRef.current?.handleStop();
        },
        onSignalQuality: (quality) => {
            const partner_id = callRoomState.partner_id;
            if (partner_id) emitSignalStrength(partner_id, quality);
        },
    });

    // Chat
    const { messages, sendMessage, clearMessages } = useChat(callRoomState.partner_id);

    // Actions
    const actions = useRoomActions({
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
        trackSessionStart: async () => { },
        trackSessionEnd: async () => { },
        selectedCountry,
        toggleLocalMute,
        initMediaManager,
        cleanupMedia,
        setHasPromptedForPermission,
        isDirectCall: !!initialMatchData,
    });
    actionsRef.current = actions;

    // Room Effects
    useRoomEffects({
        mode,
        callRoomState,
        setPartnerIsMuted: actions.setPartnerIsMuted,
        setPartnerSignalStrength,
        initMediaManager,
        cleanupMedia,
        onConnectionChange: onConnectionChange || (() => { }),
        initialMatchData,
        createOffer,
        handleStop: actions.handleStop,
        handleNext: actions.handleNext,
        findMatch: actions.findMatch,
        handleUserStop: actions.handleUserStop,
        onMatchFound: actions.onMatchFound,
    });

    // Reconnect
    const { isReconnecting, clearReconnectState } = useReconnect({
        rejoinCall: actions.matching.rejoinCall,
        onRestorePartner: useCallback((data: any) => {
            if (data.partnerProfile) {
                const pp = data.partnerProfile;
                setPartner(
                    data.peerId,
                    pp.country_name || '',
                    pp.country || '',
                    pp.username || '',
                    pp.avatar || '',
                    pp.gender || '',
                    pp.id || pp.user_id || null,
                    pp.friendship_status || 'none'
                );
            }
        }, [setPartner]),
        initialReconnecting,
        initialCallData,
    });

    const callDuration = useCallDuration(callRoomState.is_connected);

    const handleNext = useCallback(() => {
        clearReconnectState();
        actions.handleNext();
    }, [clearReconnectState, actions]);

    const handleStop = useCallback(() => {
        clearReconnectState();
        actions.handleStop();
    }, [clearReconnectState, actions]);

    const handleUserStop = useCallback(() => {
        clearReconnectState();
        actions.handleUserStop();
    }, [clearReconnectState, actions]);

    return {
        callRoomState,
        messages,
        messagesEndRef,
        remoteAudioRef,
        actions,
        handleNext,
        handleStop,
        handleUserStop,
        isReconnecting,
        callDuration,
        selectedCountry,
        setSelectedCountry,
    };
};
