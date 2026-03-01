'use client';

import React, { useState } from 'react';
import { UserPlus, Mic2, MoreHorizontal, FastForward } from 'lucide-react';
import ReactCountryFlag from "react-country-flag";

export const VoiceGameRoom = () => {
    const [message, setMessage] = useState('');

    const mockMessages = [
        { id: 1, user: 'Arisu', text: 'Hey! Ready for the voice game?', isSelf: true },
        { id: 2, user: 'Noirelle', text: 'Yeah! Let\'s go 🚀', isSelf: false },
        { id: 3, user: 'Noirelle', text: 'Your voice is actually pretty clear.', isSelf: false },
    ];

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Top Bar: Minimal Timer */}
            <div className="flex justify-end mb-8">
                <div className="flex items-center gap-2 group cursor-default">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[10px] font-bold text-zinc-500 tabular-nums tracking-widest uppercase">00:05:42</span>
                </div>
            </div>

            {/* Core Interaction Layer: Profiles and Skip */}
            <div className="flex items-start justify-between px-12 pb-12 border-b border-zinc-900">
                {/* Local User */}
                <div className="flex flex-col items-center gap-4 flex-1">
                    <div className="relative">
                        <div className="p-0.5 rounded-full bg-zinc-800 ring-4 ring-zinc-950 shadow-2xl">
                            <img
                                src="/social/arisu.png"
                                alt="You"
                                className="w-24 h-24 rounded-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-zinc-900 rounded-full flex items-center justify-center shadow-xl border border-white/5">
                            <ReactCountryFlag countryCode="PH" svg className="w-4 h-3 rounded-sm opacity-80" />
                        </div>
                    </div>
                    <div className="text-center">
                        <h4 className="text-sm font-bold text-white">Arisu</h4>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">Philippines</p>
                    </div>
                </div>

                {/* Center Control: Skip */}
                <div className="flex flex-col items-center gap-4 px-8 pt-4">
                    <button className="w-16 h-16 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 flex items-center justify-center transition-all active:scale-90 group">
                        <FastForward className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Skip</span>
                </div>

                {/* Partner User */}
                <div className="flex flex-col items-center gap-4 flex-1">
                    <div className="relative">
                        <div className="p-0.5 rounded-full bg-purple-500/20 ring-4 ring-zinc-950 shadow-2xl">
                            <img
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                                alt="Noirelle"
                                className="w-24 h-24 rounded-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-zinc-900 rounded-full flex items-center justify-center shadow-xl border border-white/5">
                            <ReactCountryFlag countryCode="US" svg className="w-4 h-3 rounded-sm opacity-80" />
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <div className="text-center">
                            <h4 className="text-sm font-bold text-white">Noirelle</h4>
                            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">United States</p>
                        </div>
                        <button className="flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-zinc-200 text-black text-[10px] font-black rounded-full transition-all uppercase tracking-tight">
                            <UserPlus className="w-3.5 h-3.5" strokeWidth={3} />
                            Add Friend
                        </button>
                    </div>
                </div>
            </div>

            {/* Discussion Layer */}
            <div className="flex-1 flex flex-col min-h-0 pt-8">
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto space-y-4 px-4 scrollbar-hide">
                    {mockMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.isSelf ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${msg.isSelf
                                ? 'bg-zinc-900 text-zinc-100 border border-zinc-800'
                                : 'bg-transparent text-zinc-400 border border-transparent'
                                }`}>
                                <p className="leading-relaxed font-medium">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom Entry Area */}
                <div className="mt-6 mb-10 px-2">
                    <div className="relative flex items-center gap-3 bg-zinc-900/40 rounded-3xl px-4 py-2 border border-zinc-800/50 focus-within:border-zinc-700/50 transition-all duration-300">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Message..."
                                className="w-full h-10 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none"
                            />
                        </div>
                        {message.trim().length > 0 && (
                            <button className="text-sm font-bold text-blue-500 hover:text-blue-400 active:scale-95 transition-all px-2 animate-in fade-in zoom-in duration-200">
                                Send
                            </button>
                        )}
                        <div className="flex items-center gap-1">
                            <button className="p-2 hover:bg-zinc-800/50 rounded-full transition-all text-zinc-600 hover:text-zinc-400">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};
