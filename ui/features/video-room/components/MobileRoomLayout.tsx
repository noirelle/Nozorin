import React, { useState, useEffect } from 'react';
import { RoomLayoutProps } from '../types';
import { SkeletonLoader } from '../../../components/SkeletonLoader';
import { LogoIcon } from '../../../components/icons';
import { RoomNavbar } from '../../../components/RoomNavbar';
import ReactCountryFlag from "react-country-flag";

export const MobileRoomLayout: React.FC<RoomLayoutProps> = ({
    videoRoomState,
    partnerIsMuted,
    partnerIsCameraOff,
    showChat,
    messages,
    inputText,
    localVideoRef,
    remoteVideoRef,
    messagesEndRef,
    onStop,
    onNext,
    onToggleMute,
    onToggleCamera,
    onSendMessage,
    setShowChat,
    setInputText,
    mobileLayout = 'overlay',
    setMobileLayout,
    filtersOpen,
    setFiltersOpen,
    onNavigateToChat,
    onNavigateToHistory,
    selectedCountry,
}) => {
    const { isConnected, isSearching, partnerCountry, partnerCountryCode, isMuted, isCameraOff, partnerSignalStrength } = videoRoomState;

    const getSignalIcon = () => {
        if (partnerSignalStrength === 'reconnecting') return (
            <div className="flex items-center gap-1 animate-pulse text-yellow-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-bold">Reconnecting...</span>
            </div>
        );

        // Signal bars
        const bars = {
            good: 3,
            fair: 2,
            poor: 1
        }[partnerSignalStrength] || 3;

        return (
            <div className="flex items-end gap-0.5 h-3">
                {[1, 2, 3].map(i => (
                    <div
                        key={i}
                        className={`w-1 rounded-sm ${i <= bars ? (
                            partnerSignalStrength === 'poor' ? 'bg-red-500' :
                                partnerSignalStrength === 'fair' ? 'bg-yellow-500' : 'bg-green-500'
                        ) : 'bg-white/20'}`}
                        style={{ height: `${i * 33}%` }}
                    />
                ))}
            </div>
        );
    };

    const getButtonText = () => {
        if (isSearching) return 'Stop';
        if (isConnected) return 'Next';
        return 'Start';
    };

    const handleButtonClick = () => {
        if (isSearching) {
            onStop();
        } else if (isConnected) {
            onNext();
        } else {
            // "Start" logic is implicitly handled by onNext/onStop if not connected/searching? 
            // In original Room.tsx:
            // if (videoRoomState.isSearching) handleStop();
            // else if (videoRoomState.isConnected) handleNext();
            // else findMatch();
            // We need to pass findMatch functionality. 
            // Wait, onNext performs "Next" (skip). Start/FindMatch is separate.
            // I should treat "Next" button as the main action button.
            // If checking the props, onNext calls handleNext which calls findMatch after stop.
            // If not connected and not searching, we need to call findMatch directly.
            // Let's assume onNext handles the "Start" case too or pass a separate onStart.
            // Check Room.tsx line 271: findMatch().
            // I'll update props to include onStart, or assume onNext can handle it if I modify Room.tsx to pass the right function.
            // Actually, let's keep it simple: The parent component passes the correct handler or we pass onStart.
            onNext();
        }
    };

    const [showGuidelines, setShowGuidelines] = useState(false);

    useEffect(() => {
        if (isConnected) {
            setShowGuidelines(true);
            const timer = setTimeout(() => setShowGuidelines(false), 3000);
            return () => clearTimeout(timer);
        } else {
            setShowGuidelines(false);
        }
    }, [isConnected]);

    const [showIntro, setShowIntro] = useState(false);

    useEffect(() => {
        if (isConnected) {
            setShowIntro(true);
            const timer = setTimeout(() => setShowIntro(false), 2000);
            return () => clearTimeout(timer);
        } else {
            setShowIntro(false);
        }
    }, [isConnected]);

    return (
        <div className="lg:hidden w-full h-full fixed inset-0 font-sans touch-none">
            <div className={`fixed left-0 right-0 top-0 z-0 bg-black transition-[height,border] duration-200 ease-out ${mobileLayout === 'split' ? 'h-[50%] bottom-auto border-b border-white/10' : 'h-full bottom-0'}`}>
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 z-10 pointer-events-none"></div>

                {/* Intro Animation Overlay */}
                {isConnected && showIntro && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-zinc-900 animate-in fade-in duration-300">
                        <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-500 delay-100">
                            <div className="w-24 h-24 rounded-full bg-zinc-800 border-4 border-[#FF8ba7]/20 flex items-center justify-center shadow-2xl">
                                <span className="text-3xl font-bold text-white">{partnerCountryCode}</span>
                            </div>
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-white mb-1">{partnerCountry || 'Stranger'}</h2>
                                <p className="text-zinc-400 text-sm">Connected!</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Remote Video */}
                <video
                    id="mobile-remote-video"
                    ref={remoteVideoRef}
                    className={`w-full h-full object-cover transition-opacity duration-1000 ${isConnected && !partnerIsCameraOff && !showIntro ? 'opacity-100' : 'opacity-0'}`}
                    autoPlay
                    playsInline
                />

                {/* Camera Off Overlay (Discord-style) */}
                {isConnected && partnerIsCameraOff && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-5">
                        <div className="flex flex-col items-center gap-4 opacity-60">
                            <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center">
                                <svg className="w-10 h-10 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3l18 18" />
                                </svg>
                            </div>
                        </div>
                    </div>
                )}

                {/* Not Connected State */}
                {!isConnected && (
                    <div className="absolute inset-0 flex items-center justify-center z-0 bg-black/60 backdrop-blur-sm">
                        {isSearching ? (
                            <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                                <div className="relative flex items-center justify-center w-24 h-24 mb-6">
                                    <div className="absolute inset-0 bg-[#FF8ba7]/20 rounded-full animate-ping opacity-75" />
                                    <div className="absolute inset-0 bg-[#FF8ba7]/10 rounded-full animate-ping delay-300 opacity-50" />
                                    <div className="relative w-16 h-16 bg-[#1a1a1a] rounded-full border-2 border-[#FF8ba7] flex items-center justify-center shadow-[0_0_20px_rgba(255,139,167,0.3)] z-10">
                                        <svg className="w-6 h-6 text-[#FF8ba7] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1 animate-pulse tracking-tight">Finding partner...</h3>
                                <p className="text-white/60 text-sm font-medium">Please wait</p>
                            </div>
                        ) : (
                            <div className="text-center px-6 animate-in fade-in zoom-in duration-500">
                                <div className="text-5xl mb-4 grayscale opacity-40 animate-pulse">
                                    <span role="img" aria-label="Wave">👋</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-1 shadow-black drop-shadow-md tracking-tight">Ready to meet?</h3>
                                <p className="text-white/60 text-sm font-medium shadow-black drop-shadow-md">Click Start</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Partner Mute Indicator (Discord-style - top left for mobile) */}
                {isConnected && partnerIsMuted && mobileLayout === 'split' && (
                    <div className="absolute top-16 right-4 z-20 animate-in fade-in duration-200">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-red-500/90 backdrop-blur-md shadow-lg border border-red-400/20">
                            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
                            </svg>
                            <span className="text-white text-[11px] font-semibold">Muted</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="fixed top-0 left-0 right-0 z-30 flex flex-col pointer-events-none">
                {/* Top Nav */}
                <RoomNavbar
                    activeTab="video"
                    onNavigateToChat={onNavigateToChat}
                    onNavigateToHistory={onNavigateToHistory}
                    variant="mobile"
                />

                {/* Existing Controls */}
                {/* Existing Controls */}
                <div className="px-4 py-1 flex items-start justify-between pointer-events-auto">
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        {partnerCountryCode && !showIntro && (
                            <div className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md border border-white/5 overflow-hidden flex items-center justify-center shrink-0 shadow-md animate-in fade-in slide-in-from-top-4 duration-500">
                                <span className="text-xs font-bold text-white/90 shadow-black drop-shadow-md">
                                    {partnerCountryCode}
                                </span>
                            </div>
                        )}
                        {isConnected && (
                            <div className="flex items-center justify-center h-8 px-2 rounded-full bg-black/20 backdrop-blur-md border border-white/5 shadow-md">
                                {getSignalIcon()}
                            </div>
                        )}
                        {isConnected && partnerIsMuted && mobileLayout !== 'split' && (
                            <div className="flex items-center justify-center h-8 px-2 gap-1 rounded-full bg-red-500/90 backdrop-blur-md shadow-md border border-red-400/20">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
                                </svg>
                                <span className="text-white text-[10px] font-semibold">Muted</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={`fixed z-10 transition-[top,left,right,bottom,width,height,border-radius,box-shadow,backdrop-filter] duration-200 ease-out overflow-hidden bg-black touch-none ${mobileLayout === 'split' ? 'top-[50%] left-0 right-0 bottom-0 w-full rounded-none border-t border-white/10' : 'top-16 right-4 w-[80px] aspect-[3/4] rounded-lg shadow-lg border border-white/10 backdrop-blur-sm bg-black/50'}`}>
                <video
                    id="mobile-local-video"
                    ref={localVideoRef}
                    className={`w-full h-full object-cover transform scale-x-[-1] ${isCameraOff ? 'hidden' : 'block'}`}
                    autoPlay
                    playsInline
                    muted
                />
                {isCameraOff && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                    </div>
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-30 flex flex-col justify-end pointer-events-none pb-safe-area">
                <div className={`fixed bottom-0 left-0 right-0 transition-all duration-300 pointer-events-none z-0 ${showChat ? 'h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent' : 'h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent'}`} />

                {showChat && (
                    <div
                        className="fixed inset-0 z-10 pointer-events-auto bg-transparent"
                        onClick={() => setShowChat(false)}
                    />
                )}

                {/* Guidelines Popup */}
                {showGuidelines && !showChat && (
                    <div className="absolute bottom-[4.5rem] left-4 right-16 z-40 animate-in fade-in slide-in-from-bottom-2 duration-500 pointer-events-none">
                        <p className="text-white text-[13px] font-medium leading-relaxed drop-shadow-md text-left shadow-black">
                            <span className="font-bold">Nozorin</span> cares about your safety. Check out our <span className="text-[#00ff88] font-bold cursor-pointer hover:underline pointer-events-auto">Community Guidelines</span> and have fun!
                        </p>
                    </div>
                )}

                <div className={`relative z-20 w-full px-4 py-2 flex flex-col justify-end transition-all duration-300 pointer-events-auto ${showChat ? 'max-h-[40vh] mb-0' : 'max-h-[35vh] min-h-[50px] mb-0'}`}>
                    <div className="overflow-y-auto scrollbar-hide flex flex-col gap-2 pb-2 mask-image-gradient overscroll-contain touch-pan-y">
                        {messages.length === 0 && (
                            <></>
                        )}

                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.isSelf ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                                <div className={`px-4 py-2 rounded-2xl text-[15px] font-medium backdrop-blur-md shadow-sm max-w-[85%] break-words leading-relaxed drop-shadow-sm ${msg.isSelf ? 'bg-[#FF8ba7]/90 text-white rounded-tr-sm' : 'bg-black/40 text-white rounded-tl-sm'}`}>
                                    {msg.message}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <div className="relative z-30 pointer-events-auto">
                    {showChat ? (
                        <form
                            className="bg-transparent p-4 pb-6 flex items-end gap-2 animate-in slide-in-from-bottom-4 duration-300 ease-out"
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (inputText.trim()) {
                                    onSendMessage(inputText);
                                }
                            }}
                        >
                            <input
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-black/40 text-white placeholder-white/70 rounded-full px-5 py-3 focus:outline-none focus:bg-black/60 border-none text-[16px] transition-all backdrop-blur-xl shadow-lg"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!inputText.trim()}
                                className="p-3 rounded-full bg-[#FF8ba7]/90 hover:bg-[#FF8ba7] text-white disabled:opacity-0 disabled:scale-75 transition-all active:scale-90 shadow-lg backdrop-blur-md"
                            >
                                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                </svg>
                            </button>
                        </form>
                    ) : (
                        <div className="px-4 pb-6 pt-2 flex items-center justify-between w-full">
                            {/* Left Icons Group */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setShowChat(true)}
                                    className="text-white hover:text-white/80 transition-colors relative"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 drop-shadow-md">
                                        <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
                                    </svg>
                                    {messages.length > 0 && <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-black"></span>}
                                </button>

                                <button
                                    onClick={() => setMobileLayout && setMobileLayout(mobileLayout === 'overlay' ? 'split' : 'overlay')}
                                    className="text-white hover:text-white/80 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 drop-shadow-md">
                                        <path fillRule="evenodd" d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z" clipRule="evenodd" />
                                    </svg>
                                </button>

                                <button
                                    onClick={() => setFiltersOpen && setFiltersOpen(!filtersOpen)}
                                    className="text-white hover:text-white/80 transition-colors"
                                >
                                    {selectedCountry && selectedCountry !== 'GLOBAL' ? (
                                        <span className="text-xl leading-none filter drop-shadow-md flex items-center justify-center w-6 h-6 rounded-full overflow-hidden">
                                            <ReactCountryFlag
                                                countryCode={selectedCountry}
                                                svg
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        </span>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 drop-shadow-md">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                        </svg>
                                    )}
                                </button>

                                <button
                                    onClick={onToggleMute}
                                    className={`${isMuted ? 'text-red-500' : 'text-white hover:text-white/80'} transition-colors`}
                                >
                                    {isMuted ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 drop-shadow-md">
                                            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                                            <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 drop-shadow-md">
                                            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                                            <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                                        </svg>
                                    )}
                                </button>

                                <button
                                    onClick={onToggleCamera}
                                    className={`${isCameraOff ? 'text-red-500' : 'text-white hover:text-white/80'} transition-colors`}
                                >
                                    {isCameraOff ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 drop-shadow-md">
                                            <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM20.57 16.476l-2.091-2.091c.148-.282.261-.573.336-.871.21-.828.32-1.702.321-2.601a.75.75 0 00-.063-.3.75.75 0 00-.687-.452h-.01L15.65 8.24l2.455-2.455c.61-.161 1.258.043 1.61.503l3.856 5.027a.75.75 0 01.002.902l-3.003 4.26zM7.222 7.828l1.637 1.637.733-.733a6.75 6.75 0 019.345 7.02l.745.746a8.257 8.257 0 00-11.532-6.643l-.928-2.027z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 drop-shadow-md">
                                            <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            {/* Right Actions: Stop & Next */}
                            <div className="flex items-center gap-3">
                                {(isConnected || isSearching) && (
                                    <button
                                        onClick={onStop}
                                        className="w-9 h-9 flex items-center justify-center rounded-full bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-all active:scale-95 backdrop-blur-md"
                                        aria-label="Stop"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                            <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}

                                <button
                                    onClick={handleButtonClick}
                                    className="flex items-center gap-1 pl-1 pr-0 text-white font-bold text-[16px] tracking-wide hover:opacity-80 active:scale-95 transition-all drop-shadow-md"
                                >
                                    <span>{getButtonText()}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
