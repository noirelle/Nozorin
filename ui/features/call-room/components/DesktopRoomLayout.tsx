import React from 'react';
import { RoomLayoutProps } from '../types';
import ChatBox from './ChatBox';
import { RoomNavbar } from '../../../components/RoomNavbar';
import ReactCountryFlag from "react-country-flag";
import { useUser } from '../../../hooks';

export const DesktopRoomLayout: React.FC<RoomLayoutProps> = ({
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
    selectedCountry,
    queuePosition,
    isReconnecting,
    reconnectCountdown,
}) => {
    const { isConnected, isSearching, partnerCountry, partnerCountryCode, partnerUsername, partnerAvatar, isMuted } = callRoomState;
    const { user: localUser } = useUser();

    return (
        <div className="hidden lg:flex flex-col w-full h-screen bg-white relative overflow-hidden font-sans text-[#7C6367]">
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
            <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#FFE4E9] rounded-full blur-[100px] opacity-40 pointer-events-none" />
            <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] bg-[#FFD6E0] rounded-full blur-[120px] opacity-30 pointer-events-none" />

            {/* Header */}
            <div className="relative z-50">
                <RoomNavbar
                    onNavigateToHistory={onNavigateToHistory}
                    variant="desktop"
                />
            </div>

            {/* Main Interactive Stage */}
            <div className="flex-1 flex flex-col items-center justify-center pb-32 relative z-10 w-full max-w-6xl mx-auto px-8">

                {/* Visual Symmetry Container */}
                <div className="flex items-center justify-center gap-[100px] w-full">

                    {/* Left Side: Local Status Identity Block */}
                    <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-left-6 duration-700">
                        <div className="relative mb-4 group">
                            <div className="w-32 h-32 rounded-full overflow-hidden bg-[#FFE4E9] p-1 border-4 border-white shadow-[0_8px_20px_rgba(255,183,206,0.12)] transition-all duration-500 group-hover:shadow-[0_12px_30px_rgba(255,183,206,0.2)] group-hover:scale-[1.02]">
                                <img src={localUser?.avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=Alex&backgroundColor=transparent`} alt="Me" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute bottom-1 right-1 w-7 h-7 bg-green-400 border-4 border-white rounded-full shadow-sm" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-lg font-bold text-[#5C4E50]">{localUser?.username || 'Alex'} (You)</h4>
                            <div className={`flex items-center justify-center gap-1.5 transition-colors ${isMuted ? 'text-rose-400' : 'text-emerald-500'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full bg-current ${!isMuted && 'animate-pulse'}`} />
                                <span className="text-[10px] font-bold uppercase tracking-[0.15em]">{isMuted ? 'Muted' : 'Speaking'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Center: Connect / Action Circle (Balanced Dominance) */}
                    <div className="shrink-0 relative">
                        {/* Subtle Pulse layers */}
                        {!isConnected && (
                            <div className="absolute inset-0">
                                <div className="absolute inset-[-15%] rounded-full bg-[#FFB7CE] animate-ping opacity-5" style={{ animationDuration: '5s' }} />
                                <div className="absolute inset-[-8%] rounded-full bg-[#FFB7CE] animate-pulse opacity-5 shadow-[0_0_30px_rgba(255,183,206,0.05)]" />
                            </div>
                        )}

                        <button
                            onClick={isConnected ? onNext : (isSearching ? onStop : onNext)}
                            className={`
                                relative w-64 h-64 rounded-full flex flex-col items-center justify-center transition-all duration-700
                                shadow-[0_30px_60px_-15px_rgba(255,183,206,0.35),inset_0_4px_16px_rgba(255,255,255,0.4)]
                                active:scale-95 group
                                ${isConnected
                                    ? 'bg-gradient-to-br from-[#FF9EB5] to-[#FF7597] border-[8px] border-white/20'
                                    : 'bg-gradient-to-br from-[#FFC2D1] to-[#FF8BA7] border-[8px] border-white'}
                            `}
                        >
                            <div className="absolute inset-0 rounded-full shadow-[inset_0_-12px_32px_rgba(0,0,0,0.02)] pointer-events-none" />

                            {isSearching ? (
                                <div className="flex flex-col items-center">
                                    <div className="relative w-16 h-16 mb-6">
                                        <div className="absolute inset-0 border-4 border-white/20 rounded-full" />
                                        <div className="absolute inset-0 border-4 border-t-white rounded-full animate-spin" />
                                        <div className="absolute inset-4 bg-white/10 rounded-full animate-pulse" />
                                    </div>
                                    <span className="text-white font-bold tracking-[0.2em] text-[11px] uppercase opacity-90 drop-shadow-sm">
                                        {queuePosition ? `POS: ${queuePosition}` : 'Scanner'}
                                    </span>
                                </div>
                            ) : isConnected ? (
                                <div className="flex flex-col items-center animate-in zoom-in duration-700 px-8 text-center">
                                    <div className="flex items-end gap-1.5 h-12 mb-6">
                                        {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                                            <div
                                                key={i}
                                                className="w-2 bg-white rounded-full"
                                                style={{
                                                    height: `${Math.max(12, Math.random() * 45)}px`,
                                                    animation: `bounce 1.2s ease-in-out infinite ${i * 0.1}s`
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-white font-bold tracking-[0.25em] text-[14px] uppercase opacity-90 drop-shadow-sm">Next</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-6 border border-white/30 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                        <svg className="w-8 h-8 text-white fill-current translate-x-0.5" viewBox="0 0 24 24">
                                            <path d="M5 3l14 9-14 9V3z" />
                                        </svg>
                                    </div>
                                    <span className="text-white font-bold tracking-[0.2em] text-[14px] uppercase drop-shadow-sm">Tune In</span>
                                </div>
                            )}
                        </button>
                    </div>

                    {/* Right Side: Remote Partner Identity Block */}
                    <div className="min-w-[128px]">
                        {isReconnecting ? (
                            <div className="flex flex-col items-center text-center animate-in fade-in duration-500">
                                <div className="relative mb-4">
                                    <div className="w-32 h-32 rounded-full bg-amber-50 border-4 border-amber-200 flex items-center justify-center shadow-[0_8px_20px_rgba(245,158,11,0.12)]">
                                        <svg className="w-10 h-10 text-amber-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    </div>
                                    <div className="absolute bottom-1 right-1 w-7 h-7 bg-amber-400 border-4 border-white rounded-full shadow-sm animate-pulse" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-lg font-bold text-amber-700">Reconnecting...</h4>
                                    <div className="flex items-center justify-center gap-1.5 text-amber-500">
                                        <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                        <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
                                            {reconnectCountdown ? `${reconnectCountdown}s remaining` : 'Restoring session'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (isConnected || isSearching) ? (
                            <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-right-6 duration-700">
                                <div className="relative mb-4 group">
                                    <div className="w-32 h-32 rounded-full overflow-hidden bg-white p-1 border-4 border-white shadow-[0_8px_20px_rgba(255,183,206,0.12)] flex items-center justify-center transition-all duration-500 group-hover:shadow-[0_12px_30px_rgba(255,183,206,0.2)] group-hover:scale-[1.02]">
                                        {isConnected ? (
                                            <img src={partnerAvatar || `https://api.dicebear.com/9.x/notionists/svg?seed=Partner&backgroundColor=transparent`} alt="Partner" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center gap-1.5 opacity-60">
                                                <div className="w-2 h-2 bg-[#FF8BA7] rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <div className="w-2 h-2 bg-[#FF8BA7] rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <div className="w-2 h-2 bg-[#FF8BA7] rounded-full animate-bounce" />
                                            </div>
                                        )}
                                    </div>
                                    {isConnected && (
                                        <div className="absolute bottom-1 right-1 w-7 h-7 bg-green-400 border-4 border-white rounded-full shadow-sm" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-center gap-2">
                                        <h4 className={`text-lg font-bold tracking-tight transition-colors ${isConnected ? 'text-[#5C4E50]' : 'text-[#A58E92]'}`}>
                                            {isConnected ? (partnerUsername || 'Stranger') : 'Scanning...'}
                                        </h4>
                                        {isConnected && partnerCountryCode && (
                                            <ReactCountryFlag countryCode={partnerCountryCode} svg className="w-5 h-4 rounded-sm object-cover" />
                                        )}
                                    </div>
                                    <div className={`flex items-center justify-center gap-1.5 transition-all ${isConnected ? 'text-emerald-500' : 'text-[#A58E92] opacity-60 font-medium'}`}>
                                        {isConnected ? (
                                            <>
                                                <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                                <span className="text-[10px] font-bold uppercase tracking-[0.15em]">{partnerCountry || 'Connected'}</span>
                                            </>
                                        ) : (
                                            <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Frequency Search</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-center opacity-15">
                                <div className="w-32 h-32 rounded-full border-4 border-dashed border-[#A58E92] flex items-center justify-center mb-4">
                                    <svg className="w-10 h-10 text-[#A58E92]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#A58E92]">No Partner</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Floating Bottom Toolbar (Centered & Proportional) */}
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-4">
                    <div className="bg-white/85 backdrop-blur-2xl px-10 py-3 rounded-[32px] shadow-[0_15px_40px_-10px_rgba(255,183,206,0.15)] border border-white flex items-center justify-between relative">

                        {/* Left Controls */}
                        <div className="flex items-center gap-10">
                            <ToolbarBtn
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                label="History"
                                onClick={onNavigateToHistory}
                            />
                            <ToolbarBtn
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                                label="Circle"
                            />
                        </div>

                        {/* Elevated Center Mic Button */}
                        <div className="absolute left-1/2 -translate-x-1/2 -top-8">
                            <button
                                onClick={onToggleMute}
                                className={`
                                    w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500
                                    border-[6px] border-white shadow-[0_12px_24px_rgba(255,183,206,0.25)] relative z-10
                                    ${isMuted
                                        ? 'bg-rose-500 text-white shadow-rose-200'
                                        : 'bg-gradient-to-br from-[#FF9EB5] to-[#FF7597] text-white hover:scale-105 active:scale-95 group'}
                                `}
                            >
                                {isMuted ? (
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3l18 18" />
                                    </svg>
                                ) : (
                                    <svg className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        {/* Right Controls */}
                        <div className="flex items-center gap-10">
                            <ToolbarBtn
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
                                label="Chat"
                                active={showChat}
                                badge={messages.length > 0}
                                onClick={() => setShowChat(!showChat)}
                            />
                            <ToolbarBtn
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>}
                                label="Filter"
                                onClick={() => setFiltersOpen && setFiltersOpen(!filtersOpen)}
                                active={filtersOpen || (selectedCountry && selectedCountry !== 'GLOBAL')}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Sidebar/Popover Implementation */}
            <div className={`fixed top-24 bottom-32 right-12 z-[110] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${showChat ? 'opacity-100 translate-x-0 w-[400px]' : 'opacity-0 translate-x-12 pointer-events-none w-0'}`}>
                <div className="h-full bg-white/95 backdrop-blur-3xl rounded-[40px] border border-white shadow-[0_40px_80px_-20px_rgba(255,183,206,0.35)] flex flex-col overflow-hidden">
                    <div className="px-8 py-6 border-b border-pink-50 flex justify-between items-center bg-white/50">
                        <div>
                            <h3 className="font-bold text-[#5C4E50] text-xl">Voice Channel</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 bg-green-400 rounded-full" />
                                <span className="text-[11px] font-bold text-[#A58E92] uppercase tracking-[0.1em]">Frequency Active</span>
                            </div>
                        </div>
                        <button onClick={() => setShowChat(false)} className="p-3 hover:bg-pink-50 rounded-2xl transition-colors text-[#A58E92]">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <div className="flex-1 overflow-hidden p-4">
                        <ChatBox
                            messages={messages}
                            onSendMessage={onSendMessage}
                            isConnected={isConnected}
                            minimal={true}
                            showScrollbar={true}
                            theme="light"
                        />
                    </div>
                </div>
            </div>

            {/* Audio Component */}
            <audio ref={remoteAudioRef} autoPlay />

            {/* Scoped Styles */}
            <style jsx>{`
                @keyframes bounce {
                    0%, 100% { transform: scaleY(1); opacity: 1; }
                    50% { transform: scaleY(0.4); opacity: 0.6; }
                }
            `}</style>
        </div>
    );
};

// Reusable Toolbar Button Component
const ToolbarBtn = ({ icon, label, onClick, active = false, badge = false }: any) => (
    <button
        onClick={onClick}
        className={`relative flex flex-col items-center gap-1 group py-1 transition-all duration-500`}
    >
        <div className={`
            w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300
            ${active
                ? 'bg-[#FF8BA7] text-white shadow-md'
                : 'bg-white hover:bg-pink-50 text-[#7C6367] shadow-sm'}
        `}>
            {icon}
            {badge && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            )}
        </div>
        <span className={`text-[9px] font-bold tracking-wider uppercase transition-colors ${active ? 'text-[#FF8BA7]' : 'text-[#A58E92] group-hover:text-[#7C6367]'}`}>
            {label}
        </span>
    </button>
);
