'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { socket as getSocket } from '../../../lib/socket';
import { useMatching } from '../../video-room/hooks/useMatching';
import { useChat } from '../hooks/useChat';
import { Socket } from 'socket.io-client';
import ChatBox from './ChatBox';
import { RoomNavbar } from '../../../components/RoomNavbar';

interface ChatRoomProps {
    onNavigateToVideo: () => void;
    onNavigateToHistory: () => void;
    onConnectionChange: (connected: boolean) => void;
}

export default function ChatRoom({ onNavigateToVideo, onNavigateToHistory, onConnectionChange }: ChatRoomProps) {
    const socket = getSocket() as Socket | null;

    // State
    const [isSearching, setIsSearching] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [partnerCountry, setPartnerCountry] = useState<string | null>(null);
    const [partnerCountryCode, setPartnerCountryCode] = useState<string | null>(null);

    const manualStopRef = useRef(false);
    const partnerIdRef = useRef<string | null>(null);

    // Notify parent about connection state changes
    useEffect(() => {
        onConnectionChange(isConnected);
    }, [isConnected, onConnectionChange]);

    // Refs
    const startSearchRef = useRef<() => void>(() => { });
    const stopSearchRef = useRef<() => void>(() => { });
    const endCallRef = useRef<(id: string | null) => void>(() => { });

    // Chat Hook
    const {
        messages,
        messagesEndRef,
        sendMessage,
        clearMessages,
    } = useChat(socket, partnerId);

    useEffect(() => {
        partnerIdRef.current = partnerId;
    }, [partnerId]);

    // Reset everything
    const resetState = useCallback(() => {
        setIsSearching(false);
        setIsConnected(false);
        setPartnerId(null);
        setPartnerCountry(null);
        setPartnerCountryCode(null);
    }, []);

    const handleStop = useCallback(() => {
        console.log('[ChatRoom] Stopping search or ending conversation');
        stopSearchRef.current();
        endCallRef.current(partnerIdRef.current);
        resetState();
        clearMessages();
    }, [resetState, clearMessages]);

    const findMatch = useCallback(() => {
        console.log('[ChatRoom] Initiating new match search');
        manualStopRef.current = false;
        resetState();
        clearMessages();
        setIsSearching(true);
        startSearchRef.current();
    }, [resetState, clearMessages]);

    const handleNext = useCallback(() => {
        console.log('[ChatRoom] Skipping to next partner');
        manualStopRef.current = true;
        handleStop();
        setIsSearching(true);

        setTimeout(() => {
            manualStopRef.current = false;
            findMatch();
        }, 500);
    }, [handleStop, findMatch]);

    const onMatchFound = useCallback(async (data: any) => {
        console.log('[ChatRoom] Match found:', data);
        setIsSearching(false);
        setIsConnected(true);
        setPartnerId(data.partnerId);
        setPartnerCountry(data.partnerCountry);
        setPartnerCountryCode(data.partnerCountryCode);
    }, []);

    const onCallEnded = useCallback(() => {
        if (manualStopRef.current) {
            console.log('[ChatRoom] Conversation ended manually, suppressing auto-reconnect');
            manualStopRef.current = false;
            return;
        }

        console.log('[ChatRoom] Conversation ended by partner or system');
        handleStop();
        // Auto-reconnect
        setTimeout(() => {
            findMatch();
        }, 300);
    }, [handleStop, findMatch]);

    const handleUserStop = useCallback(() => {
        console.log('[ChatRoom] User manually stopped');
        manualStopRef.current = true;
        handleStop();
    }, [handleStop]);

    // Matching Hook
    const matching = useMatching({
        socket,
        mode: 'chat',
        onMatchFound,
        onCallEnded
    });

    // Update refs
    useEffect(() => {
        startSearchRef.current = matching.startSearch;
        stopSearchRef.current = matching.stopSearch;
        endCallRef.current = matching.endCall;
    }, [matching]);

    // Initialization
    useEffect(() => {
        socket?.connect();

        return () => {
            handleStop();
        };
    }, [socket, handleStop]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleUserStop();
            } else if (e.key === 'ArrowRight') {
                if (isConnected || isSearching) {
                    handleNext();
                } else {
                    findMatch();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUserStop, handleNext, findMatch, isConnected, isSearching]);


    return (
        <>
            {/* Desktop View */}
            <div className="hidden lg:flex flex-col w-full h-screen bg-[#111]">
                <div className="flex flex-col w-full h-full p-4 gap-4">
                    <RoomNavbar
                        activeTab="chat"
                        onNavigateToVideo={onNavigateToVideo}
                        onNavigateToHistory={onNavigateToHistory}
                        variant="desktop"
                    />

                    {/* Main Chat Area - Desktop */}
                    <div className="flex-1 flex gap-4 min-h-0">
                        {/* Chat Container - Matching Video Room Card Style */}
                        <div className="flex-1 rounded-3xl overflow-hidden relative border border-white/5 bg-zinc-900 flex flex-col items-center justify-center">
                            <div className="text-center px-6 animate-in fade-in zoom-in duration-500">
                                <div className="text-6xl mb-6 grayscale opacity-40">
                                    <span role="img" aria-label="Construction">🚧</span>
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2 shadow-black drop-shadow-md tracking-tight">Under Construction</h2>
                                <p className="text-white/60 text-base font-medium shadow-black drop-shadow-md mb-6">
                                    Chat-only feature is coming soon!
                                </p>
                                <p className="text-white/40 text-sm">
                                    For now, use <span className="text-[#FF8ba7] font-semibold">Video Chat</span> to connect with others
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile View */}
            <div className="lg:hidden flex flex-col w-full h-screen bg-[#111] text-white overflow-hidden">
                {/* Mobile Navbar */}
                <div className="fixed top-0 left-0 right-0 z-30">
                    <RoomNavbar
                        activeTab="chat"
                        onNavigateToVideo={onNavigateToVideo}
                        onNavigateToHistory={onNavigateToHistory}
                        variant="mobile"
                    />
                </div>

                {/* Main Container - Similar to desktop */}
                <div className="flex-1 flex flex-col pt-14 p-2 gap-2">
                    <div className="flex-1 rounded-3xl overflow-hidden relative border border-white/5 bg-zinc-900 flex flex-col items-center justify-center">
                        <div className="text-center px-6 animate-in fade-in zoom-in duration-500">
                            <div className="text-5xl mb-4 grayscale opacity-40">
                                <span role="img" aria-label="Construction">🚧</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2 shadow-black drop-shadow-md tracking-tight">Under Construction</h2>
                            <p className="text-white/60 text-sm font-medium shadow-black drop-shadow-md mb-4">
                                Chat-only feature is coming soon!
                            </p>
                            <p className="text-white/40 text-xs">
                                Use <span className="text-[#FF8ba7] font-semibold">Video Chat</span> for now
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
