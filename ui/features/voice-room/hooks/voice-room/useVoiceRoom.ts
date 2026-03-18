'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { emitSignalStrength, emitRejoinReady } from '@/lib/socket/matching/matching.actions';
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
    const [localWebRTCConnected, setLocalWebRTCConnected] = useState(false);

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
        setPartnerReady,
        updatePartnerProfile,
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
        onConnectionStateChange: useCallback((state: RTCPeerConnectionState) => {
            const currentStatus = actionsRef.current?.matching.status;
            const isCallActive = currentStatus === 'MATCHED' || currentStatus === 'RECONNECTING';

            if (state === 'connected') {
                setLocalWebRTCConnected(true);
                setPartnerSignalStrength('good');
                
                // Tell the partner we are ready on our end
                const latestPartnerId = actionsRef.current?.callRoomState.partner_id;
                if (latestPartnerId) {
                    emitRejoinReady(latestPartnerId);
                }
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
        }, [setLocalWebRTCConnected, setPartnerSignalStrength]), // actionsRef is stable
        onSignalQuality: useCallback((quality: 'good' | 'fair' | 'poor' | 'reconnecting') => {
            setPartnerSignalStrength(quality);
            const partner_id = actionsRef.current?.callRoomState.partner_id;
            if (partner_id) emitSignalStrength(partner_id, quality);
        }, [setPartnerSignalStrength]),
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
        setPartnerReady,
        isDirectCall: !!initialMatchData,
    });
    actionsRef.current = baseActions;

    // 8. Room Lifecycle Effects
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
        setPartnerReady,
        updatePartnerProfile,
    });

    // 9. Reconnection Logic
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

    // 10. Synchronization Gate (Finalize Connection)
    // This effect ensures that the "Reconnecting" UI only clears when the 
    // local WebRTC is connected. We NO LONGER wait for a partner "ready" 
    // signal or use timeouts, as audio connectivity is the ultimate source of truth.
    useEffect(() => {
        if (!localWebRTCConnected) return;

        setConnected(true);
        setSearching(false);
        setPartnerSignalStrength('good');
        
        // Force status to MATCHED to ensure UI clears even if socket events were missed
        actionsRef.current?.matching.setStatus('MATCHED');
        
        clearReconnectState?.();

        // Reset sync flags for future status changes or new matches
        setLocalWebRTCConnected(false);
        setPartnerReady(false);
    }, [localWebRTCConnected, setConnected, setSearching, clearReconnectState, setPartnerReady, setPartnerSignalStrength]);

    // 10. Call Statistics/Duration
    const callDuration = useCallDuration(callRoomState.is_connected);

    // 11. Coordination Actions
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
