'use client';

import { useRef, useState, useCallback } from 'react';
import { getSocketClient } from '../../../lib/socket/socketClient';
import { emitSignalStrength } from '../../../lib/socket/matching/matching.actions';
import { useRoomActions } from '@/hooks';
import { useRoomEffects } from '../hooks/useRoomEffects';
import { useWebRTC } from '@/hooks';
import { useCallRoom } from '@/hooks';
import { useChat } from '@/hooks';
import { useReconnect } from '../hooks/useReconnect';
import { useHistory, useUser } from '../../../hooks';
import { MobileRoomLayout } from './MobileRoomLayout';
import { DesktopRoomLayout } from './DesktopRoomLayout';
import { DevicePermissionOverlay } from './DevicePermissionOverlay';
import { FilterDrawer } from './FilterDrawer';

interface RoomProps {
    mode: 'voice';
    onLeave: () => void;
    onNavigateToHistory: () => void;
    onNavigateToFriends: () => void;
    onConnectionChange: (connected: boolean) => void;
    initialMatchData?: any;
    onAddFriend: (targetId: string) => void;
    friends: any[];
    pendingRequests: any[];
}

export default function Room({
    mode,
    onLeave,
    onNavigateToHistory,
    onNavigateToFriends,
    onConnectionChange,
    initialMatchData,
    onAddFriend,
    friends,
    pendingRequests
}: RoomProps) {
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
        resetState,
    } = useCallRoom(mode);

    // 2. Extra UI State
    const [showChat, setShowChat] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [inputText, setInputText] = useState('');
    const [mobileLayout, setMobileLayout] = useState<'overlay' | 'split'>('overlay');
    const [selectedCountry, setSelectedCountry] = useState('GLOBAL');

    const remoteAudioRef = useRef<HTMLAudioElement>(null);

    // 3. Actions Ref (break cyclic dep with WebRTC)
    const actionsRef = useRef<ReturnType<typeof useRoomActions> | null>(null);

    // 4. WebRTC Hook — no socket prop
    const { createOffer, closePeerConnection } = useWebRTC({
        mediaManager: mediaManager.current,
        remoteAudioRef,
        onConnectionStateChange: (state) => {
            if (state === 'failed') actionsRef.current?.handleStop();
        },
        onSignalQuality: (quality) => {
            const partnerId = callRoomState.partnerId;
            if (partnerId) emitSignalStrength(partnerId, quality);
        },
    });

    // 5. Chat & History — no socket prop
    const { messages, messagesEndRef, sendMessage, clearMessages } = useChat(callRoomState.partnerId);
    const { token } = useUser();
    const { trackSessionStart, trackSessionEnd } = useHistory(token);

    // 6. Room Actions — no socket prop
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
        trackSessionStart,
        trackSessionEnd,
        selectedCountry,
        toggleLocalMute,
    });

    actionsRef.current = actions;

    // 7. Room Effects — no socket prop
    useRoomEffects({
        mode,
        callRoomState,
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

    // 8. Reconnect Hook — no socket prop
    const { isReconnecting } = useReconnect({
        rejoinCall: actions.matching.rejoinCall,
        onRestorePartner: useCallback((data: any) => {
            if (data.partnerProfile) {
                const pp = data.partnerProfile;
                setPartner(data.peerId, pp.country || '', '', pp.username || '', pp.avatar || '');
            }
        }, [setPartner]),
    });

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
                onNavigateToFriends={onNavigateToFriends}
                onAddFriend={onAddFriend}
                friends={friends}
                pendingRequests={pendingRequests}
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
                onNavigateToFriends={onNavigateToFriends}
                onAddFriend={onAddFriend}
                friends={friends}
                pendingRequests={pendingRequests}
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
