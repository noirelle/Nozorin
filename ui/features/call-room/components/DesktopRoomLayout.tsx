import React from 'react';
import { RoomLayoutProps } from '../types';
import ChatBox from './ChatBox'; // Assuming ChatBox is exported from its own file
import { ArrowRightIcon } from '../../../components/icons';
import { RoomNavbar } from '../../../components/RoomNavbar';
import ReactCountryFlag from "react-country-flag";

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
    matchmakingStatus,
    queuePosition,
}) => {
    const { isConnected, isSearching, partnerCountry, partnerCountryCode, isMuted, partnerSignalStrength } = callRoomState;

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

    const handleButtonClick = () => {
        if (matchmakingStatus === 'NEGOTIATING') return;
        if (isSearching) {
            onStop();
        } else {
            onNext();
        }
    };

    return (
        <div className="hidden lg:flex flex-col w-full h-full p-4 gap-4">
            <RoomNavbar
                onNavigateToHistory={onNavigateToHistory}
                variant="desktop"
            />

            <div className="flex-1 flex gap-4 min-h-0">
                {/* Main Content Area */}
                <div className="flex-1 rounded-3xl overflow-hidden relative border border-white/5 bg-zinc-900 flex flex-col items-center justify-center">

                    {/* Audio Element */}
                    <audio ref={remoteAudioRef} autoPlay />

                    {/* Status / Partner Info */}
                    <div className="flex flex-col items-center gap-6 z-10">
                        {isConnected ? (
                            <>
                                <div className="w-32 h-32 rounded-full bg-zinc-800 border-4 border-white/5 flex items-center justify-center shadow-2xl relative group">
                                    <span className="text-4xl font-bold text-white tracking-wider">
                                        {partnerCountryCode || '?'}
                                    </span>
                                    {/* Pulse effect */}
                                    <div className="absolute inset-0 -m-1 rounded-full border border-white/5 animate-pulse opacity-50" />
                                </div>
                                <div className="text-center">
                                    <h2 className="text-3xl font-bold text-white mb-2">{partnerCountry || 'Stranger'}</h2>
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                        <p className="text-zinc-400 font-medium">Connected (Voice Only)</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="relative flex items-center justify-center w-32 h-32 mb-4">
                                    {isSearching ? (
                                        <>
                                            <div className="absolute inset-0 bg-[#FF8ba7]/20 rounded-full animate-ping opacity-75 duration-[2000ms]" />
                                            <div className="relative w-24 h-24 bg-[#18181b] rounded-full border border-white/10 flex items-center justify-center shadow-2xl z-10">
                                                <div className="w-3 h-3 bg-[#FF8ba7] rounded-full animate-pulse shadow-[0_0_10px_#FF8ba7]" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-24 h-24 bg-[#18181b] rounded-full border border-white/10 flex items-center justify-center shadow-2xl grayscale opacity-50">
                                            <span className="text-4xl">👋</span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-center">
                                    <h3 className="text-2xl font-bold text-white mb-2">
                                        {isSearching ? (queuePosition ? `In Queue: #${queuePosition}` : 'Finding Partner...') : 'Ready to Talk?'}
                                    </h3>
                                    <p className="text-zinc-500">
                                        {isSearching ? 'looking for someone...' : 'Click start to match with a stranger'}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Controls Overlay (Top Left) */}
                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                        <button onClick={() => setFiltersOpen && setFiltersOpen(!filtersOpen)} className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-all overflow-hidden bg-black/20 backdrop-blur-md border border-white/5">
                            {selectedCountry && selectedCountry !== 'GLOBAL' ? (
                                <ReactCountryFlag
                                    countryCode={selectedCountry}
                                    svg
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                            )}
                        </button>

                        <button onClick={onToggleMute} className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all border border-white/5 ${isMuted ? 'bg-red-500 text-white' : 'bg-black/20 backdrop-blur-md hover:bg-white/10'}`}>
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
                    </div>

                    {/* Signal Strength (Top Right) */}
                    {isConnected && (
                        <div className="absolute top-4 right-4 z-20">
                            {getSignalIcon()}
                        </div>
                    )}

                    {/* Chat Overlay */}
                    <div className={`absolute bottom-4 right-4 z-20 w-80 max-w-[90%] max-h-[60%] flex flex-col transition-all duration-300 ${showChat ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                        <div className="bg-black/80 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col h-full ring-1 ring-white/5">
                            <div className="flex-1 overflow-hidden">
                                <ChatBox messages={messages} onSendMessage={onSendMessage} isConnected={isConnected} minimal={true} showScrollbar={true} />
                            </div>
                        </div>
                    </div>

                    {/* Chat Toggle Button */}
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

            {/* Bottom Bar */}
            <div className="h-24 shrink-0 flex items-center justify-between px-8 bg-[#0F0F0F] rounded-t-[2.5rem] mt-2 shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
                <button
                    onClick={onStop}
                    className="group flex items-center gap-4 text-left hover:opacity-80 transition-opacity"
                >
                    <div className="w-12 h-12 rounded-full bg-[#1e1e1e] flex items-center justify-center font-sans text-sm font-bold text-white group-hover:bg-[#2a2a2a] transition-colors">
                        esc
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-white text-[15px]">End Voice Chat</span>
                        <span className="text-xs text-zinc-400">Press esc key to end call</span>
                    </div>
                </button>

                {!isConnected && !isSearching && <span className="text-zinc-500 font-medium text-sm hidden md:block">Safe &amp; Secure • 100% Free</span>}

                <button
                    onClick={handleButtonClick}
                    className="group flex items-center gap-4 text-right hover:opacity-80 transition-opacity"
                >
                    <div className="flex flex-col items-end">
                        <span className="font-bold text-white text-[15px]">
                            {isSearching ? 'Stop Search' : (isConnected ? 'Next Voice Chat' : 'Start Voice Chat')}
                        </span>
                        <span className="text-xs text-zinc-400">
                            {isSearching ? 'Press right key to stop' : (isConnected ? 'Press right key to skip' : 'Press right key to start')}
                        </span>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-300 bg-[#1e1e1e] group-hover:bg-[#2a2a2a]`}>
                        {isSearching ? (
                            <div className="w-4 h-4 bg-white rounded-sm" />
                        ) : (
                            <ArrowRightIcon className="w-5 h-5" />
                        )}
                    </div>
                </button>
            </div>
        </div >
    );
};
