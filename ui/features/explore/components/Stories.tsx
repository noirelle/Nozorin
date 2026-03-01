'use client';

import React from 'react';

const stories = [
    { id: 1, username: 'historyisti...', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
    { id: 2, username: 'kairi.art01', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' },
    { id: 3, username: 'positivityd...', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mark' },
    { id: 4, username: 'coding_kn...', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna' },
    { id: 5, username: 'thinkingmi...', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver' },
    { id: 6, username: 'historypho...', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe' },
    { id: 7, username: 'vintage.vib...', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo' },
];

export const Stories = () => {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-sm font-semibold text-zinc-400">Stories</span>
                <span className="text-[10px] font-bold text-zinc-600 bg-zinc-900/50 px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm border border-zinc-800/50">Upcoming</span>
            </div>

            <div className="flex gap-4 overflow-x-auto pt-6 pb-2 scrollbar-hide">
                {/* 1. Profile Note (Upcoming feature) */}
                <div className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer">
                    <div className="relative">
                        <div className="p-[2px] rounded-full bg-zinc-800">
                            <div className="p-[2px] bg-black rounded-full">
                                <img
                                    src="/social/arisu.png"
                                    alt="Arisu"
                                    className="w-14 h-14 rounded-full border border-black object-cover"
                                />
                            </div>
                        </div>
                        {/* Messenger-style Note Bubble - Fixed Alignment */}
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.8)] animate-bounce-slow z-10 whitespace-nowrap">
                            <span className="text-[9px] font-black text-white uppercase tracking-tighter">Upcoming</span>
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 border-r border-b border-zinc-800 rotate-45" />
                        </div>
                    </div>
                    <span className="text-[11px] font-bold text-zinc-500">Your Note</span>
                </div>

                {/* 2. Existing Shadowed Stories */}
                {stories.map((story) => (
                    <div key={story.id} className="flex flex-col items-center gap-1.5 shrink-0 opacity-30 grayscale filter blur-[0.3px]">
                        <div className="p-[2px] rounded-full bg-zinc-900">
                            <div className="p-[2px] bg-black rounded-full">
                                <img
                                    src={story.avatar}
                                    alt={story.username}
                                    className="w-14 h-14 rounded-full border border-black object-cover"
                                />
                            </div>
                        </div>
                        <span className="text-[11px] text-zinc-600 max-w-[60px] truncate font-medium">
                            {story.username}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
