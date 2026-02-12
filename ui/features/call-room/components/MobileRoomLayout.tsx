import React, { useState, useEffect } from 'react';
import { RoomLayoutProps } from '../types';
import { RoomNavbar } from '../../../components/RoomNavbar';
import ChatBox from './ChatBox';
import ReactCountryFlag from "react-country-flag";

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
    selectedCountry,
    queuePosition,
}) => {
    const { isConnected, isSearching, partnerCountry, partnerCountryCode, isMuted } = callRoomState;

    const getButtonText = () => {
        if (isSearching) return 'SCANNING';
        if (isConnected) return 'TUNED';
        return 'CONNECT';
    };

    return (
        <div className="lg:hidden flex flex-col w-full h-screen bg-[#FDFDFD] relative overflow-hidden font-sans text-slate-900">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                    backgroundSize: '30px 30px'
                }}
            />

            {/* Header */}
            <div className="absolute top-0 left-0 w-full z-50 bg-transparent shrink-0">
                <RoomNavbar
                    onNavigateToHistory={onNavigateToHistory}
                    variant="mobile"
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 relative z-10 w-full h-full overflow-hidden flex flex-col items-center justify-center">

                {/* Center Action Circle */}
                <div className="relative mb-8">
                    <button
                        onClick={isConnected ? onNext : (isSearching ? onStop : onNext)}
                        className="relative group outline-none focus:outline-none"
                    >
                        {/* Pulsing Rings (Searching) */}
                        {isSearching && (
                            <>
                                <div className="absolute inset-0 -m-3 border border-[#FF8ba7]/30 rounded-full animate-ping duration-[1500ms]" />
                                <div className="absolute inset-0 -m-8 border border-[#FF8ba7]/20 rounded-full animate-ping duration-[2000ms] delay-300" />
                                <div className="absolute inset-0 -m-16 border border-[#FF8ba7]/10 rounded-full animate-ping duration-[3000ms] delay-700" />
                            </>
                        )}

                        {/* Connected Glow */}
                        {isConnected && (
                            <div className="absolute inset-0 rounded-full bg-[#FF8ba7] blur-[40px] opacity-40 animate-pulse" />
                        )}

                        {/* Main Circle - Scaled for Mobile */}
                        <div className={`w-52 h-52 rounded-full flex flex-col items-center justify-center transition-all duration-700 relative z-10 overflow-hidden ${isConnected
                            ? 'bg-gradient-to-br from-[#FF8ba7] to-[#fe5f8f] border-[3px] border-white/20 scale-105'
                            : 'bg-gradient-to-br from-[#FF8ba7] to-[#FFA0B5] border-[6px] border-white'
                            }`}>

                            {/* Inner Content */}
                            {isConnected ? (
                                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-700 text-white">
                                    <div className="flex items-center gap-1 h-10 mb-3">
                                        {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                                            <div
                                                key={i}
                                                className="w-1.5 bg-white/90 rounded-full animate-pulse"
                                                style={{
                                                    height: `${h * 4}px`,
                                                    animationDelay: `${i * 0.15}s`
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <div className="px-3 py-1 bg-black/20 backdrop-blur-md rounded-full text-white text-[8px] font-bold tracking-[0.2em] border border-white/10 uppercase mb-2">
                                        TUNED • 88.4 MHZ
                                    </div>
                                    <span className="text-[8px] font-bold text-white/80 tracking-widest uppercase">Tap to Skip</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-white relative h-full w-full justify-center">
                                    {isSearching ? (
                                        <>
                                            <div className="relative w-16 h-16 mb-3 flex items-center justify-center shrink-0">
                                                <div className="absolute inset-0 border-[3px] border-white/30 rounded-full" />
                                                <div className="absolute inset-0 border-[3px] border-t-white border-r-white border-b-transparent border-l-transparent rounded-full animate-spin" />
                                            </div>
                                            <span className="text-white font-bold tracking-widest uppercase text-[10px] animate-pulse mb-4">{queuePosition ? `POS: ${queuePosition}` : 'Scanning...'}</span>
                                            <span className="text-[8px] font-bold text-white uppercase tracking-widest opacity-80 cursor-pointer">Tap to Stop</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 mb-4 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 transition-all duration-300 flex items-center justify-center shrink-0 relative overflow-hidden">
                                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                                                </svg>
                                            </div>
                                            <span className="text-white font-bold tracking-widest uppercase text-[10px]">Tap to Connect</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </button>
                </div>

                {/* Profiles Area - Bottom Half */}
                <div className="w-full px-6 transition-all duration-500 flex flex-col gap-3">
                    {/* Header Label */}
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-700 px-1">
                        <span className="text-[#FF8ba7] text-xs">|•|</span>
                        <span className="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase">
                            Connection Info
                        </span>
                    </div>

                    {/* Compact Profile Stack */}
                    <div className="space-y-2.5">
                        {/* You */}
                        <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl ring-1 ring-slate-100">
                            <div className="relative shrink-0">
                                <div className="w-10 h-10 rounded-full bg-slate-50 overflow-hidden border border-slate-100 p-0.5">
                                    <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=Alex&backgroundColor=transparent`} alt="Av" className="w-full h-full object-cover rounded-full bg-orange-100" />
                                </div>
                                <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-green-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-slate-800 text-xs">Alex (You)</h3>
                                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-wider">LOCAL</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className={`p-1 rounded-md transition-colors ${isMuted ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                            {isMuted && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3l18 18" />}
                                        </svg>
                                    </div>
                                    <p className="text-[9px] text-slate-500 font-medium">Mic is {isMuted ? 'Off' : 'On'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Partner */}
                        <div className={`flex items-center gap-3 bg-white p-2.5 rounded-2xl ring-1 ring-slate-100 transition-all duration-500 ${isConnected || isSearching ? 'opacity-100' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                            <div className="relative shrink-0">
                                <div className="w-10 h-10 rounded-full bg-slate-50 overflow-hidden flex items-center justify-center border border-slate-100">
                                    {isConnected && partnerCountryCode ? (
                                        <ReactCountryFlag countryCode={partnerCountryCode} svg style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <svg className="w-5 h-5 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    )}
                                </div>
                                <div className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${isConnected ? 'bg-green-500' : 'bg-slate-200 animate-pulse'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className={`font-bold text-xs truncate pr-2 ${isConnected ? 'text-slate-800' : 'text-slate-400'}`}>
                                        {isConnected ? (partnerCountry || 'Stranger') : 'Scanning...'}
                                    </h3>
                                    {isConnected && (
                                        <span className="text-[8px] font-bold bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                                            CONNECTED
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {isConnected && (
                                        <button className="bg-[#FF0055] text-white text-[8px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                                            ADD FRIEND
                                        </button>
                                    )}
                                    <p className="text-[9px] text-slate-500 font-medium truncate">
                                        {isConnected ? (partnerCountryCode ? `${partnerCountryCode} Frequency` : 'Stranger') : 'Searching frequencies...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Toolbar */}
            <div className="h-20 bg-white border-t border-slate-50 px-4 flex items-center justify-between z-50 shrink-0">
                {/* Left Actions - Balanced spacing */}
                <div className="flex-1 flex items-center gap-6 justify-start">
                    <button
                        onClick={onNavigateToHistory}
                        className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 active:text-[#FF8ba7] active:bg-slate-100 transition-all shadow-sm ring-1 ring-slate-100"
                        title="History"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => { }} // Friends Placeholder
                        className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 active:text-[#FF8ba7] active:bg-slate-100 transition-all shadow-sm ring-1 ring-slate-100"
                        title="Friends"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </button>
                </div>

                {/* Center Action - Perfectly Centered */}
                <div className="flex items-center justify-center px-2">
                    {isConnected ? (
                        <button
                            onClick={onToggleMute}
                            className={`h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 -translate-y-4 shadow-lg ring-2 ring-white ${isMuted
                                ? 'bg-red-500 text-white shadow-red-200'
                                : 'bg-white text-slate-700 border border-slate-100 shadow-slate-200'
                                }`}
                        >
                            {isMuted ? (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3l18 18" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={() => setFiltersOpen && setFiltersOpen(!filtersOpen)}
                            className={`h-11 px-4 rounded-full flex items-center justify-center gap-2 transition-all duration-300 border shadow-sm ${filtersOpen || (selectedCountry && selectedCountry !== 'GLOBAL')
                                ? 'bg-[#FF8ba7]/10 border-[#FF8ba7] text-[#FF8ba7] ring-1 ring-[#FF8ba7]/20'
                                : 'bg-slate-50 border-slate-200 text-slate-500 active:bg-white'
                                }`}
                        >
                            {selectedCountry && selectedCountry !== 'GLOBAL' ? (
                                <>
                                    <div className="w-5 h-5 rounded-full overflow-hidden border border-black/10 shrink-0">
                                        <ReactCountryFlag countryCode={selectedCountry} svg style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <span className="font-bold text-xs tracking-wide">{selectedCountry}</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21c0-2.5 4-5 9-5s9 2.5 9 5M12 11a5 5 0 100-10 5 5 0 000 10z" />
                                    </svg>
                                    <span className="font-bold text-xs tracking-wide uppercase">Global</span>
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Right Actions - Balanced spacing */}
                <div className="flex-1 flex items-center justify-end">
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all relative shadow-sm ring-1 ring-slate-100 ${showChat ? 'bg-slate-100 text-[#FF8ba7]' : 'bg-slate-50 text-slate-400 active:text-[#FF8ba7]'}`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        {messages.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}
                    </button>
                </div>
            </div>

            {/* Chat Popover */}
            <div className={`absolute bottom-24 left-4 right-4 z-40 transition-all duration-300 origin-bottom ${showChat ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}`}>
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-100 overflow-hidden h-[60vh] flex flex-col">
                    <div className="px-5 py-3 border-b border-slate-50 bg-white/50 flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-sm">Frequency Chat</span>
                        <button onClick={() => setShowChat(false)} className="text-slate-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <div className="flex-1 overflow-hidden">
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

            {/* Audio Ref */}
            <audio ref={remoteAudioRef} autoPlay />
        </div>
    );
};

