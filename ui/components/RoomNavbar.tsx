import React from 'react';
import { LogoIcon } from './icons';

interface RoomNavbarProps {
    activeTab: 'video' | 'chat';
    onNavigateToVideo?: () => void;
    onNavigateToChat?: () => void;
    onNavigateToHistory?: () => void;
    variant?: 'desktop' | 'mobile';
}

export function RoomNavbar({
    activeTab,
    onNavigateToVideo,
    onNavigateToChat,
    onNavigateToHistory,
    variant = 'desktop'
}: RoomNavbarProps) {
    // Desktop navbar (for large screens)
    if (variant === 'desktop') {
        return (
            <div className="hidden lg:flex h-20 items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-12">
                    <div className="flex items-center gap-4">
                        <LogoIcon className="w-14 h-14 text-[#FF8ba7]" />
                        <span className="text-4xl font-display font-bold tracking-tight text-white leading-none">nozorin</span>
                    </div>
                    <div className="flex items-center gap-8 hidden xl:flex translate-y-[7px]">
                        {activeTab === 'video' ? (
                            <div className="relative">
                                <button className="text-white font-display font-bold tracking-tight text-xl leading-none shadow-black drop-shadow-md">Video Chat</button>
                                <div className="absolute left-0 right-0 bottom-[-4px] h-0.5 bg-[#FF8ba7]"></div>
                            </div>
                        ) : (
                            <button
                                onClick={onNavigateToVideo}
                                className="text-zinc-400 font-display font-medium tracking-tight text-xl hover:text-white transition-colors leading-none"
                            >
                                Video Chat
                            </button>
                        )}

                        {activeTab === 'chat' ? (
                            <div className="relative">
                                <button className="text-white font-display font-bold tracking-tight text-xl leading-none shadow-black drop-shadow-md">Chats Only</button>
                                <div className="absolute left-0 right-0 bottom-[-4px] h-0.5 bg-[#FF8ba7]"></div>
                            </div>
                        ) : (
                            <button
                                onClick={onNavigateToChat}
                                className="text-zinc-400 font-display font-medium tracking-tight text-xl hover:text-white transition-colors leading-none"
                            >
                                Chats Only
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 translate-y-[7px]">
                    <button
                        onClick={onNavigateToHistory}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white font-display font-medium tracking-tight text-xl transition-colors leading-none group"
                    >
                        <svg className="w-5 h-5 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>History</span>
                    </button>
                </div>
            </div>
        );
    }

    // Mobile navbar (for small screens)
    return (
        <div className="lg:hidden px-4 py-2.5 flex items-center justify-between pointer-events-auto bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-shrink-0">
                    <LogoIcon className="w-7 h-7 text-[#FF8ba7] flex-shrink-0" />
                    <span className="text-lg font-display font-bold tracking-tight text-white leading-none">nozorin</span>
                </div>
                <div className="flex items-center gap-4 translate-y-[2px]">
                    {activeTab === 'video' ? (
                        <div className="relative">
                            <button className="text-white font-display font-bold tracking-tight text-[15px] leading-none shadow-black drop-shadow-md">Video Chat</button>
                            <div className="absolute left-0 right-0 bottom-[-3px] h-0.5 bg-[#FF8ba7]"></div>
                        </div>
                    ) : (
                        <button
                            onClick={onNavigateToVideo}
                            className="text-white/70 font-display font-medium tracking-tight text-[15px] hover:text-white transition-colors shadow-black drop-shadow-md leading-none"
                        >
                            Video Chat
                        </button>
                    )}

                    {activeTab === 'chat' ? (
                        <div className="relative">
                            <button className="text-white font-display font-bold tracking-tight text-[15px] leading-none shadow-black drop-shadow-md">Chats</button>
                            <div className="absolute left-0 right-0 bottom-[-3px] h-0.5 bg-[#FF8ba7]"></div>
                        </div>
                    ) : (
                        <button
                            onClick={onNavigateToChat}
                            className="text-white/70 font-display font-medium tracking-tight text-[15px] hover:text-white transition-colors shadow-black drop-shadow-md leading-none"
                        >
                            Chats
                        </button>
                    )}
                </div>
            </div>
            <button
                onClick={onNavigateToHistory}
                className="flex items-center gap-1.5 text-white/70 hover:text-white font-display font-medium tracking-tight text-[15px] transition-colors leading-none flex-shrink-0 translate-y-[2px]"
            >
                <svg className="w-4 h-4 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>History</span>
            </button>
        </div>
    );
}
