'use client';

import { useRef, useState, useCallback } from 'react';
import { socket as getSocket } from '../../../lib/socket';
import { useRoomActions } from '../hooks/useRoomActions';
import { useRoomEffects } from '../hooks/useRoomEffects';
import { useWebRTC } from '../hooks/useWebRTC';
import { useCallRoom } from '../hooks/useCallRoom';
import { useChat } from '../hooks/useChat';
import { useReconnect } from '../hooks/useReconnect';
import { useHistory, useUser } from '../../../hooks';
import { Socket } from 'socket.io-client';
import { MobileRoomLayout } from './MobileRoomLayout';
import { DesktopRoomLayout } from './DesktopRoomLayout';
import { DevicePermissionOverlay } from './DevicePermissionOverlay';
import { FilterDrawer } from './FilterDrawer';

interface RoomProps {
    mode: 'voice';
    onLeave: () => void;
    onNavigateToHistory: () => void;
    onConnectionChange: (connected: boolean) => void;
    initialMatchData?: any;
}

export default function Room({ mode, onLeave, onNavigateToHistory, onConnectionChange, initialMatchData }: RoomProps) {
    // 1. Core State & Framework Hooks
    const socket = getSocket() as Socket | null;
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
        resetState,
    } = useCallRoom(mode);

    // 2. Extra UI State (Purely Visual)
    const [showChat, setShowChat] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [inputText, setInputText] = useState("");
    const [mobileLayout, setMobileLayout] = useState<'overlay' | 'split'>('overlay');
    const [selectedCountry, setSelectedCountry] = useState('GLOBAL');

    const remoteAudioRef = useRef<HTMLAudioElement>(null);

    // 3. Actions Ref (for breaking cyclic dependencies with WebRTC)
    const actionsRef = useRef<ReturnType<typeof useRoomActions> | null>(null);

    // 4. WebRTC Hook
    const {
        createOffer,
        closePeerConnection
    } = useWebRTC({
        socket,
        mediaManager: mediaManager.current,
        remoteAudioRef,
        onConnectionStateChange: (state) => {
            if (state === 'failed') {
                actionsRef.current?.handleStop();
            }
        },
        onSignalQuality: (quality) => {
            if (socket && callRoomState.partnerId) {
                socket.emit('signal-strength', {
                    target: callRoomState.partnerId,
                    strength: quality
                });
            }
        }
    });

    // 5. Chat & History Hooks
    const {
        messages,
        messagesEndRef,
        sendMessage,
        clearMessages,
    } = useChat(socket, callRoomState.partnerId);

    const { token } = useUser();
    const { trackSessionStart, trackSessionEnd } = useHistory(socket, token);

    // 6. Room Actions Hook (The Controller)
    const actions = useRoomActions({
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
    });

    // Update ref for WebRTC callback access
    actionsRef.current = actions;

    // 7. Room Effects Hook (Side Effects)
    useRoomEffects({
        socket,
        mode,
        callRoomState,
        partnerIsMuted: actions.partnerIsMuted, // Just for logging? actually useRoomEffects doesn't use it, but MobileRoomLayout does. 
        // Wait, useRoomEffects takes setPartnerIsMuted for socket listener
        setPartnerIsMuted: actions.setPartnerIsMuted,
        setPartnerSignalStrength,
        initMediaManager,
        cleanupMedia,
        onConnectionChange,
        initialMatchData,
        createOffer,
        pendingRejoinPartnerRef: actions.pendingRejoinPartnerRef,
        handleStop: actions.handleStop,
        handleNext: actions.handleNext,
        findMatch: actions.findMatch,
        handleUserStop: actions.handleUserStop,
        onMatchFound: actions.onMatchFound,
    });

    // 8. Reconnect Hook
    const { isReconnecting } = useReconnect({
        socket,
        rejoinCall: actions.matching.rejoinCall,
        onRestorePartner: useCallback((data: any) => {
            if (data.partnerProfile) {
                const pp = data.partnerProfile;
                setPartner(data.peerId, pp.country || '', '', pp.username || '', pp.avatar || '');
            }
        }, [setPartner]),
    });

    // Render Helpers
    const handleSendMessageWrapper = (text: string) => actions.handleSendMessage(text, setInputText);

    return (
        <div className="flex flex-col h-[100dvh] bg-[#111] text-foreground font-sans overflow-hidden select-none relative touch-none">
            <MobileRoomLayout
                callRoomState={callRoomState}
                partnerIsMuted={actions.partnerIsMuted}
                showChat={showChat}
                messages={messages}
                inputText={inputText}
                remoteAudioRef={remoteAudioRef}
                messagesEndRef={messagesEndRef}
                onStop={actions.handleUserStop}
                onNext={actions.handleNext}
                onToggleMute={actions.handleToggleMute}
                onSendMessage={handleSendMessageWrapper}
                setShowChat={setShowChat}
                setInputText={setInputText}
                mobileLayout={mobileLayout}
                setMobileLayout={setMobileLayout}
                filtersOpen={filtersOpen}
                setFiltersOpen={setFiltersOpen}
                onNavigateToHistory={onNavigateToHistory}
                selectedCountry={selectedCountry}
                onSelectCountry={setSelectedCountry}
                matchmakingStatus={actions.matching.status}
                queuePosition={actions.matching.position}
                isReconnecting={isReconnecting || actions.matching.status === 'RECONNECTING'}
                reconnectCountdown={actions.matching.reconnectCountdown}
            />
            <DesktopRoomLayout
                callRoomState={callRoomState}
                partnerIsMuted={actions.partnerIsMuted}
                showChat={showChat}
                messages={messages}
                inputText={inputText}
                remoteAudioRef={remoteAudioRef}
                messagesEndRef={messagesEndRef}
                onStop={actions.handleUserStop}
                onNext={actions.handleNext}
                onToggleMute={actions.handleToggleMute}
                onSendMessage={handleSendMessageWrapper}
                setShowChat={setShowChat}
                setInputText={setInputText}
                filtersOpen={filtersOpen}
                setFiltersOpen={setFiltersOpen}
                onNavigateToHistory={onNavigateToHistory}
                selectedCountry={selectedCountry}
                onSelectCountry={setSelectedCountry}
                matchmakingStatus={actions.matching.status}
                queuePosition={actions.matching.position}
                isReconnecting={isReconnecting || actions.matching.status === 'RECONNECTING'}
                reconnectCountdown={actions.matching.reconnectCountdown}
            />
            {callRoomState.permissionDenied && (
                <DevicePermissionOverlay onRetry={initMediaManager} />
            )}
            <FilterDrawer
                isOpen={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                onSelectCountry={setSelectedCountry}
                currentCountry={selectedCountry}
            />
        </div>
    );
}
