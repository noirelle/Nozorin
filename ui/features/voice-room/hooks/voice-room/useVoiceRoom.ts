'use client';

import { useRef, useCallback, useEffect } from 'react';
import { emitSignalStrength } from '@/lib/socket/matching/matching.actions';
import { useRoomActions, useWebRTC, useCallRoom, useChat } from '@/hooks';
import { useRoomEffects } from '@/features/voice-room/hooks/room-effects/useRoomEffects';
import { useReconnect } from '@/features/voice-room/hooks/reconnect/useReconnect';
import { useCallDuration } from '@/features/voice-room/hooks/duration/useCallDuration';

import { useVoiceRoomState } from './useVoiceRoomState';
import { useVoiceRoomActions } from './useVoiceRoomActions';
import { useVoiceRoomEffects } from './useVoiceRoomEffects';

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
    // 1. Hook State
    const { selectedCountry, setSelectedCountry, remoteAudioRef } = useVoiceRoomState();

    // 2. Core Service State
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

    // 3. Coordination Ref
    const actionsRef = useRef<ReturnType<typeof useRoomActions> | null>(null);

    // 4. Hook Effects
    useVoiceRoomEffects({ setPermissionDenied });

    // 5. WebRTC Services
    const { createOffer, closePeerConnection, iceDebugData } = useWebRTC({

        is_media_ready: callRoomState.is_media_ready,
        role: callRoomState.role,
        mediaManager,
        remoteAudioRef,
        onConnectionStateChange: (state) => {
            const currentStatus = actionsRef.current?.matching.status;
            const isCallActive = currentStatus === 'MATCHED' || currentStatus === 'RECONNECTING';

            if (state === 'connected') {
                setConnected(true);
                setSearching(false);
                setPartnerSignalStrength('good');
            }
            else if (state === 'disconnected') {
                if (isCallActive) setPartnerSignalStrength('reconnecting');
            }
            else if (state === 'failed') {
                if (isCallActive) {
                    setPartnerSignalStrength('reconnecting');
                    setTimeout(() => {
                        if (actionsRef.current?.callRoomState.partner_id) {
                            // Potential recovery logic
                        } else {
                            actionsRef.current?.handleStop();
                        }
                    }, 5000);
                }
            }
        },
        onSignalQuality: (quality) => {
            setPartnerSignalStrength(quality);
            const partner_id = callRoomState.partner_id;
            if (partner_id) emitSignalStrength(partner_id, quality);
        },
    });

    // 6. Chat Services
    const { messages, sendMessage, clearMessages, messagesEndRef } = useChat(callRoomState.partner_id);

    // 7. Base Room Actions
    const baseActions = useRoomActions({
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
        setPartnerSignalStrength,
    });
    actionsRef.current = baseActions;

    // 8. Reconnection Logic
    const { isReconnecting, clearReconnectState } = useReconnect({
        rejoinCall: baseActions.matching.rejoinCall,
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

    // 9. Sync matching status with reconnect state to ensure UI clears correctly
    useEffect(() => {
        if (baseActions.matching.status === 'MATCHED') {
            clearReconnectState();
        }
    }, [baseActions.matching.status, clearReconnectState]);

    // 10. Room Lifecycle Effects
    useRoomEffects({
        mode,
        callRoomState,
        setPartnerIsMuted: baseActions.setPartnerIsMuted,
        setPartnerSignalStrength,
        initMediaManager,
        cleanupMedia,
        onConnectionChange: onConnectionChange || (() => { }),
        initialMatchData,
        createOffer,
        handleStop: baseActions.handleStop,
        handleNext: baseActions.handleNext,
        findMatch: baseActions.findMatch,
        handleUserStop: baseActions.handleUserStop,
        onMatchFound: baseActions.onMatchFound,
    });

    // 11. Call Statistics/Duration
    const callDuration = useCallDuration(callRoomState.is_connected);

    // 12. Coordination Actions
    const { handleNext, handleStop, handleUserStop } = useVoiceRoomActions({
        actions: baseActions,
        clearReconnectState,
    });

    return {
        callRoomState,
        messages,
        messagesEndRef,
        remoteAudioRef,
        actions: baseActions,
        handleNext,
        handleStop,
        handleUserStop,
        isReconnecting,
        callDuration,
        selectedCountry,
        setSelectedCountry,
        iceDebugData,
        initMediaManager,
        cleanupMedia,
    };
};
