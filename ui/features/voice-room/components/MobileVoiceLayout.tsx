'use client';

import React, { useState, useEffect } from 'react';
import {
    X,
    Mic2,
    MicOff,
    MessageCircle,
    History,
    Users,
    SlidersHorizontal,
    ArrowLeft,
    ChevronDown,
    UserPlus,
    UserCheck,
    UserMinus,
    Phone,
    Trash2,
    Clock,
    Plus
} from 'lucide-react';
import ReactCountryFlag from "react-country-flag";
import { useUser } from '@/hooks';
import { getAvatarUrl } from '@/utils/avatar';
import { useVoiceRoom } from '../hooks/useVoiceRoom';
import { UpcomingBadge } from '@/components/UpcomingBadge';

interface MobileVoiceLayoutProps {
    onLeave: () => void;
    history?: any[];
    friends?: any[];
    pendingRequests?: any[];
    sentRequests?: any[];
    onAcceptRequest?: (id: string) => void;
    onDeclineRequest?: (id: string) => void;
    onCancelRequest?: (id: string) => void;
    onAddFriend?: (id: string, profile?: any) => void;
    onRemoveFriend?: (id: string) => void;
    onCall?: (id: string) => void;
    voiceRoomData: any;
    searchTimer: number;
}

export const MobileVoiceLayout = ({
    onLeave,
    history = [],
    friends = [],
    pendingRequests = [],
    sentRequests = [],
    onAcceptRequest,
    onDeclineRequest,
    onCancelRequest,
    onAddFriend,
    onRemoveFriend,
    onCall,
    voiceRoomData,
    searchTimer
}: MobileVoiceLayoutProps) => {
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
    } = voiceRoomData;

    const [activeDrawer, setActiveDrawer] = useState<'history' | 'community' | 'chat' | null>(null);
    const [selectedUserForOptions, setSelectedUserForOptions] = useState<any>(null);
    const [inputText, setInputText] = useState('');

    const { user: localUser } = useUser();
    const isConnected = callRoomState.is_connected;
    const isSearching = callRoomState.is_searching;
    const isMuted = callRoomState.is_muted;
    const partnerId = callRoomState.partner_user_id;


    // Prevent body scroll and rubber-banding
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
        return () => {
            document.body.style.overflow = originalStyle;
            document.body.style.touchAction = 'auto';
        };
    }, []);

    // Helper for friend status
    const isFriends = friends.some(f => f.id === partnerId);
    const pendingSent = sentRequests.some(r => (r.user?.id || r.target_user_id) === partnerId);
    const pendingReceived = pendingRequests.some(r => (r.user?.id || r.from_user_id) === partnerId);
    const requestId = pendingRequests.find(r => (r.user?.id || r.from_user_id) === partnerId)?.id;

    const handleSendMessage = () => {
        if (inputText.trim()) {
            actions.handleSendMessage(inputText, setInputText);
        }
    };

    return (
        <div className="fixed inset-0 bg-white flex flex-col z-[100] animate-in fade-in duration-500 overflow-hidden font-sans select-none">

            {/* Premium Background Blobs */}
            <div className="absolute top-[-10%] left-[-20%] w-[150%] h-[40%] bg-gradient-to-b from-zinc-50/50 to-transparent blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[20%] right-[-10%] w-64 h-64 bg-zinc-100/30 rounded-full blur-[80px] pointer-events-none" />

            {/* 1. Header Area */}
            <header className="relative z-50 h-16 flex items-center justify-between px-4">
                <button
                    onClick={onLeave}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-900 active:scale-90 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center">
                    <span style={{ fontFamily: "'Satisfy', cursive" }} className="text-xl font-bold text-zinc-900">nozorin</span>
                    <div className="flex items-center gap-1.5 ">
                        <div className={`w-1 h-1 rounded-full ${isConnected ? 'bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite]' : (isReconnecting || actions.matching.status === 'RECONNECTING') ? 'bg-pink-400 animate-[pulse_2s_ease-in-out_infinite]' : 'bg-zinc-300'}`} />
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest tabular-nums">
                            {isReconnecting || actions.matching.status === 'RECONNECTING' ? 'Reconnecting' : isConnected ? callDuration : isSearching ? 'Scanning' : 'Ready'}
                        </span>
                    </div>
                </div>

                <div className="w-10" />
            </header>

            {/* 2. Main Stage: Interaction Area */}
            <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
                <div className="relative mb-12">
                    {/* Ring Layers */}
                    {!isConnected && (
                        <>
                            <div className="absolute inset-0 rounded-full bg-pink-50/30 animate-[pulse_3s_ease-in-out_infinite] opacity-50 blur-sm pointer-events-none" />
                            <div className="absolute inset-[-15px] rounded-full border border-zinc-100 animate-[pulse_2s_ease-in-out_infinite] opacity-40 pointer-events-none" />
                        </>
                    )}

                    {/* Central Interaction Circle */}
                    <div
                        onClick={!isConnected && !isSearching ? handleNext : undefined}
                        className={`relative w-56 h-56 rounded-full flex items-center justify-center transition-all duration-700 active:scale-95 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.05)] ring-1 ring-zinc-100/50 backdrop-blur-sm ${!isConnected && !isSearching ? 'cursor-pointer' : ''}`}
                    >
                        {/* Background Layer */}
                        <div className="absolute inset-0 rounded-full bg-white/90 overflow-hidden">
                            {/* Subtle grid pattern inside */}
                            <div className="absolute inset-0 opacity-[0.015] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                        </div>

                        {/* Partner Avatar / Pulse Icon */}
                        <div className="relative z-10 w-full h-full p-1.5">
                            {isReconnecting || actions.matching.status === 'RECONNECTING' ? (
                                <div className="w-full h-full rounded-full bg-zinc-50/50 flex flex-col items-center justify-center animate-[pulse_2s_ease-in-out_infinite]">
                                    <div className="flex items-center gap-1 mb-2">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="w-1.5 h-1.5 bg-pink-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-black text-pink-400 uppercase tracking-[0.2em]">Syncing</span>
                                </div>
                            ) : isConnected ? (
                                <img
                                    src={getAvatarUrl(callRoomState.partner_avatar || callRoomState.partner_username)}
                                    alt="Partner"
                                    className="w-full h-full rounded-full object-cover animate-in zoom-in fade-in duration-700"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-white to-zinc-50/80 flex flex-col items-center justify-center">
                                    {isSearching ? (
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center gap-1 mb-3">
                                                {[1, 2, 3, 2, 1].map((h, i) => (
                                                    <div key={i} className="w-1 bg-pink-300 rounded-full animate-[pulse_1.5s_ease-in-out_infinite]" style={{ height: `${h * 4}px`, animationDelay: `${i * 0.1}s` }} />
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-black text-pink-400 uppercase tracking-[0.2em]">{actions.matching.status}</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 rounded-full border border-zinc-100/80 flex items-center justify-center mb-4 bg-white/50 backdrop-blur-sm">
                                                <div className="w-4 h-4 bg-pink-300/90 rounded-full shadow-[0_0_12px_rgba(244,114,182,0.4)] animate-[pulse_3s_ease-in-out_infinite]" />
                                            </div>
                                            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Tap to start</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Location Badge */}
                        {isConnected && callRoomState.partner_country && (
                            <div className="absolute top-2 right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-pink-50 z-30 animate-in zoom-in duration-500">
                                <ReactCountryFlag countryCode={callRoomState.partner_country} svg className="w-6 h-4" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Connection Details Card */}
                <div className={`w-full max-w-[320px] bg-white/80 backdrop-blur-xl rounded-[32px] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white transition-all duration-700 ${isConnected || isSearching ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                    <div className="flex flex-col items-center text-center">
                        <h3 className="text-lg font-bold text-zinc-900 mb-1 truncate w-full">
                            {isReconnecting || actions.matching.status === 'RECONNECTING' ? (
                                actions.matching.reconnectCountdown !== null ? `Partner reconnecting` : `Linking Session`
                            ) : isConnected ? (callRoomState.partner_username || 'Stranger') : 'In Position Queue'}
                        </h3>
                        <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-[0.2em] mb-4">
                            {isReconnecting || actions.matching.status === 'RECONNECTING' ? (
                                actions.matching.reconnectCountdown !== null ? `Awaiting return • ${actions.matching.reconnectCountdown}s` : `Restoring connection...`
                            ) : isConnected ? 'In Call' : (
                                actions.matching.position !== null ?
                                    `Queue Position: ${actions.matching.position} • Possible Match Time: ${Math.floor((actions.matching.position * 2) / 60)}:${((actions.matching.position * 2) % 60).toString().padStart(2, '0')}`
                                    : `Queue Position: Evaluating • Wait Time: ${Math.floor(searchTimer / 60)}:${(searchTimer % 60).toString().padStart(2, '0')}`
                            )}
                        </p>

                        <div className="flex items-center justify-center gap-2 w-full">
                            {/* Stop Button */}
                            {(isConnected || isSearching) && (
                                <button
                                    onClick={handleUserStop}
                                    className={isConnected
                                        ? "w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center bg-zinc-50 border border-zinc-100 text-zinc-600 active:scale-95 transition-all shadow-sm"
                                        : "flex-1 h-11 rounded-2xl flex items-center justify-center bg-zinc-100 border border-zinc-200 text-zinc-600 active:scale-95 transition-all shadow-sm text-[11px] font-black uppercase tracking-widest"
                                    }
                                >
                                    {isConnected ? <div className="w-3.5 h-3.5 bg-current rounded-sm" /> : 'Stop'}
                                </button>
                            )}

                            {/* Add Friend / Status Button */}
                            {isConnected && partnerId && (
                                <button
                                    onClick={() => {
                                        if (isFriends) return;
                                        if (pendingReceived && requestId && onAcceptRequest) onAcceptRequest(requestId);
                                        else if (!pendingSent && !pendingReceived && onAddFriend) {
                                            onAddFriend(partnerId, {
                                                id: partnerId,
                                                username: callRoomState.partner_username || 'Stranger',
                                                avatar: callRoomState.partner_avatar,
                                                country: callRoomState.partner_country
                                            });
                                        }
                                    }}
                                    className={`flex-1 h-11 rounded-2xl text-[11px] font-black uppercase tracking-wide transition-all shadow-sm flex items-center justify-center ${isFriends ? 'bg-emerald-50 text-emerald-600' :
                                        pendingReceived ? 'bg-pink-400 text-white animate-[pulse_2s_ease-in-out_infinite]' :
                                            pendingSent ? 'bg-zinc-50 text-zinc-300' :
                                                'bg-zinc-900 text-white'
                                        }`}
                                >
                                    {isFriends ? 'Friends' : pendingReceived ? 'Accept' : pendingSent ? 'Pending' : 'Add Friend'}
                                </button>
                            )}

                            {/* Next Button */}
                            {isConnected && (
                                <button
                                    onClick={handleNext}
                                    className="flex-1 h-11 bg-pink-50 border border-pink-100 text-pink-600 rounded-2xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm flex items-center justify-center"
                                >
                                    Next
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* 3. Bottom Action Bar */}
            <nav className="relative z-[60] pb-8 pt-4 px-6 bg-white/80 backdrop-blur-3xl border-t border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    {/* History Button */}
                    <button
                        onClick={() => setActiveDrawer('history')}
                        className="relative w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                        <History className="w-6 h-6" strokeWidth={2} />
                        {history.length > 0 && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-pink-500 rounded-full ring-2 ring-white" />}
                    </button>

                    {/* Friends Button */}
                    <button
                        onClick={() => setActiveDrawer('community')}
                        className="relative w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                        <Users className="w-6 h-6" strokeWidth={2} />
                        {(pendingRequests.length > 0) && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-pink-500 rounded-full ring-2 ring-white animate-pulse" />}
                    </button>
                </div>

                {/* Primary Mic Button */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-10">
                    <button
                        onClick={actions.handleToggleMute}
                        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 border-4 border-white ${isMuted ? 'bg-rose-500 text-white' : 'bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-pink-200'} active:scale-90`}
                    >
                        {isMuted ? <MicOff className="w-7 h-7" strokeWidth={2.5} /> : <Mic2 className="w-7 h-7" strokeWidth={2.5} />}
                    </button>
                </div>

                <div className="flex items-center gap-6">
                    {/* Chat Button */}
                    <button
                        onClick={() => setActiveDrawer('chat')}
                        className={`relative w-10 h-10 flex items-center justify-center transition-colors ${isConnected ? 'text-zinc-600 hover:text-pink-600' : 'text-zinc-200 pointer-events-none'}`}
                    >
                        <MessageCircle className="w-6 h-6" strokeWidth={2} />
                        {messages.length > 0 && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-pink-500 rounded-full ring-2 ring-white" />}
                    </button>

                    {/* Filter Button */}
                    <button
                        onClick={() => setActiveDrawer('filter' as any)}
                        className={`w-10 h-10 flex items-center justify-center transition-colors ${isSearching || !isConnected ? 'text-zinc-600 hover:text-pink-600' : 'text-zinc-200 pointer-events-none'}`}
                    >
                        <SlidersHorizontal className="w-6 h-6" strokeWidth={2} />
                        {voiceRoomData.selectedCountry !== 'GLOBAL' && (
                            <div className="absolute top-2 right-1.5 w-1.5 h-1.5 bg-pink-500 rounded-full ring-2 ring-white" />
                        )}
                    </button>
                </div>
            </nav>

            {/* 4. Drawers System */}
            {activeDrawer && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-[70] animate-in fade-in duration-300"
                        onClick={() => setActiveDrawer(null)}
                    />

                    {/* Drawer Content */}
                    <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] z-[80] h-[85vh] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.1)] border-t border-zinc-50 animate-in slide-in-from-bottom duration-500 overflow-hidden">
                        {/* Pull handle */}
                        <div className="flex justify-center pt-4 pb-2">
                            <div className="w-12 h-1.5 bg-zinc-100 rounded-full" />
                        </div>

                        {/* Title & Close */}
                        <div className="px-6 py-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-black text-zinc-900 uppercase tracking-widest">
                                    {activeDrawer === 'history' ? 'Recent Calls' : activeDrawer === 'community' ? 'Friends' : activeDrawer === ('filter' as any) ? 'Match Preferences' : activeDrawer === ('country-select' as any) ? 'Select Country' : 'Discussion'}
                                </h2>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-1">
                                    {activeDrawer === 'history' ? 'Review your recent conversations' :
                                        activeDrawer === 'community' ? 'Manage your friends' :
                                            activeDrawer === ('filter' as any) ? 'Select your preferred region' :
                                                activeDrawer === ('country-select' as any) ? 'Choose a specific location' :
                                                    'Stay connected with the community'}
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveDrawer(null)}
                                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-400 active:scale-90 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable List */}
                        <div className="flex-1 overflow-y-auto px-6 pb-12 scrollbar-hide touch-auto overscroll-contain">
                            {activeDrawer === ('filter' as any) && (
                                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-50 mb-6">
                                    <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
                                        Preferences take priority. If no matches are found for your selected country, we'll connect you with available users worldwide to keep you talking.
                                    </p>
                                </div>
                            )}
                            {activeDrawer === ('filter' as any) && (
                                <div className="space-y-8 pt-4">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Match with</h3>

                                        <div className="grid grid-cols-1 gap-3">
                                            <button
                                                onClick={() => {
                                                    voiceRoomData.setSelectedCountry('GLOBAL');
                                                    setActiveDrawer(null);
                                                }}
                                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${voiceRoomData.selectedCountry === 'GLOBAL'
                                                    ? 'bg-pink-50 border-pink-200 text-pink-600'
                                                    : 'bg-zinc-50 border-zinc-100 text-zinc-600'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">🌍</span>
                                                    <span className="text-sm font-bold">Global / Everyone</span>
                                                </div>
                                                {voiceRoomData.selectedCountry === 'GLOBAL' && (
                                                    <div className="w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                                                        <div className="w-2 h-2 bg-white rounded-full" />
                                                    </div>
                                                )}
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setActiveDrawer('country-select' as any);
                                                }}
                                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${voiceRoomData.selectedCountry !== 'GLOBAL'
                                                    ? 'bg-pink-50 border-pink-200 text-pink-600'
                                                    : 'bg-zinc-50 border-zinc-100 text-zinc-600'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {voiceRoomData.selectedCountry !== 'GLOBAL' ? (
                                                        <ReactCountryFlag countryCode={voiceRoomData.selectedCountry} svg className="w-5 h-5 rounded-sm" />
                                                    ) : (
                                                        <span className="text-xl">🏳️</span>
                                                    )}
                                                    <span className="text-sm font-bold">
                                                        {voiceRoomData.selectedCountry !== 'GLOBAL' ? `Country: ${voiceRoomData.selectedCountry}` : 'Select Country'}
                                                    </span>
                                                </div>
                                                <ChevronDown className="w-4 h-4 text-zinc-400" />
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            )}

                            {activeDrawer === ('country-select' as any) && (
                                <CountrySelectView
                                    currentCountry={voiceRoomData.selectedCountry}
                                    onSelect={(code) => {
                                        voiceRoomData.setSelectedCountry(code);
                                        setActiveDrawer('filter' as any);
                                    }}
                                    onBack={() => setActiveDrawer('filter' as any)}
                                />
                            )}

                            {activeDrawer === 'history' && (
                                <div className="space-y-6">
                                    {history.length > 0 ? history.map((item: any, idx: number) => (
                                        <HistoryItem
                                            key={item.session_id || item.id || `history-${idx}`}
                                            item={item}
                                            friends={friends}
                                            sentRequests={sentRequests}
                                            pendingRequests={pendingRequests}
                                            onSelectOptions={setSelectedUserForOptions}
                                            onCall={onCall}
                                            isBusy={isConnected}
                                        />
                                    )) : (
                                        <EmptyState icon={History} title="No calls yet" subtitle="Your match history will appear here once you start talking." />
                                    )}
                                </div>
                            )}

                            {activeDrawer === 'community' && (
                                <CommunityView
                                    friends={friends}
                                    pendingRequests={pendingRequests}
                                    sentRequests={sentRequests}
                                    onSelectOptions={setSelectedUserForOptions}
                                    onCall={onCall}
                                    isBusy={isConnected}
                                />
                            )}

                            {activeDrawer === 'chat' && (
                                <ChatView
                                    messages={messages}
                                    onSend={handleSendMessage}
                                    inputText={inputText}
                                    setInputText={setInputText}
                                    messagesEndRef={messagesEndRef}
                                />
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* 5. User Options Drawer */}
            {selectedUserForOptions && (
                <UserOptionsDrawer
                    user={selectedUserForOptions}
                    onClose={() => setSelectedUserForOptions(null)}
                    onAccept={onAcceptRequest}
                    onDecline={onDeclineRequest}
                    onCancel={onCancelRequest}
                    onRemove={onRemoveFriend}
                    onAdd={onAddFriend}
                    onCall={onCall}
                    isBusy={isConnected}
                />
            )}

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

// --- Subcomponents for Drawers ---

const HistoryItem = ({ item, friends, sentRequests, pendingRequests, onSelectOptions, onCall, isBusy }: any) => {
    const profile = item.partnerProfile || item.peerProfile || {};
    const userId = item.partner_id || item.peer_user_id || profile.id;
    const isFriend = friends.some((f: any) => f.id === userId);
    const sentReq = sentRequests.find((r: any) => (r.user?.id || r.target_user_id) === userId);
    const receivedReq = pendingRequests.find((r: any) => (r.user?.id || r.from_user_id) === userId);
    const isPendingSent = !!sentReq;
    const isPendingReceived = !!receivedReq;
    const requestId = sentReq?.id || receivedReq?.id;

    return (
        <div
            onClick={() => onSelectOptions({
                id: userId,
                requestId,
                username: item.partner_username || profile.username || 'Unknown',
                avatar: item.partner_avatar || profile.avatar,
                isFriend,
                isPendingSent,
                isPendingReceived,
                status: isFriend ? 'Friend' : isPendingSent ? 'Request Sent' : isPendingReceived ? 'Request Received' : 'Stranger'
            })}
            className="flex items-center justify-between group animate-in slide-in-from-right-4 duration-300 active:opacity-60 transition-all cursor-pointer"
        >
            <div className="flex items-center gap-4">
                <div className="relative">
                    <img
                        src={getAvatarUrl(item.partner_avatar || profile.avatar)}
                        alt="Avatar"
                        className="w-12 h-12 rounded-[20px] object-cover border border-zinc-100 shadow-sm"
                    />
                    {item.partner_status?.is_online && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />}
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-900">{item.partner_username || profile.username || 'Unknown'}</span>
                        <ReactCountryFlag countryCode={item.partner_country || profile.country || 'US'} svg className="w-3.5 h-2.5 opacity-60 rounded-[1px]" />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-zinc-400" />
                            <span className="text-[10px] font-bold text-zinc-500 tabular-nums uppercase tracking-tighter">
                                {Math.floor((item.duration || 0) / 60)}m {(item.duration || 0) % 60}s
                            </span>
                        </div>
                        <span className="text-zinc-200 text-[10px]"> • </span>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{formatDate(item.created_at)}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {isFriend ? (
                    <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                        <UserCheck className="w-4 h-4" />
                    </div>
                ) : isPendingSent ? (
                    <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-50 text-zinc-400">
                        <Clock className="w-4 h-4" />
                    </div>
                ) : isPendingReceived ? (
                    <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-pink-100 text-pink-500 animate-pulse">
                        <UserPlus className="w-4 h-4" />
                    </div>
                ) : (
                    <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-50 text-zinc-400">
                        <Plus className="w-4 h-4" />
                    </div>
                )}
            </div>
        </div>
    );
};

const CommunityView = ({ friends, pendingRequests, sentRequests, onSelectOptions, onCall, isBusy }: any) => {
    const [tab, setTab] = useState<'friends' | 'pending'>('friends');

    return (
        <div className="flex flex-col h-full">
            <div className="flex gap-4 mb-8">
                {['friends', 'pending'].map((t: any) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`text-[11px] font-black uppercase tracking-widest transition-all ${tab === t ? 'text-pink-600' : 'text-zinc-400'}`}
                    >
                        {t}
                        {tab === t && <div className="h-0.5 bg-pink-600 mt-1.5 rounded-full" />}
                    </button>
                ))}
            </div>

            <div className="space-y-6">
                {tab === 'friends' ? (
                    friends.length > 0 ? friends.map((f: any, idx: number) => (
                        <div
                            key={f.id || `friend-${idx}`}
                            onClick={() => onSelectOptions({
                                id: f.id,
                                username: f.username,
                                avatar: f.avatar,
                                isFriend: true,
                                status: 'Friend'
                            })}
                            className="flex items-center justify-between animate-in slide-in-from-right-4 duration-300 active:opacity-60 transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <img src={getAvatarUrl(f.avatar)} alt={f.username} className="w-12 h-12 rounded-[20px] object-cover border border-zinc-100 shadow-sm" />
                                    {f.is_online && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-zinc-900">{f.username}</span>
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{f.is_online ? 'Active now' : 'Recent'}</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    )) : <EmptyState icon={Users} title="Friendly neighborhood" subtitle="Your confirmed friends will be listed here." />
                ) : (
                    <div className="space-y-8">
                        {pendingRequests.length > 0 && (
                            <div>
                                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Received Requests</h3>
                                <div className="space-y-4">
                                    {pendingRequests.map((req: any, idx: number) => (
                                        <div
                                            key={req.id || `pending-${idx}`}
                                            onClick={() => onSelectOptions({
                                                id: req.user?.id,
                                                requestId: req.id,
                                                username: req.user?.username,
                                                avatar: req.user?.avatar,
                                                isPendingReceived: true,
                                                status: 'Request Received'
                                            })}
                                            className="flex items-center justify-between animate-in slide-in-from-right-4 duration-300 active:opacity-60 transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <img src={getAvatarUrl(req.user?.avatar)} alt="" className="w-10 h-10 rounded-2xl object-cover" />
                                                <span className="text-sm font-bold text-zinc-900">{req.user?.username}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-pink-100 text-pink-500 animate-pulse">
                                                    <UserPlus className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {sentRequests.length > 0 && (
                            <div>
                                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Sent by You</h3>
                                <div className="space-y-4">
                                    {sentRequests.map((req: any, idx: number) => (
                                        <div
                                            key={req.id || `sent-${idx}`}
                                            onClick={() => onSelectOptions({
                                                id: req.user?.id,
                                                requestId: req.id,
                                                username: req.user?.username,
                                                avatar: req.user?.avatar,
                                                isPendingSent: true,
                                                status: 'Request Sent'
                                            })}
                                            className="flex items-center justify-between opacity-70 active:opacity-40 transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <img src={getAvatarUrl(req.user?.avatar)} alt="" className="w-10 h-10 rounded-2xl object-cover grayscale" />
                                                <span className="text-sm font-bold text-zinc-600">{req.user?.username}</span>
                                            </div>
                                            <div className="px-3 py-1.5 bg-zinc-50 text-zinc-400 text-[9px] font-black uppercase tracking-widest rounded-xl">Pending</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {pendingRequests.length === 0 && sentRequests.length === 0 && <EmptyState icon={Clock} title="No pending" subtitle="Future connections waiting for response." />}
                    </div>
                )}
            </div>
        </div>
    );
};

const ChatView = ({ messages, onSend, inputText, setInputText, messagesEndRef }: any) => {
    return (
        <div className="flex flex-col h-[50vh]">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-hide touch-auto">
                {messages.length > 0 ? messages.map((m: any, i: number) => (
                    <div key={i} className={`flex ${m.isSelf ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm font-medium ${m.isSelf ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-900 border border-zinc-100 shadow-sm'}`}>
                            {m.message}
                        </div>
                    </div>
                )) : <EmptyState icon={MessageCircle} title="Safe space" subtitle="Chat messages in this call will appear here." />}
                <div ref={messagesEndRef} />
            </div>
            <div className="bg-zinc-50 rounded-3xl p-2.5 flex items-center gap-2 border border-zinc-100 shadow-inner">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSend()}
                    placeholder="Message..."
                    className="flex-1 bg-transparent px-3 text-sm focus:outline-none"
                />
                <button
                    onClick={onSend}
                    disabled={!inputText.trim()}
                    className={`h-9 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${inputText.trim() ? 'bg-pink-500 text-white shadow-lg shadow-pink-200' : 'bg-zinc-200 text-zinc-400 opacity-50'}`}
                >
                    Send
                </button>
            </div>
        </div>
    );
}

const EmptyState = ({ icon: Icon, title, subtitle }: any) => (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-in fade-in duration-700">
        <div className="w-16 h-16 rounded-3xl bg-zinc-50 flex items-center justify-center mb-6">
            <Icon className="w-8 h-8 text-zinc-200" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-bold text-zinc-900 mb-2">{title}</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">{subtitle}</p>
    </div>
);

const formatDate = (ts: any) => {
    if (!ts) return 'Recent';
    const date = new Date(ts);
    const diff = Date.now() - date.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
};

const CountrySelectView = ({ currentCountry, onSelect, onBack }: { currentCountry: string, onSelect: (code: string) => void, onBack: () => void }) => {
    const countries = [
        { code: 'PH', name: 'Philippines' },
        { code: 'US', name: 'United States' },
        { code: 'ID', name: 'Indonesia' },
        { code: 'VN', name: 'Vietnam' },
        { code: 'MY', name: 'Malaysia' },
        { code: 'TH', name: 'Thailand' },
        { code: 'SG', name: 'Singapore' },
        { code: 'JP', name: 'Japan' },
        { code: 'KR', name: 'South Korea' },
        { code: 'BR', name: 'Brazil' },
        { code: 'MX', name: 'Mexico' },
        { code: 'IN', name: 'India' },
        { code: 'GB', name: 'United Kingdom' },
        { code: 'FR', name: 'France' },
        { code: 'DE', name: 'Germany' },
        { code: 'ES', name: 'Spain' },
        { code: 'IT', name: 'Italy' },
        { code: 'RU', name: 'Russia' },
        { code: 'TR', name: 'Turkey' },
        { code: 'NG', name: 'Nigeria' },
        { code: 'ZA', name: 'South Africa' },
        { code: 'AU', name: 'Australia' },
        { code: 'CA', name: 'Canada' },
    ].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="flex flex-col h-full space-y-4 pt-2">
            <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 transition-colors py-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Back</span>
            </button>

            <div className="space-y-2 pb-10">
                {countries.map((c) => (
                    <button
                        key={c.code}
                        onClick={() => onSelect(c.code)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${currentCountry === c.code
                            ? 'bg-pink-50 border-pink-200 text-pink-600'
                            : 'bg-white border-zinc-50 text-zinc-600 hover:border-zinc-200'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <ReactCountryFlag countryCode={c.code} svg className="w-5 h-4 rounded-sm" />
                            <span className="text-sm font-bold">{c.name}</span>
                        </div>
                        {currentCountry === c.code && <div className="w-2 h-2 bg-pink-500 rounded-full" />}
                    </button>
                ))}
            </div>
        </div>
    );
};

const UserOptionsDrawer = ({ user, onClose, onAccept, onDecline, onCancel, onRemove, onAdd, onCall, isBusy }: any) => {
    if (!user) return null;

    const isFriend = user.isFriend;
    const isPendingSent = user.isPendingSent;
    const isPendingReceived = user.isPendingReceived;

    return (
        <div className="fixed inset-0 z-[110] flex flex-col justify-end">
            <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
            <div className="relative bg-white rounded-t-[40px] p-6 pb-12 animate-in slide-in-from-bottom duration-500 shadow-2xl border-t border-zinc-100 max-h-[85vh] flex flex-col overflow-hidden">
                <div className="flex justify-center mb-6 shrink-0">
                    <div className="w-12 h-1.5 bg-zinc-100 rounded-full" />
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain">
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative">
                            <img src={getAvatarUrl(user.avatar)} className="w-20 h-20 rounded-[32px] border-4 border-zinc-50 shadow-sm mb-4 object-cover" />
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center border border-zinc-100 shadow-sm">
                                {isFriend ? <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Plus className="w-3.5 h-3.5 text-zinc-400" />}
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-zinc-900">{user.username}</h3>
                        <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em] mt-1">{user.status}</p>
                    </div>

                    <div className="grid gap-3">
                        {isPendingReceived && (
                            <>
                                <button onClick={() => { onAccept?.(user.requestId); onClose(); }} className="w-full h-14 bg-pink-500 text-white rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-lg shadow-pink-200">
                                    <UserCheck className="w-5 h-5" />
                                    <span className="font-black uppercase tracking-widest text-[11px]">Accept Friend Request</span>
                                </button>
                                <button onClick={() => { onDecline?.(user.requestId); onClose(); }} className="w-full h-14 bg-zinc-50 text-zinc-500 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
                                    <Trash2 className="w-5 h-5" />
                                    <span className="font-black uppercase tracking-widest text-[11px]">Decline Request</span>
                                </button>
                            </>
                        )}

                        {(isFriend || (!isPendingSent && !isPendingReceived)) && (
                            <button onClick={() => { onCall?.(user.id); onClose(); }} disabled={isBusy} className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all ${isBusy ? 'bg-zinc-50 text-zinc-200 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-200/50'}`}>
                                <Phone className="w-5 h-5 fill-current" />
                                <span className="font-black uppercase tracking-widest text-[11px]">Start Voice Call</span>
                            </button>
                        )}

                        {isFriend && (
                            <button onClick={() => { onRemove?.(user.id); onClose(); }} className="w-full h-14 bg-zinc-50 text-rose-500 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
                                <UserMinus className="w-5 h-5" />
                                <span className="font-black uppercase tracking-widest text-[11px]">Remove Friend</span>
                            </button>
                        )}

                        {isPendingSent && (
                            <button onClick={() => { onCancel?.(user.requestId); onClose(); }} className="w-full h-14 bg-zinc-50 text-rose-500 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
                                <Trash2 className="w-5 h-5" />
                                <span className="font-black uppercase tracking-widest text-[11px]">Cancel Sent Request</span>
                            </button>
                        )}

                        {!isFriend && !isPendingSent && !isPendingReceived && (
                            <button onClick={() => { onAdd?.(user.id, user); onClose(); }} className="w-full h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-zinc-200 mt-2">
                                <UserPlus className="w-5 h-5" />
                                <span className="font-black uppercase tracking-widest text-[11px]">Add Friend</span>
                            </button>
                        )}

                        <button onClick={onClose} className="w-full h-14 flex items-center justify-center text-zinc-400 font-bold text-xs uppercase tracking-widest">
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
