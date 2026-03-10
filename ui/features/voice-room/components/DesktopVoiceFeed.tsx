'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Mic2, MicOff, MoreHorizontal, SlidersHorizontal, ChevronDown, Check } from 'lucide-react';
import ReactCountryFlag from "react-country-flag";
import { FilterModal } from './FilterModal';
import { getAvatarUrl } from '@/utils/avatar';

interface DesktopVoiceFeedProps {
    onLeave?: () => void;
    onNavigateToHistory?: () => void;
    onNavigateToFriends?: () => void;
    onConnectionChange?: (connected: boolean) => void;
    initialMatchData?: any;
    onAddFriend?: (targetId: string, profile?: any) => void;
    onAcceptFriend?: (requestId: string) => void;
    friends?: any[];
    pendingRequests?: any[];
    sentRequests?: any[];
    initialReconnecting?: boolean;
    initialCallData?: any;
    voiceRoomData?: any;
    searchTimer?: number;
}

export const DesktopVoiceFeed = ({
    onLeave,
    onNavigateToHistory,
    onNavigateToFriends,
    onConnectionChange,
    initialMatchData,
    onAddFriend,
    onAcceptFriend,
    friends = [],
    pendingRequests = [],
    sentRequests = [],
    initialReconnecting,
    initialCallData,
    voiceRoomData,
    searchTimer = 0
}: DesktopVoiceFeedProps) => {
    const mode = 'voice';

    const {
        callRoomState,
        messages,
        messagesEndRef,
        remoteAudioRef,
        actions,
        handleNext,
        handleUserStop,
        isReconnecting,
        callDuration,
        selectedCountry,
        setSelectedCountry
    } = voiceRoomData || {};

    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [inputText, setInputText] = useState('');

    const handleSendMessageWrapper = () => {
        if (inputText.trim()) {
            actions.handleSendMessage(inputText, setInputText);
        }
    };

    const handleNextWrapper = handleNext;
    const handleUserStopWrapper = handleUserStop;

    const isConnected = callRoomState.is_connected;
    const isSearching = callRoomState.is_searching;
    const isMuted = callRoomState.is_muted;
    const partnerId = callRoomState.partner_user_id;
    const isFriends = callRoomState.friendship_status === 'friends' || friends.some(f => f.id === partnerId);


    // Distinguish pending states
    const pendingSentReq = sentRequests?.find(r => (r.user?.id || r.target_user_id) === partnerId);
    const pendingReceivedReq = pendingRequests?.find(r => (r.user?.id || r.from_user_id) === partnerId);

    const isPendingSent = callRoomState.friendship_status === 'pending_sent' || !!pendingSentReq;
    const isPendingReceived = callRoomState.friendship_status === 'pending_received' || !!pendingReceivedReq;
    const requestId = pendingReceivedReq?.id;


    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Audio Component */}
            <audio ref={remoteAudioRef} autoPlay />

            {/* Top Bar: Minimal Timer & Filter */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${isConnected
                            ? 'bg-zinc-50 border-zinc-100 text-zinc-300 pointer-events-none'
                            : selectedCountry !== 'GLOBAL'
                                ? 'bg-pink-50 border-pink-100 text-pink-600 hover:bg-pink-100'
                                : 'bg-white border-zinc-100 text-zinc-400 hover:text-zinc-600 hover:border-zinc-200'
                            }`}
                        disabled={isConnected}
                    >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>{selectedCountry === 'GLOBAL' ? 'Filter' : `Country: ${selectedCountry}`}</span>
                    </button>
                </div>

                <div className="flex items-center gap-2 group cursor-default">
                    {isConnected ? (
                        <>
                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_8px_rgba(52,211,153,0.3)]" />
                            <span className="text-[10px] font-bold text-zinc-400 tabular-nums tracking-widest uppercase">{callDuration}</span>
                        </>
                    ) : (
                        <span className="text-[10px] font-bold text-zinc-500 tabular-nums tracking-widest uppercase truncate max-w-[150px]">
                            {isSearching ? actions.matching.status : 'Ready'}
                        </span>
                    )}
                </div>
            </div>

            <FilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                currentCountry={selectedCountry}
                onSelectCountry={(code) => {
                    setSelectedCountry(code);
                }}
            />

            {/* Core Interaction Area: Discovery Stage */}
            <div className="flex flex-col items-center justify-center px-10 pb-6 border-b border-zinc-200">
                <div className="relative flex flex-col items-center">
                    {/* The Interactive Discovery Circle */}
                    <div
                        onClick={!isConnected && !isSearching ? handleNextWrapper : undefined}
                        className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all duration-700 ${!isConnected && !isSearching ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
                            }`}
                    >
                        {/* Pulse effect when ready */}
                        {!isConnected && !isSearching && (
                            <div className="absolute -inset-4 bg-pink-50/50 rounded-full animate-[pulse_3s_ease-in-out_infinite] pointer-events-none" />
                        )}

                        {/* Searching indicator */}
                        {isSearching && (
                            <>
                                <div className="absolute -inset-6 bg-pink-50/30 rounded-full animate-[pulse_2s_ease-in-out_infinite] blur-md pointer-events-none" />
                                <div className="absolute -inset-2 border border-pink-100 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] opacity-50" />
                            </>
                        )}

                        {/* Main Interaction Unit */}
                        <div className={`w-full h-full rounded-full p-1 bg-white/80 ring-1 ${isConnected ? 'ring-pink-100' : 'ring-zinc-100'} shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md overflow-hidden transition-all duration-700`}>
                            {isReconnecting || actions.matching.status === 'RECONNECTING' ? (
                                <div className="w-full h-full rounded-full bg-zinc-50/50 flex items-center justify-center animate-[pulse_2s_ease-in-out_infinite]">
                                    <div className="flex flex-col items-center">
                                        <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce mb-1" />
                                        <span className="text-[8px] font-black text-pink-400 uppercase tracking-tighter">Syncing</span>
                                    </div>
                                </div>
                            ) : isConnected ? (
                                <img
                                    src={getAvatarUrl(callRoomState.partner_avatar || callRoomState.partner_username)}
                                    alt={callRoomState.partner_username || 'Stranger'}
                                    className="w-full h-full rounded-full object-cover animate-in fade-in zoom-in duration-700"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-white to-zinc-50/50 flex items-center justify-center">
                                    {isSearching ? (
                                        <div className="relative flex items-center justify-center">
                                            <div className="absolute w-12 h-12 bg-pink-50/60 rounded-full animate-[pulse_2s_ease-in-out_infinite]" />
                                            <Mic2 className="w-6 h-6 text-pink-400 relative z-10 animate-[pulse_2s_ease-in-out_infinite]" />
                                        </div>
                                    ) : (
                                        <div className="w-3.5 h-3.5 bg-pink-400/80 rounded-full shadow-[0_0_12px_rgba(244,114,182,0.6)] animate-[pulse_3s_ease-in-out_infinite]" />
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
                    <div className="mt-4 flex flex-col items-center w-full text-center">
                        <h4 className={`text-base font-bold ${isConnected || isReconnecting || actions.matching.status === 'RECONNECTING' ? 'text-zinc-900' : 'text-zinc-500'} transition-colors duration-500`}>
                            {isReconnecting || actions.matching.status === 'RECONNECTING' ? (
                                actions.matching.reconnectCountdown !== null ? `Partner Reconnecting` : `Linking Session`
                            ) : isConnected ? (callRoomState.partner_username || 'Stranger') : isSearching ? 'In Position Queue' : 'Start a Match'}
                        </h4>
                        <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-[0.25em] mt-1">
                            {isReconnecting || actions.matching.status === 'RECONNECTING' ? (
                                actions.matching.reconnectCountdown !== null ? `Awaiting return • ${actions.matching.reconnectCountdown}s` : `Restoring connection...`
                            ) : isConnected ? 'In Call' : isSearching ? (
                                actions.matching.position !== null ?
                                    `Queue Position: ${actions.matching.position} • Possible Match Time: ${Math.floor((actions.matching.position * 2) / 60)}:${((actions.matching.position * 2) % 60).toString().padStart(2, '0')}`
                                    : `Queue Position: Evaluating • Wait Time: ${Math.floor(searchTimer / 60)}:${(searchTimer % 60).toString().padStart(2, '0')}`
                            ) : 'Tap the circle to begin'}
                        </p>

                        {/* Action buttons appear only when relevant */}
                        <div className="mt-4 flex items-center justify-center gap-3">
                            {(isSearching || isConnected) && (
                                <button
                                    onClick={actions.handleUserStop}
                                    className="px-8 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full transition-all active:scale-95 border border-zinc-200 shadow-sm"
                                    title="Stop and leave"
                                >
                                    Stop
                                </button>
                            )}

                            {isConnected && partnerId && (
                                <button
                                    onClick={() => {
                                        if (isFriends) return;
                                        if (isPendingReceived && requestId && onAcceptFriend) {
                                            onAcceptFriend(requestId);
                                        } else if (!isPendingSent && !isPendingReceived && onAddFriend) {
                                            onAddFriend(partnerId, {
                                                id: partnerId,
                                                username: callRoomState.partner_username || 'Stranger',
                                                avatar: callRoomState.partner_avatar,
                                                country: callRoomState.partner_country
                                            });
                                        }
                                    }}
                                    disabled={isFriends || (isPendingSent && !isPendingReceived)}
                                    className={`flex items-center gap-2 px-8 py-2.5 text-[10px] font-black rounded-full transition-all uppercase tracking-tight shadow-sm ${isFriends ? 'bg-emerald-500/90 text-white' :
                                        isPendingReceived ? 'bg-pink-400 hover:bg-pink-500 text-white animate-[pulse_2s_ease-in-out_infinite]' :
                                            isPendingSent ? 'bg-zinc-100 text-zinc-400' :
                                                'bg-zinc-900 hover:bg-zinc-800 text-white'
                                        }`}
                                >
                                    <UserPlus className="w-3.5 h-3.5" strokeWidth={3} />
                                    {isFriends ? 'Friends' : isPendingReceived ? 'Accept' : isPendingSent ? 'Pending' : 'Add Friend'}
                                </button>
                            )}

                            {isConnected && (
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
            <div className={`flex-1 flex flex-col min-h-0 pt-4 transition-opacity duration-500 ${!isConnected ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
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
                <div className="mt-4 mb-6 px-2">
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
                @keyframes pulse-soft {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                }
                .pulse-soft {
                    animation: pulse-soft 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};
