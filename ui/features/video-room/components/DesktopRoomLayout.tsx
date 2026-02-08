import React from 'react';
import { RoomLayoutProps } from '../types';
import { SkeletonLoaderDesktop } from '../../../components/SkeletonLoader';
import ChatBox from '../../chat/components/ChatBox';
import { LogoIcon, ArrowRightIcon } from '../../../components/icons';
import { RoomNavbar } from '../../../components/RoomNavbar';

export const DesktopRoomLayout: React.FC<RoomLayoutProps> = ({
    videoRoomState,
    partnerIsMuted,
    partnerIsCameraOff,
    showChat,
    messages,
    localVideoRef,
    remoteVideoRef,
    onStop,
    onNext,
    onToggleMute,
    onToggleCamera,
    onSendMessage,
    setShowChat,
    filtersOpen,
    setFiltersOpen,
    onNavigateToChat,
    onNavigateToHistory,
}) => {
    const { isConnected, isSearching, partnerCountry, partnerCountryCode, isMuted, isCameraOff, partnerSignalStrength } = videoRoomState;

    const getSignalIcon = () => {
        if (partnerSignalStrength === 'reconnecting') return (
            <div className="flex items-center gap-2 h-10 px-3 bg-black/60 backdrop-blur-md border border-yellow-500/30 rounded-full animate-pulse shadow-lg ml-2">
                <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-yellow-500 font-bold uppercase tracking-wider">Reconnecting</span>
            </div>
        );

        const bars = {
            good: 3,
            fair: 2,
            poor: 1
        }[partnerSignalStrength] || 3;

        const tooltip = {
            good: 'Good Connection',
            fair: 'Fair Connection',
            poor: 'Poor Connection'
        }[partnerSignalStrength] || 'Unknown';

        return (
            <div className="flex flex-col justify-center h-10 ml-1 group relative">
                <div className="flex items-end gap-1 px-2.5 py-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-xl border border-white/5 transition-all cursor-help">
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={`w-1 rounded-full transition-all duration-500 ${i <= bars ? (
                                partnerSignalStrength === 'poor' ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]' :
                                    partnerSignalStrength === 'fair' ? 'bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]' : 'bg-[#00ff88] shadow-[0_0_5px_rgba(0,255,136,0.3)]'
                            ) : 'bg-white/10'}`}
                            style={{ height: `${6 + (i * 4)}px` }}
                        />
                    ))}
                </div>

                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black/90 text-white text-[10px] font-medium rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-50">
                    {tooltip}
                </div>
            </div>
        );
    };

    const getButtonText = () => {
        if (isSearching) return 'Stop';
        if (isConnected) return 'Next';
        return 'Start';
    };




    const [showIntro, setShowIntro] = React.useState(false);

    React.useEffect(() => {
        if (isConnected) {
            setShowIntro(true);
            const timer = setTimeout(() => setShowIntro(false), 3500);
            return () => clearTimeout(timer);
        } else {
            setShowIntro(false);
        }
    }, [isConnected]);

    const handleButtonClick = () => {
        if (showIntro) return; // Prevent skipping during intro
        if (isSearching) {
            onStop();
        } else if (isConnected) {
            onNext();
        } else {
            onNext();
        }
    };

    return (
        <div className="hidden lg:flex flex-col w-full h-full p-4 gap-4">
            <RoomNavbar
                activeTab="video"
                onNavigateToChat={onNavigateToChat}
                onNavigateToHistory={onNavigateToHistory}
                variant="desktop"
            />

            <div className="flex-1 flex gap-4 min-h-0">
                <div className="flex-1 rounded-3xl overflow-hidden relative border border-white/5 bg-zinc-900">
                    <video
                        id="desktop-local-video"
                        ref={localVideoRef}
                        className={`w-full h-full object-cover transform scale-x-[-1] ${isCameraOff ? 'hidden' : 'block'}`}
                        autoPlay
                        playsInline
                        muted
                    />
                    {isCameraOff && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="p-6 bg-black/50 rounded-full backdrop-blur-md">
                                <svg className="w-12 h-12 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                    )}

                    <div className="absolute top-4 left-4 z-10">
                        <div className="flex flex-col gap-2 p-2">
                            <button onClick={() => setFiltersOpen && setFiltersOpen(!filtersOpen)} className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-all">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                            </button>

                            <button onClick={onToggleMute} className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all ${isMuted ? 'bg-red-500 text-white' : 'hover:bg-white/10'}`}>
                                {isMuted ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                )}
                            </button>
                            <button onClick={onToggleCamera} className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all ${isCameraOff ? 'bg-red-500 text-white' : 'hover:bg-white/10'}`}>
                                {isCameraOff ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 rounded-3xl overflow-hidden relative group/remote">
                    {/* Intro Animation Overlay - Minimalist Discord Style */}
                    {isConnected && showIntro && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-900 animate-in fade-in duration-[1000ms]">
                            <div className="flex flex-col items-center gap-6 animate-in zoom-in-95 slide-in-from-bottom-8 duration-[1500ms] ease-out fill-mode-forwards">
                                <div className="relative">
                                    <div className="w-28 h-28 rounded-full bg-[#18181b] border border-white/5 flex items-center justify-center shadow-2xl relative z-10 overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <span className="text-3xl font-bold text-white/90 tracking-wider">{partnerCountryCode}</span>
                                    </div>
                                    {/* Decorative ring */}
                                    <div className="absolute inset-0 -m-1 rounded-full border border-white/5 animate-pulse opacity-50" />
                                </div>

                                <div className="text-center space-y-1.5">
                                    <h2 className="text-2xl font-semibold text-white tracking-tight">{partnerCountry || 'Stranger'}</h2>
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                        <p className="text-zinc-400 text-sm font-medium">Connected</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Remote Video */}
                    <video
                        id="desktop-remote-video"
                        ref={remoteVideoRef}
                        className={`w-full h-full object-cover transition-opacity duration-[2000ms] ease-in-out ${isConnected && !partnerIsCameraOff && !showIntro ? 'opacity-100' : 'opacity-0'}`}
                        autoPlay
                        playsInline
                    />

                    {/* Camera Off Overlay (Discord-style) */}
                    {isConnected && partnerIsCameraOff && (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-5">
                            <div className="flex flex-col items-center gap-4 opacity-50">
                                <div className="w-24 h-24 rounded-full bg-zinc-700 flex items-center justify-center">
                                    <svg className="w-12 h-12 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3l18 18" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Not Connected State (Searching & Idle) */}
                    {/* We keep this visible briefly during the transition to 'showIntro' for cross-fading effect */}
                    {(!isConnected || (isConnected && showIntro)) && (
                        <div className={`absolute inset-0 flex items-center justify-center bg-zinc-900 z-10 transition-opacity duration-[1500ms] ease-in-out ${isConnected && showIntro ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                            {isSearching ? (
                                <div className="flex flex-col items-center justify-center">
                                    <div className="relative flex items-center justify-center w-24 h-24 mb-6">
                                        <div className="absolute inset-0 bg-[#FF8ba7]/20 rounded-full animate-ping opacity-75 duration-[2000ms]" />
                                        <div className="absolute inset-0 bg-[#FF8ba7]/5 rounded-full animate-ping delay-500 opacity-50 duration-[2500ms]" />
                                        <div className="relative w-16 h-16 bg-[#18181b] rounded-full border border-white/10 flex items-center justify-center shadow-2xl z-10">
                                            <div className="w-2 h-2 bg-[#FF8ba7] rounded-full animate-pulse shadow-[0_0_10px_#FF8ba7]" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-medium text-white/90 mb-1 tracking-wide">Searching</h3>
                                    <p className="text-white/40 text-sm">Finding someone for you...</p>
                                </div>
                            ) : (
                                <div className="text-center group cursor-default">
                                    <div className="text-5xl mb-6 grayscale opacity-20 group-hover:opacity-30 transition-opacity duration-500 transform group-hover:scale-110">
                                        <span role="img" aria-label="Wave">👋</span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-white/90 mb-2 tracking-tight">Ready to connect?</h3>
                                    <p className="text-white/40 text-sm font-medium">Click arrow or press &rarr; to start</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Partner Info Header */}
                    {isConnected && !showIntro && (
                        <div className="absolute top-4 left-4 flex items-center gap-3 z-20 animate-in fade-in slide-in-from-top-4 duration-[1500ms] ease-out">
                            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center text-sm font-bold">
                                {partnerCountryCode || '?'}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-white shadow-black drop-shadow-md text-sm">
                                    {partnerCountry || 'Stranger'}
                                </span>
                                {partnerCountry && (
                                    <div className="flex items-center gap-1.5 text-[10px] text-white/80 font-medium bg-black/30 px-1.5 py-0.5 rounded">
                                        <span>{partnerCountry}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Signal Strength (Top Right) */}
                    {isConnected && (
                        <div className="absolute top-4 right-4 z-20">
                            {getSignalIcon()}
                        </div>
                    )}

                    {/* Partner Mute Indicator (Discord-style - bottom center) */}
                    {isConnected && partnerIsMuted && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 animate-in fade-in duration-200">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/90 backdrop-blur-md shadow-lg">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
                                </svg>
                                <span className="text-white text-sm font-semibold">Muted</span>
                            </div>
                        </div>
                    )}

                    <div className={`absolute bottom-4 right-4 z-20 w-80 max-w-[90%] max-h-[60%] flex flex-col transition-all duration-300 ${showChat ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                        <div className="bg-black/30 backdrop-blur-md rounded-2xl overflow-hidden border border-white/5 shadow-2xl flex flex-col h-full ring-1 ring-white/5">
                            <div className="flex-1 overflow-hidden">
                                <ChatBox messages={messages} onSendMessage={onSendMessage} isConnected={isConnected} minimal={true} showScrollbar={true} />
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-4 right-4 z-10">
                        {!showChat && isConnected && (
                            <button onClick={() => setShowChat(true)} className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/10 shadow-lg transition-all">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                {messages.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-black"></span>}
                            </button>
                        )}
                    </div>

                    {showChat && (
                        <button onClick={() => setShowChat(false)} className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-md">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <div className="h-24 shrink-0 flex items-center justify-between px-8 bg-[#0F0F0F] rounded-t-[2.5rem] mt-2 shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
                <button
                    onClick={onStop}
                    className="group flex items-center gap-4 text-left hover:opacity-80 transition-opacity"
                >
                    <div className="w-12 h-12 rounded-full bg-[#1e1e1e] flex items-center justify-center font-sans text-sm font-bold text-white group-hover:bg-[#2a2a2a] transition-colors">
                        esc
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-white text-[15px]">End Video Chat</span>
                        <span className="text-xs text-zinc-400">Press esc key to end video chat</span>
                    </div>
                </button>

                {!isConnected && !isSearching && <span className="text-zinc-500 font-medium text-sm hidden md:block">Safe &amp; Secure • 100% Free</span>}

                <button
                    onClick={handleButtonClick}
                    className="group flex items-center gap-4 text-right hover:opacity-80 transition-opacity"
                >
                    <div className="flex flex-col items-end">
                        <span className="font-bold text-white text-[15px]">
                            {isSearching ? 'Stop Search' : (isConnected ? 'Next Video Chat' : 'Start Video Chat')}
                        </span>
                        <span className="text-xs text-zinc-400">
                            {isSearching ? 'Press right key to stop' : (isConnected ? 'Press right key to meet others' : 'Press right key to start')}
                        </span>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-300 ${showIntro ? 'bg-[#1e1e1e] opacity-50 cursor-not-allowed' : 'bg-[#1e1e1e] group-hover:bg-[#2a2a2a]'}`}>
                        {isSearching ? (
                            <div className="w-4 h-4 bg-white rounded-sm" />
                        ) : (
                            showIntro ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <ArrowRightIcon className="w-5 h-5" />
                            )
                        )}
                    </div>
                </button>
            </div>
        </div >
    );
};
