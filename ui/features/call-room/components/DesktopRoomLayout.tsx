import React, { useState } from 'react';
import { RoomLayoutProps } from '../types';
import ChatBox from './ChatBox';
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

    // Helper for signal strength (dark text for light mode)
    const getSignalText = () => {
        if (partnerSignalStrength === 'reconnecting') return 'Reconnecting...';
        return `${partnerSignalStrength.toUpperCase()} SIGNAL`;
    };

    return (
        <div className="hidden lg:flex flex-col w-full h-screen bg-[#FDFDFD] relative overflow-hidden font-sans text-slate-900">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Header */}
            <div className="absolute top-0 left-0 w-full z-50 bg-transparent shrink-0">
                <RoomNavbar
                    onNavigateToHistory={onNavigateToHistory}
                    variant="desktop"
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 relative z-10 w-full h-full overflow-hidden">

                {/* Center Circle / Connection Area - Centered Absolutely */}
                <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
                    <button
                        onClick={isConnected ? onNext : (isSearching ? onStop : onNext)}
                        className="relative group outline-none focus:outline-none"
                    >
                        {/* Pulsing Rings (Searching) */}
                        {isSearching && (
                            <>
                                <div className="absolute inset-0 -m-4 border border-[#FF8ba7]/30 rounded-full animate-ping duration-[1500ms]" />
                                <div className="absolute inset-0 -m-12 border border-[#FF8ba7]/20 rounded-full animate-ping duration-[2000ms] delay-300" />
                                <div className="absolute inset-0 -m-24 border border-[#FF8ba7]/10 rounded-full animate-ping duration-[3000ms] delay-700" />
                                <div className="absolute inset-0 -m-32 border border-[#FF8ba7]/5 rounded-full animate-pulse duration-[4000ms]" />
                            </>
                        )}

                        {/* Connected Glow (Moon Effect) */}
                        {isConnected && (
                            <div className="absolute inset-0 rounded-full bg-[#FF8ba7] blur-[60px] opacity-40 animate-pulse" />
                        )}

                        {/* Main Circle */}
                        <div className={`w-80 h-80 rounded-full flex flex-col items-center justify-center shadow-[0_20px_60px_-15px_rgba(255,139,167,0.4)] transition-all duration-700 relative z-10 overflow-hidden ${isConnected
                            ? 'bg-gradient-to-br from-[#FF8ba7] to-[#fe5f8f] border-4 border-white/20 shadow-[0_0_80px_-20px_rgba(255,139,167,0.6)] scale-105'
                            : 'bg-gradient-to-br from-[#FF8ba7] to-[#FFA0B5] border-8 border-white shadow-[0_30px_60px_-10px_rgba(255,139,167,0.3)] hover:scale-105'
                            }`}>

                            {/* Inner Content */}
                            {isConnected ? (
                                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-700 text-white">
                                    {/* Visualizer */}
                                    <div className="flex items-center gap-1.5 h-16 mb-6">
                                        {[1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1].map((h, i) => (
                                            <div
                                                key={i}
                                                className="w-2.5 bg-white/90 rounded-full animate-pulse"
                                                style={{
                                                    height: `${h * 8}px`,
                                                    animationDelay: `${i * 0.15}s`
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <div className="px-5 py-2 bg-black/20 backdrop-blur-md rounded-full text-white text-xs font-bold tracking-[0.2em] border border-white/10 uppercase mb-2">
                                        88.45 MHZ • TUNED
                                    </div>
                                    <span className="text-[10px] font-medium text-white/80 tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-12">
                                        Tap to Skip
                                    </span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-white relative h-full w-full justify-center">
                                    {isSearching ? (
                                        <>
                                            <div className="relative w-24 h-24 mb-6 flex items-center justify-center shrink-0">
                                                <div className="absolute inset-0 border-4 border-white/30 rounded-full" />
                                                <div className="absolute inset-0 border-4 border-t-white border-r-white border-b-transparent border-l-transparent rounded-full animate-spin" />
                                                <div className="w-12 h-12 bg-white/20 rounded-full animate-ping" />
                                            </div>
                                            <span className="text-white font-bold tracking-widest uppercase text-xs animate-pulse mb-8 drop-shadow-md">Scanning...</span>

                                            {/* Absolute positioned status elements */}
                                            {queuePosition && (
                                                <span className="text-[10px] text-white/90 font-mono absolute bottom-20 animate-in fade-in slide-in-from-bottom-2 drop-shadow-sm">
                                                    POS: {queuePosition}
                                                </span>
                                            )}
                                            <span className="absolute bottom-10 text-[10px] font-bold text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer drop-shadow-md">
                                                Tap to Stop
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-24 h-24 mb-6 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 shadow-[0_10px_20px_rgba(0,0,0,0.1)] transition-all duration-300 flex items-center justify-center shrink-0 relative overflow-hidden group-hover:scale-110">
                                                <svg className="w-12 h-12 text-white drop-shadow-md transform group-hover:-rotate-12 transition-transform duration-500" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                                                </svg>
                                            </div>
                                            <span className="text-white font-bold tracking-widest uppercase text-sm drop-shadow-md group-hover:scale-105 transition-transform">Tap to Connect</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </button>

                    {/* Partner Satellite Removed */}
                </div>

                {/* Profiles Area - Bottom Left with Label */}
                <div className="absolute bottom-28 left-8 z-20 pointer-events-none flex flex-col gap-4">

                    {/* Header Text */}
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-700">
                        <span className="text-[#FF8ba7] text-xs">|•|</span>
                        <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">
                            Currently Connected
                        </span>
                    </div>

                    <div className="flex items-end gap-5">

                        {/* User Profile (Left) - Always visible */}
                        <div className="pointer-events-auto flex items-center gap-3 bg-white p-3 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 min-w-[240px] max-w-[260px]">
                            <div className="relative shrink-0">
                                <div className="w-12 h-12 rounded-full bg-slate-50 overflow-hidden border border-slate-100 p-0.5">
                                    {/* Placeholder Avatar */}
                                    <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=Alex&backgroundColor=transparent`} alt="Av" className="w-full h-full object-cover rounded-full bg-orange-100" />
                                </div>
                                <div className="absolute top-0 right-0 w-3 h-3 rounded-full border-[2px] border-white bg-green-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-slate-800 text-sm">Alex (You)</h3>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">LOCAL</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium">London, UK</p>

                                <div className="mt-2 flex items-center gap-2">
                                    <div className="bg-slate-50 text-slate-500 text-[9px] font-bold px-2 py-1 rounded-md inline-block uppercase tracking-wider">
                                        Primary
                                    </div>
                                    <div className={`p-1.5 rounded-lg transition-colors ${isMuted ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`} title={isMuted ? 'Your Mic is Off' : 'Your Mic is On'}>
                                        {isMuted ? (
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3l18 18" />
                                            </svg>
                                        ) : (
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Partner Profile (Right) */}
                        <div className={`pointer-events-auto flex items-center gap-3 bg-white p-3 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 min-w-[240px] max-w-[260px] transition-all duration-500 origin-bottom-left ${isConnected || isSearching ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                            <div className="relative shrink-0">
                                <div className="w-12 h-12 rounded-full bg-slate-50 overflow-hidden flex items-center justify-center border border-slate-100">
                                    {/* Partner Avatar / Placeholder */}
                                    {isConnected && partnerCountryCode ? (
                                        <ReactCountryFlag
                                            countryCode={partnerCountryCode}
                                            svg
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    ) : (
                                        <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    )}
                                </div>
                                {/* Online Status Indicator */}
                                <div className={`absolute top-0 right-0 w-3 h-3 rounded-full border-[2px] border-white ${isConnected ? (partnerSignalStrength === 'poor' ? 'bg-amber-500' : 'bg-green-500') : 'bg-slate-300'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className={`font-bold text-sm truncate pr-2 ${isConnected ? 'text-slate-800' : 'text-slate-400'}`}>
                                        {isConnected ? (partnerCountry || 'Stranger') : 'Searching...'}
                                    </h3>
                                    {isConnected && (
                                        <span className="text-[8px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                                            88.4 MHZ
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium truncate mb-2">
                                    {isConnected
                                        ? (partnerCountryCode ? `${partnerCountryCode} • Connected` : 'Unknown')
                                        : 'Scanning frequencies...'}
                                </p>

                                {/* Actions Row - Only active when connected, or disabled style */}
                                <div className={`flex items-center gap-2 transition-opacity duration-300 ${isConnected ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                    <button className="bg-[#FF0055] hover:bg-[#D40047] text-white text-[10px] font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm shadow-red-200">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                        ADD
                                    </button>
                                    <div
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${partnerIsMuted
                                            ? 'bg-red-50 text-red-500'
                                            : 'bg-slate-50 text-slate-300'
                                            }`}
                                        title={partnerIsMuted ? "Partner is Muted" : "Partner is Speaking"}
                                    >
                                        {partnerIsMuted ? (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>



                    </div>
                </div>

            </div>

            {/* Bottom Full-Width Toolbar - Moved outside flex container for stability */}
            <div className="absolute bottom-0 left-0 w-full h-20 bg-white border-t border-slate-50 px-8 flex items-center justify-between z-50">

                {/* Left Actions */}
                <div className="flex items-center gap-8 md:gap-12 w-1/3 justify-start">
                    <ToolbarIconBtn
                        icon={
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                        label="History"
                        onClick={onNavigateToHistory}
                    />
                    <ToolbarIconBtn
                        icon={
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        }
                        label="Friends"
                        onClick={() => { }} // Placeholder
                    />
                </div>

                {/* Center Main Action - FILTERS or AUDIO CONTROLS */}
                <div className="flex items-center justify-center">
                    {isConnected ? (
                        /* Connected State: Audio Controls */
                        <button
                            onClick={onToggleMute}
                            className={`h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${isMuted
                                ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-200'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105'
                                }`}
                            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                        >
                            {isMuted ? (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            )}
                        </button>
                    ) : (
                        /* Default/Searching State: Filters */
                        <div className="relative group">
                            <button
                                onClick={() => setFiltersOpen && setFiltersOpen(!filtersOpen)}
                                className={`h-11 pl-5 pr-6 rounded-full flex items-center justify-center gap-3 transition-all duration-300 border ${filtersOpen || (selectedCountry && selectedCountry !== 'GLOBAL')
                                    ? 'bg-[#FF8ba7]/10 border-[#FF8ba7] text-[#FF8ba7] shadow-inner'
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-[#FF8ba7] hover:text-[#FF8ba7] hover:bg-white'
                                    }`}
                                title="Filter by Country"
                            >
                                {selectedCountry && selectedCountry !== 'GLOBAL' ? (
                                    <>
                                        <div className="w-5 h-5 rounded-full overflow-hidden border border-black/10 shadow-sm relative shrink-0">
                                            <ReactCountryFlag
                                                countryCode={selectedCountry}
                                                svg
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        </div>
                                        <span className="font-bold text-sm tracking-wide">{selectedCountry}</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21c0-2.5 4-5 9-5s9 2.5 9 5" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11a5 5 0 100-10 5 5 0 000 10z" />
                                        </svg>
                                        <span className="font-bold text-sm tracking-wide">Global</span>
                                    </>
                                )}
                                <svg className={`w-3 h-3 transition-transform duration-300 ${filtersOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                        </div>
                    )}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4 md:gap-8 w-1/3 justify-end">
                    <ToolbarIconBtn
                        icon={
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        }
                        label="Notifications"
                        active={showChat}
                        badge={messages.length > 0}
                        onClick={() => setShowChat(!showChat)}
                    />
                </div>
            </div>

            {/* Audio Element */}
            <audio ref={remoteAudioRef} autoPlay />

            {/* Chat Popover - Positioned above the toolbar */}
            <div className={`absolute bottom-28 right-8 z-40 w-80 transition-all duration-300 origin-bottom-right ${showChat ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}`}>
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-white/50 overflow-hidden h-96 flex flex-col ring-1 ring-slate-100">
                    <div className="px-5 py-3 border-b border-slate-100 bg-white/50 flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-sm">Messages</span>
                        <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-slate-600">
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



        </div>
    );
};

// Simplified Toolbar Icon Button
const ToolbarIconBtn = ({ icon, label, onClick, active = false, badge = false }: any) => (
    <button
        onClick={onClick}
        className={`relative group flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${active
            ? 'bg-slate-100 text-[#FF8ba7]'
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
        title={label}
    >
        {icon}
        {badge && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm" />
        )}
        <span className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap">
            {label}
        </span>
    </button>
);
