'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { socket as getSocket } from '../../../lib/socket';
import { useMatching } from '../hooks/useMatching';
import { useWebRTC } from '../hooks/useWebRTC';
import { useCallRoom } from '../hooks/useCallRoom';
import { useChat } from '../hooks/useChat';
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

    // Notify parent about connection state changes
    useEffect(() => {
        onConnectionChange(callRoomState.isConnected);
    }, [callRoomState.isConnected, onConnectionChange]);

    // History tracking
    // History tracking
    const { token } = useUser();
    const { trackSessionStart, trackSessionEnd } = useHistory(socket, token);

    // 2. Extra UI State (not in hooks)
    const [partnerIsMuted, setPartnerIsMuted] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [inputText, setInputText] = useState("");
    const [mobileLayout, setMobileLayout] = useState<'overlay' | 'split'>('overlay');
    const [selectedCountry, setSelectedCountry] = useState('GLOBAL');

    const remoteAudioRef = useRef<HTMLAudioElement>(null);

    // 3. Action Refs (to break circular dependencies between matching hook and its callbacks)
    const startSearchRef = useRef<(preferredCountry?: string) => void>(() => { });
    const stopSearchRef = useRef<() => void>(() => { });
    const endCallRef = useRef<(id: string | null) => void>(() => { });
    const manualStopRef = useRef(false);

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
                handleStop();
            }
            // If disconnected, we don't stop immediately anymore. We wait for reconnection or manual stop.
        },
        onSignalQuality: (quality) => {
            // Send my signal quality to partner
            if (socket && callRoomState.partnerId) {
                socket.emit('signal-strength', {
                    target: callRoomState.partnerId,
                    strength: quality
                });
            }
        }
    });



    // 4. Chat Hook
    const {
        messages,
        messagesEndRef,
        sendMessage,
        clearMessages,
    } = useChat(socket, callRoomState.partnerId);

    const partnerIdRef = useRef(callRoomState.partnerId);

    useEffect(() => {
        partnerIdRef.current = callRoomState.partnerId;
    }, [callRoomState.partnerId]);

    const nextTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 5. Matching Callbacks
    const handleStop = useCallback(() => {
        console.log('[Room] Stopping search or ending call');

        // Clear any pending auto-reconnect or next-partner timeouts
        if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

        stopSearchRef.current();
        endCallRef.current(partnerIdRef.current);
        closePeerConnection();
        // Force-clear ref immediately as well to avoid race conditions with next findMatch
        partnerIdRef.current = null;
        resetState();
        clearMessages();
        setPartnerIsMuted(false);
    }, [closePeerConnection, resetState, clearMessages]);

    const findMatch = useCallback(() => {
        // Prevent multiple simultaneous search requests if already in queue or connected
        // Use ref to avoid stale closure issues during rapid state transitions (like auto-reconnect)
        if (partnerIdRef.current) {
            console.log('[Room] Already in a call, skipping redundant findMatch');
            return;
        }

        console.log('[Room] Initiating new match search');
        manualStopRef.current = false;
        resetState();
        clearMessages();
        setPartnerIsMuted(false);
        closePeerConnection();
        setSearching(true);
        startSearchRef.current(selectedCountry === 'GLOBAL' ? undefined : selectedCountry);
    }, [resetState, clearMessages, closePeerConnection, setSearching, selectedCountry, callRoomState.isSearching, callRoomState.partnerId]);

    const handleNext = useCallback(() => {
        console.log('[Room] Skipping to next partner');
        manualStopRef.current = true;

        // Track session end with skip reason
        trackSessionEnd('skip');
        handleStop();

        // Show "Finding..." immediately during the cooldown
        setSearching(true);

        // Clear previous timeout if exists
        if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);

        // Delay ensures server cleans up before next search
        nextTimeoutRef.current = setTimeout(() => {
            manualStopRef.current = false;
            findMatch();
        }, 500);
    }, [handleStop, findMatch, setSearching, trackSessionEnd]);

    const onMatchFound = useCallback(async (data: any) => {
        console.log('[Room] Match found:', data);
        setSearching(false);
        setConnected(true);
        setPartner(data.partnerId, data.partnerCountry, data.partnerCountryCode, data.partnerUsername, data.partnerAvatar);
        setPartnerIsMuted(!!data.partnerIsMuted);

        // Track session start
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
        // Track session end
        trackSessionEnd('partner-disconnect');
        handleStop();

        // Clear previous timeout if exists
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

        // Omegle-style auto-reconnect
        // Show "Finding..." immediately to prevent the Start button from flickering
        setSearching(true);

        reconnectTimeoutRef.current = setTimeout(() => {
            findMatch();
        }, 300);
    }, [handleStop, findMatch, trackSessionEnd, setSearching]);

    const onMatchCancelled = useCallback((data: { reason: string }) => {
        console.warn(`[Room] Match cancelled: ${data.reason}. Re-searching...`);
        handleStop();

        // Show "Finding..." immediately to prevent the Start button from flickering
        setSearching(true);

        // Use a slightly longer delay to ensure all state updates (from handleStop -> resetState) are processed
        setTimeout(() => {
            console.log('[Room] Attempting auto-reconnect after cancellation');
            findMatch();
        }, 1000);
    }, [handleStop, findMatch, setSearching]);

    const handleUserStop = useCallback(() => {
        console.log('[Room] User manually stopped');
        manualStopRef.current = true;
        // Track session end
        trackSessionEnd('user-action');
        handleStop();
    }, [handleStop, trackSessionEnd]);

    // 6. Matching Hook
    const matching = useMatching({
        socket,
        onMatchFound,
        onMatchCancelled,
        onCallEnded
    });

    // Update refs whenever hook returns new functions
    useEffect(() => {
        startSearchRef.current = matching.startSearch;
        stopSearchRef.current = matching.stopSearch;
        endCallRef.current = matching.endCall;
    }, [matching]);

    // 7. Initialization & Cleanup
    useEffect(() => {
        // Always init media for voice
        initMediaManager();
        socket?.connect();

        return () => {
            handleStop();
            cleanupMedia();
        };
    }, [mode, socket, initMediaManager, cleanupMedia, handleStop]);

    // Handle initial match data (for direct calls from landing page)
    useEffect(() => {
        if (initialMatchData && !callRoomState.isConnected) {
            console.log('[Room] Initializing with direct match data:', initialMatchData);
            onMatchFound(initialMatchData);
        }
    }, [initialMatchData, onMatchFound, callRoomState.isConnected]);

    // Initialize/Sync Local Video - REMOVED (Voice Only)
    // useEffect(() => { ... }, []);

    // 8. Additional Socket Listeners (for media state)
    useEffect(() => {
        if (!socket) return;

        const onPartnerMute = (data: { isMuted: boolean }) => setPartnerIsMuted(data.isMuted);
        const onPartnerSignal = (data: { strength: 'good' | 'fair' | 'poor' | 'reconnecting' }) => {
            setPartnerSignalStrength(data.strength);
        };

        socket.on('partner-mute-state', onPartnerMute);
        socket.on('partner-signal-strength', onPartnerSignal);

        return () => {
            socket.off('partner-mute-state', onPartnerMute);
            socket.off('partner-signal-strength', onPartnerSignal);
        };
    }, [socket, setPartnerSignalStrength]);

    // Sync Local Media State with Server (Initial + Updates)
    useEffect(() => {
        if (!socket || !callRoomState.isMediaReady) return;

        socket.emit('update-media-state', {
            isMuted: callRoomState.isMuted,
        });
    }, [socket, callRoomState.isMediaReady, callRoomState.isMuted]);

    // 9. Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleUserStop();
            } else if (e.key === 'ArrowRight') {
                if (callRoomState.isConnected || callRoomState.isSearching) {
                    handleNext();
                } else {
                    findMatch();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleStop, handleNext, findMatch, callRoomState.isConnected, callRoomState.isSearching]);

    // 10. Utils
    const handleSendMessage = (text: string) => {
        if (text.trim()) {
            sendMessage(text);
            setInputText('');
        }
    };

    const handleToggleMute = useCallback(() => {
        const newMuted = !callRoomState.isMuted;
        toggleLocalMute();
        if (socket) {
            if (callRoomState.isConnected && callRoomState.partnerId) {
                socket.emit('toggle-mute', { target: callRoomState.partnerId, isMuted: newMuted });
            }
            socket.emit('update-media-state', { isMuted: newMuted });
        }
    }, [callRoomState.isMuted, callRoomState.isConnected, callRoomState.partnerId, toggleLocalMute, socket]);



    return (
        <div className="flex flex-col h-[100dvh] bg-[#111] text-foreground font-sans overflow-hidden select-none relative touch-none">
            <MobileRoomLayout
                callRoomState={callRoomState}
                partnerIsMuted={partnerIsMuted}
                showChat={showChat}
                messages={messages}
                inputText={inputText}
                remoteAudioRef={remoteAudioRef}
                messagesEndRef={messagesEndRef}
                onStop={handleUserStop}
                onNext={handleNext}
                onToggleMute={handleToggleMute}
                onSendMessage={handleSendMessage}
                setShowChat={setShowChat}
                setInputText={setInputText}
                mobileLayout={mobileLayout}
                setMobileLayout={setMobileLayout}
                filtersOpen={filtersOpen}
                setFiltersOpen={setFiltersOpen}
                onNavigateToHistory={onNavigateToHistory}
                selectedCountry={selectedCountry}
                onSelectCountry={setSelectedCountry}
                matchmakingStatus={matching.status}
                queuePosition={matching.position}
            />
            <DesktopRoomLayout
                callRoomState={callRoomState}
                partnerIsMuted={partnerIsMuted}
                showChat={showChat}
                messages={messages}
                inputText={inputText}
                remoteAudioRef={remoteAudioRef}
                messagesEndRef={messagesEndRef}
                onStop={handleUserStop}
                onNext={handleNext}
                onToggleMute={handleToggleMute}
                onSendMessage={handleSendMessage}
                setShowChat={setShowChat}
                setInputText={setInputText}
                filtersOpen={filtersOpen}
                setFiltersOpen={setFiltersOpen}
                onNavigateToHistory={onNavigateToHistory}
                selectedCountry={selectedCountry}
                onSelectCountry={setSelectedCountry}
                matchmakingStatus={matching.status}
                queuePosition={matching.position}
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
