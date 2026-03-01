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

            {/* Core Interaction Layer: Profiles and Skip */}
            <div className="flex items-start justify-between px-12 pb-12 border-b border-zinc-200">
                {/* Local User */}
                <div className="flex flex-col items-center gap-4 flex-1">
                    <div className="relative">
                        <div className="p-0.5 rounded-full bg-white ring-4 ring-pink-50 shadow-[0_4px_20px_rgba(236,72,153,0.15)]">
                            <img
                                src={localUser?.avatar || "https://api.dicebear.com/9.x/notionists/svg?seed=You"}
                                alt="You"
                                className={`w-24 h-24 rounded-full object-cover transition-opacity ${!isConnected && !isSearching ? 'opacity-50' : ''}`}
                            />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg border border-pink-100">
                            <button
                                onClick={actions.handleToggleMute}
                                className={`w-full h-full rounded-full flex flex-col items-center justify-center transition-colors ${isMuted ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
                            >
                                {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic2 className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>
                    <div className="text-center">
                        <h4 className="text-sm font-bold text-zinc-900">{localUser?.username || 'You'}</h4>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isMuted ? 'text-rose-500' : 'text-zinc-500'}`}>{isMuted ? 'Muted' : 'Speaking'}</p>
                    </div>
                </div>

                {/* Center Control: Skip */}
                <div className="flex flex-col items-center gap-4 px-8 pt-4">
                    <button onClick={handleNextWrapper} className="w-16 h-16 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-100 flex items-center justify-center transition-all shadow-sm active:scale-90 group relative overflow-hidden">
                        <FastForward className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                        {isSearching && (
                            <div className="absolute inset-0 border-2 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
                        )}
                    </button>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{isConnected ? 'Skip' : isSearching ? 'Scanning' : 'Tune In'}</span>
                </div>

                {/* Partner User */}
                <div className="flex flex-col items-center gap-4 flex-1">
                    <div className="relative">
                        <div className={`p-0.5 rounded-full ${isConnected ? 'bg-pink-100' : 'bg-zinc-100'} ring-4 ring-pink-50 shadow-[0_4px_20px_rgba(236,72,153,0.15)] transition-colors duration-700`}>
                            {isConnected ? (
                                <img
                                    src={callRoomState.partner_avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Str"}
                                    alt={callRoomState.partner_username || 'Stranger'}
                                    className="w-24 h-24 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-zinc-50 border-2 border-dashed border-zinc-200 flex items-center justify-center">
                                    <span className="text-zinc-400 font-bold text-xs uppercase tracking-widest">{isSearching ? '...' : '?'}</span>
                                </div>
                            )}
                        </div>
                        {isConnected && callRoomState.partner_country && (
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-pink-50">
                                <ReactCountryFlag countryCode={callRoomState.partner_country} svg className="w-4 h-3 rounded-sm opacity-90" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <div className="text-center">
                            <h4 className={`text-sm font-bold ${isConnected ? 'text-zinc-900' : 'text-zinc-500'}`}>{isConnected ? (callRoomState.partner_username || 'Stranger') : 'No Partner'}</h4>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">{isConnected ? (callRoomState.partner_country_name || 'Connected') : 'Awaiting Connection'}</p>
                        </div>
                        {isConnected && partnerId && (
                            <button
                                onClick={() => !isFriends && !isPending && onAddFriend && onAddFriend(partnerId)}
                                disabled={isFriends || isPending}
                                className={`flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-black rounded-full transition-all uppercase tracking-tight ${isFriends ? 'bg-emerald-500 text-white' :
                                    isPending ? 'bg-pink-100 text-pink-600' :
                                        'bg-zinc-900 hover:bg-zinc-800 text-white'
                                    }`}
                            >
                                <UserPlus className="w-3.5 h-3.5" strokeWidth={3} />
                                {isFriends ? 'Friends' : isPending ? 'Pending' : 'Add Friend'}
                            </button>
                        )}
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
                                <p className="leading-relaxed font-medium">{msg.text}</p>
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
