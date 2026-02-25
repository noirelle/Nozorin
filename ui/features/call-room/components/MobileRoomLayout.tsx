import React from 'react';
import { RoomLayoutProps } from '../types';
import { RoomNavbar } from '../../../components/RoomNavbar';
import ChatBox from './ChatBox';
import ReactCountryFlag from "react-country-flag";
import { useUser } from '../../../hooks';

export const MobileRoomLayout: React.FC<RoomLayoutProps> = ({
    callRoomState,
    partnerIsMuted,
    showChat,
    messages,
    remoteAudioRef,
    onStop,
    onNext,
    onToggleMute,
    onSendMessage,
    setShowChat,
    filtersOpen,
    setFiltersOpen,
    onNavigateToHistory,
    onNavigateToFriends,
    onAddFriend,
    friends = [],
    pendingRequests = [],
    sentRequests = [],
    selectedCountry,
    matchmakingStatus,
    queuePosition,
    isReconnecting,
    reconnectCountdown,
    callDuration,
}) => {
    const { is_connected, is_searching, partner_country, partner_country_code, partner_username, partner_avatar, partner_gender, partner_user_id, is_muted } = callRoomState;
    const { user: localUser } = useUser();

    return (
        <div className="lg:hidden flex flex-col w-full h-screen bg-white relative overflow-hidden font-sans text-[#7C6367]">
            {/* Soft White-to-Pink Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-[#FFF9FA] to-[#FFEBF0] pointer-events-none" />

            {/* Subtle light grey grid pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Ambient Background Blobs */}
            <div className="absolute top-[-5%] left-[-10%] w-64 h-64 bg-[#FFE4E9] rounded-full blur-[90px] opacity-40 pointer-events-none" />
            <div className="absolute bottom-[20%] right-[-15%] w-80 h-80 bg-[#FFD6E0] rounded-full blur-[110px] opacity-30 pointer-events-none" />

            {/* Header */}
            <div className="relative z-50">
                <RoomNavbar
                    onNavigateToHistory={onNavigateToHistory}
                    variant="mobile"
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32 relative z-10">

                {/* Large Pulsing Connect Button */}
                <div className="relative mb-12">
                    {/* Pulse Layers - Only when searching or idle */}
                    {!is_connected && (
                        <>
                            <div className="absolute inset-0 rounded-full bg-[#FFB7CE] animate-ping opacity-20" style={{ animationDuration: '3s' }} />
                            <div className="absolute inset-0 rounded-full scale-110 bg-[#FFB7CE] animate-pulse opacity-10" style={{ animationDuration: '4s' }} />
                        </>
                    )}

                    <button
                        onClick={is_connected ? onNext : (is_searching ? onStop : onNext)}
                        disabled={callRoomState.permission_denied}
                        className={`
                            relative w-56 h-56 rounded-full flex flex-col items-center justify-center transition-all duration-500
                            shadow-[0_20px_40px_-10px_rgba(255,183,206,0.3),inset_0_4px_12px_rgba(255,255,255,0.4)]
                            group disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale-[0.5]
                            ${!callRoomState.permission_denied ? 'active:scale-95' : ''}
                            ${is_connected
                                ? 'bg-gradient-to-br from-[#FF9EB5] to-[#FF7597]'
                                : 'bg-gradient-to-br from-[#FFC2D1] to-[#FF8BA7]'}
                        `}
                    >
                        {/* Inner soft shadow overlay */}
                        <div className="absolute inset-0 rounded-full shadow-[inset_0_-8px_20px_rgba(0,0,0,0.03)] pointer-events-none" />

                        {is_searching ? (
                            <div className="flex flex-col items-center">
                                <div className="relative w-12 h-12 mb-4">
                                    <div className="absolute inset-0 border-4 border-white/20 rounded-full" />
                                    {matchmakingStatus === 'FINDING' && (
                                        <div className="absolute inset-0 border-4 border-t-white rounded-full animate-spin" />
                                    )}
                                </div>
                                <span className="text-white font-semibold tracking-widest text-[10px] uppercase">
                                    {queuePosition ? `Position: ${queuePosition}` : (matchmakingStatus === 'CONNECTING' || matchmakingStatus === 'IDLE' ? 'Connecting...' : 'Searching...')}
                                </span>
                            </div>
                        ) : is_connected ? (
                            <div className="flex flex-col items-center animate-in zoom-in duration-500">
                                <div className="flex items-center gap-1.5 h-8 mb-4">
                                    {[1, 2, 3, 4, 3, 2, 1].map((h, i) => (
                                        <div
                                            key={i}
                                            className="w-1.5 bg-white rounded-full transition-all duration-300"
                                            style={{
                                                height: `${Math.max(10, Math.random() * 32)}px`,
                                                animation: `bounce 1.2s ease-in-out infinite ${i * 0.1}s`
                                            }}
                                        />
                                    ))}
                                </div>
                                <span className="text-white font-bold tracking-[0.2em] text-[20px] mb-1">{callDuration}</span>
                                <span className="text-white font-bold tracking-widest text-[9px] uppercase opacity-80">Skip to Next</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-white/30">
                                    {callRoomState.permission_denied ? (
                                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3l14 9-14 9V3z" />
                                        </svg>
                                    )}
                                </div>
                                <span className="text-white font-bold tracking-widest text-[11px] uppercase">
                                    {callRoomState.permission_denied ? 'Blocked' : 'Tap to Connect'}
                                </span>
                            </div>
                        )}
                    </button>
                </div>

                {/* Connection Card */}
                <div className="w-full max-w-sm bg-white/70 backdrop-blur-xl rounded-[28px] p-5 shadow-[0_10px_30px_rgba(255,183,206,0.15)] border border-white">
                    <div className="flex flex-col gap-4">
                        {/* Local User Section */}
                        <div className="flex items-center justify-between bg-white/60 p-3 rounded-2xl border border-pink-50/50">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-[#FFE4E9] p-0.5 border-2 border-white shadow-sm">
                                        <img src={localUser?.avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=Alex&backgroundColor=transparent`} alt="Me" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full shadow-sm" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[#5C4E50]">{localUser?.username || 'Alex'} (You)</h4>
                                    <div className={`mt-0.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${is_muted ? 'bg-rose-100 text-rose-500' : 'bg-[#E7F9F3] text-emerald-600'}`}>
                                        {is_muted ? 'Muted' : 'Mic On'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-[10px] font-bold text-[#A58E92] tracking-tighter uppercase px-2 py-1 bg-white/80 rounded-lg">Local</div>
                            </div>
                        </div>

                        {/* Partner Section (Dynamic) */}
                        <div className="relative overflow-hidden min-h-[72px] flex items-center bg-pink-50/30 rounded-2xl border border-pink-100/20 transition-all duration-700">
                            {isReconnecting ? (
                                <div className="w-full p-3 flex items-center justify-between animate-in fade-in duration-500">
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-12 h-12 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center shadow-sm">
                                            <svg className="w-5 h-5 text-amber-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-amber-700">Reconnecting...</h4>
                                            <p className="text-[10px] text-amber-500 font-medium tracking-tight">
                                                {reconnectCountdown ? `${reconnectCountdown}s remaining` : 'Restoring session'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="px-2 py-1 bg-amber-100 text-amber-600 text-[9px] font-bold rounded-lg uppercase tracking-wider">Wait</div>
                                </div>
                            ) : is_connected ? (
                                <div className="w-full p-3 flex items-center justify-between animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#FFE4E9] p-0.5 border-2 border-white shadow-sm">
                                            <img src={partner_avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=Partner&backgroundColor=transparent`} alt="Partner" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-bold text-[#5C4E50]">{partner_username || 'Stranger'}</h4>
                                                {partner_gender && (
                                                    <span className={`text-[9px] px-1 py-0.5 rounded-md font-bold uppercase tracking-wider ${partner_gender === 'male' ? 'bg-blue-50 text-blue-500' : partner_gender === 'female' ? 'bg-pink-50 text-pink-500' : 'bg-slate-50 text-slate-500'}`}>
                                                        {partner_gender === 'male' ? '♂' : partner_gender === 'female' ? '♀' : partner_gender}
                                                    </span>
                                                )}
                                                {partner_country_code && (
                                                    <ReactCountryFlag countryCode={partner_country_code} svg className="w-4 h-3 rounded-sm object-cover" />
                                                )}
                                            </div>
                                            <p className="text-[10px] text-[#A58E92] font-medium tracking-tight">{partner_country || 'Unknown Location'}</p>
                                        </div>
                                    </div>
                                    {partner_user_id && (
                                        <button
                                            onClick={() => onAddFriend && onAddFriend(partner_user_id)}
                                            disabled={
                                                callRoomState.friendship_status === 'friends' ||
                                                friends.some(f => f.id === partner_user_id) ||
                                                pendingRequests?.some(r => r.user?.id === partner_user_id) ||
                                                sentRequests?.some(r => r.user?.id === partner_user_id)
                                            }
                                            className={`px-3 py-1.5 text-white text-[10px] font-bold rounded-xl transition-colors shadow-sm ${(callRoomState.friendship_status === 'friends' || friends.some(f => f.id === partner_user_id))
                                                ? 'bg-emerald-500 hover:bg-emerald-600'
                                                : (pendingRequests?.some(r => r.user?.id === partner_user_id) || sentRequests?.some(r => r.user?.id === partner_user_id))
                                                    ? 'bg-slate-400 cursor-not-allowed'
                                                    : 'bg-[#FF8BA7] hover:bg-[#FF7597]'
                                                }`}
                                        >
                                            {(callRoomState.friendship_status === 'friends' || friends.some(f => f.id === partner_user_id))
                                                ? 'FRIENDS'
                                                : (pendingRequests?.some(r => r.user?.id === partner_user_id) || sentRequests?.some(r => r.user?.id === partner_user_id))
                                                    ? 'PENDING'
                                                    : 'ADD FRIEND'}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full flex flex-col items-center justify-center py-4 opacity-40">
                                    <div className="flex gap-1.5 items-center">
                                        <div className="w-1.5 h-1.5 bg-[#FF8BA7] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                        <div className="w-1.5 h-1.5 bg-[#FF8BA7] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                        <div className="w-1.5 h-1.5 bg-[#FF8BA7] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                    </div>
                                    <span className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[#A58E92]">
                                        {matchmakingStatus === 'CONNECTING' || (is_searching && matchmakingStatus === 'IDLE') ? 'Connecting to server...' : 'Waiting for partner'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Floating Bar */}
            <div className="fixed bottom-8 left-6 right-6 z-[60] flex flex-col gap-3">
                {callRoomState.permission_denied && (
                    <div className="bg-rose-50 border border-rose-100 px-5 py-3 rounded-2xl flex items-center justify-center gap-2.5 animate-in slide-in-from-bottom-4 duration-500 shadow-sm self-center w-full">
                        <svg className="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-[10px] font-bold text-rose-600 tracking-tight">Mic permission required to start.</span>
                    </div>
                )}
                <div className="bg-white/90 backdrop-blur-2xl rounded-[32px] p-3 shadow-[0_15px_35px_-10px_rgba(255,183,206,0.25)] border border-white flex items-center justify-between px-6">
                    {/* Left Icons */}
                    <div className="flex items-center gap-5">
                        <button
                            onClick={onNavigateToHistory}
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-[#7C6367] hover:bg-pink-50 transition-colors"
                        >
                            <svg className="w-5 h-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                        <button
                            onClick={onNavigateToFriends}
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-[#7C6367] hover:bg-pink-50 transition-colors"
                        >
                            <svg className="w-5 h-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </button>
                    </div>

                    {/* Elevated Center Mic Button */}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-6">
                        <button
                            onClick={onToggleMute}
                            className={`
                                w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300
                                border-4 border-white shadow-2xl
                                ${is_muted
                                    ? 'bg-rose-500 text-white shadow-rose-200'
                                    : 'bg-gradient-to-br from-[#FF9EB5] to-[#FF7597] text-white shadow-pink-200'}
                                hover:scale-105 active:scale-90
                            `}
                        >
                            {is_muted ? (
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3l18 18" />
                                </svg>
                            ) : (
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Right Icons */}
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => setShowChat(!showChat)}
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors relative ${showChat ? 'bg-pink-100 text-[#FF7597]' : 'text-[#7C6367] hover:bg-pink-50'}`}
                        >
                            <svg className="w-5 h-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            {messages.length > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                            )}
                        </button>
                        <button
                            onClick={() => setFiltersOpen && setFiltersOpen(!filtersOpen)}
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-[#7C6367] hover:bg-pink-50 transition-colors"
                        >
                            <svg className="w-5 h-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Chat Popover */}
            <div className={`fixed bottom-32 left-6 right-6 z-[70] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${showChat ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95 pointer-events-none'}`}>
                <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] border border-white shadow-[0_25px_60px_-15px_rgba(255,183,206,0.4)] h-[55vh] flex flex-col overflow-hidden">
                    <div className="px-6 py-4 border-b border-pink-50 bg-white/50 flex justify-between items-center">
                        <div>
                            <span className="font-bold text-[#5C4E50] text-[15px]">Channel Chat</span>
                            <div className="flex items-center gap-1.5 ">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                <span className="text-[10px] text-[#A58E92] font-semibold tracking-wide uppercase">Live now</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowChat(false)}
                            className="p-2 hover:bg-pink-50 rounded-xl transition-colors text-[#A58E92]"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-1 overflow-hidden p-2">
                        <ChatBox
                            messages={messages}
                            onSendMessage={onSendMessage}
                            isConnected={is_connected}
                            minimal={true}
                            showScrollbar={true}
                            theme="light"
                        />
                    </div>
                </div>
            </div>

            {/* Audio Component */}
            <audio ref={remoteAudioRef} autoPlay />

            {/* Custom Animations Style */}
            <style jsx>{`
                @keyframes bounce {
                    0%, 100% { transform: scaleY(1); }
                    50% { transform: scaleY(2); }
                }
            `}</style>
        </div>
    );
};


