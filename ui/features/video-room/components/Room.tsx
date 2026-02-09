'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { socket as getSocket } from '../../../lib/socket';
import { useMatching } from '../hooks/useMatching';
import { useWebRTC } from '../hooks/useWebRTC';
import { useVideoRoom } from '../hooks/useVideoRoom';
import { useChat } from '../../chat/hooks/useChat';
import { Socket } from 'socket.io-client';
import { MobileRoomLayout } from './MobileRoomLayout';
import { DesktopRoomLayout } from './DesktopRoomLayout';
import { DevicePermissionOverlay } from './DevicePermissionOverlay';
import { CountryFilterModal } from './CountryFilterModal';

interface RoomProps {
    mode: 'chat' | 'video';
    onLeave: () => void;
    onNavigateToChat: () => void;
    onNavigateToHistory: () => void;
}

export default function Room({ mode, onLeave, onNavigateToChat, onNavigateToHistory }: RoomProps) {
    // 1. Core State & Framework Hooks
    const socket = getSocket() as Socket | null;
    const {
        state: videoRoomState,
        mediaManager,
        initMediaManager,
        cleanupMedia,
        toggleMute: toggleLocalMute,
        toggleCamera: toggleLocalCamera,
        setSearching,
        setConnected,
        setPartner,
        setPartnerSignalStrength,
        resetState,
    } = useVideoRoom(mode);

    // 2. Extra UI State (not in hooks)
    const [partnerIsMuted, setPartnerIsMuted] = useState(false);
    const [partnerIsCameraOff, setPartnerIsCameraOff] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [inputText, setInputText] = useState("");
    const [mobileLayout, setMobileLayout] = useState<'overlay' | 'split'>('overlay');
    const [selectedCountry, setSelectedCountry] = useState('GLOBAL');

    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const desktopLocalVideoRef = useRef<HTMLVideoElement>(null);
    const mobileLocalVideoRef = useRef<HTMLVideoElement>(null);

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
        remoteVideoRef,
        onConnectionStateChange: (state) => {
            if (state === 'failed') {
                handleStop();
            }
            // If disconnected, we don't stop immediately anymore. We wait for reconnection or manual stop.
        },
        onSignalQuality: (quality) => {
            // Send my signal quality to partner
            if (socket && videoRoomState.partnerId) {
                socket.emit('signal-strength', {
                    target: videoRoomState.partnerId,
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
    } = useChat(socket, videoRoomState.partnerId);

    const partnerIdRef = useRef(videoRoomState.partnerId);

    useEffect(() => {
        partnerIdRef.current = videoRoomState.partnerId;
    }, [videoRoomState.partnerId]);

    // 5. Matching Callbacks
    const handleStop = useCallback(() => {
        console.log('[Room] Stopping search or ending call');
        stopSearchRef.current();
        endCallRef.current(partnerIdRef.current);
        closePeerConnection();
        resetState();
        clearMessages();
        setPartnerIsMuted(false);
        setPartnerIsCameraOff(false);
    }, [closePeerConnection, resetState, clearMessages]);

    const findMatch = useCallback(() => {
        console.log('[Room] Initiating new match search');
        manualStopRef.current = false;
        resetState();
        clearMessages();
        setPartnerIsMuted(false);
        setPartnerIsCameraOff(false);
        closePeerConnection();
        setSearching(true);
        startSearchRef.current(selectedCountry === 'GLOBAL' ? undefined : selectedCountry);
    }, [resetState, clearMessages, closePeerConnection, setSearching, selectedCountry]);

    const handleNext = useCallback(() => {
        console.log('[Room] Skipping to next partner');
        manualStopRef.current = true;
        handleStop();

        // Show "Finding..." immediately during the cooldown
        setSearching(true);

        // Delay ensures server cleans up before next search
        setTimeout(() => {
            manualStopRef.current = false;
            findMatch();
        }, 500);
    }, [handleStop, findMatch, setSearching]);

    const onMatchFound = useCallback(async (data: any) => {
        console.log('[Room] Match found:', data);
        setSearching(false);
        setConnected(true);
        setPartner(data.partnerId, data.partnerCountry, data.partnerCountryCode);
        setPartnerIsMuted(!!data.partnerIsMuted);
        setPartnerIsCameraOff(!!data.partnerIsCameraOff);

        if (mode === 'video' && data.role === 'offerer') {
            await createOffer(data.partnerId);
        }
    }, [mode, createOffer, setSearching, setConnected, setPartner]);

    const onCallEnded = useCallback(() => {
        if (manualStopRef.current) {
            console.log('[Room] Call ended manually, suppressing auto-reconnect');
            manualStopRef.current = false;
            return;
        }

        console.log('[Room] Call ended by partner or system');
        handleStop();
        // Omegle-style auto-reconnect
        setTimeout(() => {
            findMatch();
        }, 300);
    }, [handleStop, findMatch]);

    const handleUserStop = useCallback(() => {
        console.log('[Room] User manually stopped');
        manualStopRef.current = true;
        handleStop();
    }, [handleStop]);

    // 6. Matching Hook
    const matching = useMatching({
        socket,
        mode,
        onMatchFound,
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
        if (mode === 'video') {
            initMediaManager();
        }
        socket?.connect();

        return () => {
            handleStop();
            cleanupMedia();
            if (desktopLocalVideoRef.current) desktopLocalVideoRef.current.srcObject = null;
            if (mobileLocalVideoRef.current) mobileLocalVideoRef.current.srcObject = null;
        };
    }, [mode, socket, initMediaManager, cleanupMedia, handleStop]);

    // Initialize/Sync Local Video
    useEffect(() => {
        if (!mediaManager.current || !videoRoomState.isMediaReady) return;

        const stream = mediaManager.current.getStream();
        if (stream) {
            // Attach to desktop video
            if (desktopLocalVideoRef.current && desktopLocalVideoRef.current.srcObject !== stream) {
                desktopLocalVideoRef.current.srcObject = stream;
            }
            // Attach to mobile video
            if (mobileLocalVideoRef.current && mobileLocalVideoRef.current.srcObject !== stream) {
                mobileLocalVideoRef.current.srcObject = stream;
            }
        }
    }, [videoRoomState.isMediaReady, videoRoomState.isSearching, videoRoomState.isConnected, mediaManager]);

    // 8. Additional Socket Listeners (for media state)
    useEffect(() => {
        if (!socket) return;

        const onPartnerMute = (data: { isMuted: boolean }) => setPartnerIsMuted(data.isMuted);
        const onPartnerCamera = (data: { isCameraOff: boolean }) => setPartnerIsCameraOff(data.isCameraOff);
        const onPartnerSignal = (data: { strength: 'good' | 'fair' | 'poor' | 'reconnecting' }) => {
            setPartnerSignalStrength(data.strength);
        };

        socket.on('partner-mute-state', onPartnerMute);
        socket.on('partner-camera-state', onPartnerCamera);
        socket.on('partner-signal-strength', onPartnerSignal);

        return () => {
            socket.off('partner-mute-state', onPartnerMute);
            socket.off('partner-camera-state', onPartnerCamera);
            socket.off('partner-signal-strength', onPartnerSignal);
        };
    }, [socket, setPartnerSignalStrength]);

    // Sync Local Media State with Server (Initial + Updates)
    useEffect(() => {
        if (!socket || !videoRoomState.isMediaReady) return;

        socket.emit('update-media-state', {
            isMuted: videoRoomState.isMuted,
            isCameraOff: videoRoomState.isCameraOff
        });
    }, [socket, videoRoomState.isMediaReady, videoRoomState.isMuted, videoRoomState.isCameraOff]);

    // 9. Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleUserStop();
            } else if (e.key === 'ArrowRight') {
                if (videoRoomState.isConnected || videoRoomState.isSearching) {
                    handleNext();
                } else {
                    findMatch();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleStop, handleNext, findMatch, videoRoomState.isConnected, videoRoomState.isSearching]);

    // 10. Utils
    const handleSendMessage = (text: string) => {
        if (text.trim()) {
            sendMessage(text);
            setInputText('');
        }
    };

    const handleToggleMute = useCallback(() => {
        const newMuted = !videoRoomState.isMuted;
        toggleLocalMute();
        if (socket) {
            if (videoRoomState.isConnected && videoRoomState.partnerId) {
                socket.emit('toggle-mute', { target: videoRoomState.partnerId, isMuted: newMuted });
            }
            socket.emit('update-media-state', { isMuted: newMuted });
        }
    }, [videoRoomState.isMuted, videoRoomState.isConnected, videoRoomState.partnerId, toggleLocalMute, socket]);

    const handleToggleCamera = useCallback(() => {
        const newCameraOff = !videoRoomState.isCameraOff;
        toggleLocalCamera();
        if (socket) {
            if (videoRoomState.isConnected && videoRoomState.partnerId) {
                socket.emit('toggle-camera', { target: videoRoomState.partnerId, isCameraOff: newCameraOff });
            }
            socket.emit('update-media-state', { isCameraOff: newCameraOff });
        }
    }, [videoRoomState.isCameraOff, videoRoomState.isConnected, videoRoomState.partnerId, toggleLocalCamera, socket]);

    return (
        <div className="flex flex-col h-[100dvh] bg-[#111] text-foreground font-sans overflow-hidden select-none relative touch-none">
            <MobileRoomLayout
                videoRoomState={videoRoomState}
                partnerIsMuted={partnerIsMuted}
                partnerIsCameraOff={partnerIsCameraOff}
                showChat={showChat}
                messages={messages}
                inputText={inputText}
                localVideoRef={mobileLocalVideoRef}
                remoteVideoRef={remoteVideoRef}
                messagesEndRef={messagesEndRef}
                onStop={handleUserStop}
                onNext={handleNext}
                onToggleMute={handleToggleMute}
                onToggleCamera={handleToggleCamera}
                onSendMessage={handleSendMessage}
                setShowChat={setShowChat}
                setInputText={setInputText}
                mobileLayout={mobileLayout}
                setMobileLayout={setMobileLayout}
                filtersOpen={filtersOpen}
                setFiltersOpen={setFiltersOpen}
                onNavigateToChat={onNavigateToChat}
                onNavigateToHistory={onNavigateToHistory}
                selectedCountry={selectedCountry}
                onSelectCountry={setSelectedCountry}
            />
            <DesktopRoomLayout
                videoRoomState={videoRoomState}
                partnerIsMuted={partnerIsMuted}
                partnerIsCameraOff={partnerIsCameraOff}
                showChat={showChat}
                messages={messages}
                inputText={inputText}
                localVideoRef={desktopLocalVideoRef}
                remoteVideoRef={remoteVideoRef}
                messagesEndRef={messagesEndRef}
                onStop={handleUserStop}
                onNext={handleNext}
                onToggleMute={handleToggleMute}
                onToggleCamera={handleToggleCamera}
                onSendMessage={handleSendMessage}
                setShowChat={setShowChat}
                setInputText={setInputText}
                filtersOpen={filtersOpen}
                setFiltersOpen={setFiltersOpen}
                onNavigateToChat={onNavigateToChat}
                onNavigateToHistory={onNavigateToHistory}
                selectedCountry={selectedCountry}
                onSelectCountry={setSelectedCountry}
            />
            {videoRoomState.permissionDenied && (
                <DevicePermissionOverlay onRetry={initMediaManager} />
            )}
            <CountryFilterModal
                isOpen={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                onSelectCountry={setSelectedCountry}
                selectedCountryCode={selectedCountry}
            />
        </div>
    );
}
