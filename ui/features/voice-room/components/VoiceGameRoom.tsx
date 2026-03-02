'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { UserPlus, Mic2, MicOff, MoreHorizontal, FastForward } from 'lucide-react';
import ReactCountryFlag from "react-country-flag";

import { emitSignalStrength } from '@/lib/socket/matching/matching.actions';
import { useRoomActions } from '@/hooks';
import { useRoomEffects } from '@/features/voice-room/hooks/room-effects/useRoomEffects';
import { useWebRTC } from '@/hooks';
import { useCallRoom } from '@/hooks';
import { useChat } from '@/hooks';
import { useReconnect } from '@/features/voice-room/hooks/reconnect/useReconnect';
import { useCallDuration } from '@/features/voice-room/hooks/duration/useCallDuration';
import { useHistory, useUser } from '@/hooks';

interface VoiceGameRoomProps {
    onLeave?: () => void;
    onNavigateToHistory?: () => void;
    onNavigateToFriends?: () => void;
    onConnectionChange?: (connected: boolean) => void;
    initialMatchData?: any;
    onAddFriend?: (targetId: string) => void;
    friends?: any[];
    pendingRequests?: any[];
    sentRequests?: any[];
    initialReconnecting?: boolean;
    initialCallData?: any;
}

export const VoiceGameRoom = ({
    onLeave,
    onNavigateToHistory,
    onNavigateToFriends,
    onConnectionChange,
    initialMatchData,
    onAddFriend,
    friends = [],
    pendingRequests = [],
    sentRequests = [],
    initialReconnecting,
    initialCallData
}: VoiceGameRoomProps) => {
    const mode = 'voice';

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

    // 2. Extra UI State
    const [inputText, setInputText] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('GLOBAL');

    const remoteAudioRef = useRef<HTMLAudioElement>(null);

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
            .catch(err => console.warn('[VoiceGameRoom] Failed to query native mic permission:', err));
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
    const { messages, messagesEndRef, sendMessage, clearMessages } = useChat(callRoomState.partner_id);

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
        trackSessionEnd: async () => { }, // History tracking relies on history hook, if needed pass down
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

    const { user: localUser } = useUser();

    const handleSendMessageWrapper = () => {
        if (inputText.trim()) {
            actions.handleSendMessage(inputText, setInputText);
        }
    };

    const handleNextWrapper = useCallback(() => {
        clearReconnectState();
        actions.handleNext();
    }, [clearReconnectState, actions]);

    const handleUserStopWrapper = useCallback(() => {
        clearReconnectState();
        actions.handleUserStop();
    }, [clearReconnectState, actions]);

    const isConnected = callRoomState.is_connected;
    const isSearching = callRoomState.is_searching;
    const isMuted = callRoomState.is_muted;
    const partnerId = callRoomState.partner_user_id;
    const isFriends = callRoomState.friendship_status === 'friends' || friends.some(f => f.id === partnerId);
    const isPending = callRoomState.friendship_status === 'pending_sent' ||
        pendingRequests?.some(r => r.user?.id === partnerId) ||
        sentRequests?.some(r => r.user?.id === partnerId);


    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Audio Component */}
            <audio ref={remoteAudioRef} autoPlay />

            {/* Top Bar: Minimal Timer */}
            <div className="flex justify-end mb-8">
                <div className="flex items-center gap-2 group cursor-default">
                    {isConnected ? (
                        <>
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-bold text-zinc-500 tabular-nums tracking-widest uppercase">{callDuration}</span>
                        </>
                    ) : (
                        <span className="text-[10px] font-bold text-zinc-500 tabular-nums tracking-widest uppercase truncate max-w-[150px]">
                            {isSearching ? actions.matching.status : 'Ready to Join'}
                        </span>
                    )}
                </div>
            </div>

            {/* Core Interaction Area: Discovery Stage */}
            <div className="flex flex-col items-center justify-center px-12 pb-12 border-b border-zinc-200">
                <div className="relative flex flex-col items-center">
                    {/* The Interactive Discovery Circle */}
                    <div
                        onClick={!isConnected && !isSearching ? handleNextWrapper : undefined}
                        className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center transition-all duration-700 ${!isConnected && !isSearching ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
                            }`}
                    >
                        {/* Pulse effect when ready */}
                        {!isConnected && !isSearching && (
                            <div className="absolute -inset-4 bg-pink-500/10 rounded-full animate-ping pointer-events-none" />
                        )}

                        {/* Searching indicator */}
                        {isSearching && (
                            <div className="absolute -inset-2 border-2 border-dashed border-pink-300 rounded-full animate-spin" />
                        )}

                        {/* Main Interaction Unit */}
                        <div className={`w-full h-full rounded-full p-1 bg-white ring-4 ${isConnected ? 'ring-pink-100' : 'ring-pink-50'} shadow-[0_8px_32px_rgba(236,72,153,0.12)] overflow-hidden transition-all duration-700`}>
                            {isConnected ? (
                                <img
                                    src={callRoomState.partner_avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Str"}
                                    alt={callRoomState.partner_username || 'Stranger'}
                                    className="w-full h-full rounded-full object-cover animate-in fade-in zoom-in duration-700"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-white to-pink-50/50 flex items-center justify-center">
                                    {isSearching ? (
                                        <div className="relative flex items-center justify-center">
                                            <div className="absolute w-10 h-10 bg-pink-400/10 rounded-full animate-pulse" />
                                            <Mic2 className="w-6 h-6 text-pink-500 relative z-10 animate-pulse" />
                                        </div>
                                    ) : (
                                        <div className="w-3.5 h-3.5 bg-pink-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(236,72,153,0.8)]" />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Mute toggle relocated to bottom-right */}
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-pink-50 z-20">
                            <button
                                onClick={(e) => { e.stopPropagation(); actions.handleToggleMute(); }}
                                className={`w-full h-full rounded-full flex items-center justify-center transition-colors ${isMuted ? 'text-rose-500 hover:bg-rose-50' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'}`}
                            >
                                {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic2 className="w-3.5 h-3.5" />}
                            </button>
                        </div>

                        {/* Location context overlay - moved slightly to avoid clashing with mute */}
                        {isConnected && callRoomState.partner_country && (
                            <div className="absolute top-0 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-pink-50 z-20 transition-all animate-in zoom-in duration-500">
                                <ReactCountryFlag countryCode={callRoomState.partner_country} svg className="w-5 h-4 rounded-sm" />
                            </div>
                        )}
                    </div>

                    {/* Meta/Status block - Centered & Spaced */}
                    <div className="mt-8 flex flex-col items-center w-full text-center">
                        <h4 className={`text-base font-bold ${isConnected ? 'text-zinc-900' : 'text-zinc-500'} transition-colors duration-500`}>
                            {isConnected ? (callRoomState.partner_username || 'Stranger') : isSearching ? 'Scanning for voices...' : 'Start a Match'}
                        </h4>
                        <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-[0.25em] mt-2">
                            {isConnected ? (callRoomState.partner_country_name || 'In Call') : isSearching ? 'Tuning frequencies' : 'Tap the circle to begin'}
                        </p>

                        {/* Action buttons appear only when relevant */}
                        <div className="mt-6 flex items-center justify-center gap-3 h-10">
                            {isConnected && partnerId && (
                                <button
                                    onClick={() => !isFriends && !isPending && onAddFriend && onAddFriend(partnerId)}
                                    disabled={isFriends || isPending}
                                    className={`flex items-center gap-2 px-8 py-2.5 text-[10px] font-black rounded-full transition-all uppercase tracking-tight shadow-sm ${isFriends ? 'bg-emerald-500 text-white' :
                                        isPending ? 'bg-pink-100 text-pink-600' :
                                            'bg-zinc-900 hover:bg-zinc-800 text-white'
                                        }`}
                                >
                                    <UserPlus className="w-3.5 h-3.5" strokeWidth={3} />
                                    {isFriends ? 'Friends' : isPending ? 'Pending' : 'Add Friend'}
                                </button>
                            )}

                            {(isConnected || isSearching) && (
                                <button
                                    onClick={handleNextWrapper}
                                    className="px-8 py-2.5 bg-pink-50 hover:bg-pink-100 text-pink-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full transition-all active:scale-95 border border-pink-100 shadow-sm"
                                >
                                    Next
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Discussion Layer */}
            <div className={`flex-1 flex flex-col min-h-0 pt-8 transition-opacity duration-500 ${!isConnected ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto space-y-4 px-4 scrollbar-hide">
                    {messages.map((msg: any, index: number) => (
                        <div key={index} className={`flex ${msg.isSelf ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${msg.isSelf
                                ? 'bg-pink-500 text-white shadow-sm'
                                : 'bg-white text-zinc-600 border border-zinc-200 shadow-sm'
                                }`}>
                                <p className="leading-relaxed font-medium">{msg.message}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Bottom Entry Area */}
                <div className="mt-6 mb-10 px-2">
                    <div className="relative flex items-center gap-3 bg-white/60 rounded-3xl px-4 py-2 border border-zinc-200 focus-within:border-pink-300 transition-all duration-300 shadow-sm">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessageWrapper()}
                                placeholder="Message..."
                                className="w-full h-10 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none"
                                disabled={!isConnected}
                            />
                        </div>
                        {inputText.trim().length > 0 && (
                            <button onClick={handleSendMessageWrapper} className="text-sm font-bold text-blue-500 hover:text-blue-400 active:scale-95 transition-all px-2 animate-in fade-in zoom-in duration-200">
                                Send
                            </button>
                        )}
                        <div className="flex items-center gap-1">
                            <button className="p-2 hover:bg-pink-50 rounded-full transition-all text-zinc-400 hover:text-zinc-600">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};
