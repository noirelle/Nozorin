'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import ReactCountryFlag from "react-country-flag";
import { UserPlus, Phone, Clock } from 'lucide-react';

const suggestions = [
    { id: 1, username: 'Tephanieeeeeeeeeee', subtitle: 'Followed by lyraiei21', avatar: 'https://i.pravatar.cc/150?u=8' },
    { id: 2, username: 'Jim Villacorza', subtitle: 'Followed by lyraiei21', avatar: 'https://i.pravatar.cc/150?u=9' },
    { id: 3, username: 'Ven', subtitle: 'Suggested for you', avatar: 'https://i.pravatar.cc/150?u=10' },
    { id: 4, username: 'khate', subtitle: 'Suggested for you', avatar: 'https://i.pravatar.cc/150?u=11' },
    { id: 5, username: 'Kylie', subtitle: 'Followed by ddzarjane', avatar: 'https://i.pravatar.cc/150?u=12' },
];

const mockHistory = [
    { id: 1, username: 'Noirelle', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', duration: '08:12', country: 'US', isActive: true, isFriend: false },
    { id: 2, username: 'Xenon', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Xenon', duration: '03:45', country: 'CA', isActive: false, isFriend: true },
    { id: 3, username: 'Sakura', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sakura', duration: '12:20', country: 'JP', isActive: true, isFriend: false },
    { id: 4, username: 'Viper', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Viper', duration: '01:15', country: 'DE', isActive: false, isFriend: false },
    { id: 5, username: 'Sakura', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sakura', duration: '12:20', country: 'JP', isActive: true, isFriend: false },
    { id: 6, username: 'Viper', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Viper', duration: '01:15', country: 'DE', isActive: false, isFriend: false },
    { id: 7, username: 'Sakura', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sakura', duration: '12:20', country: 'JP', isActive: true, isFriend: false },
    { id: 8, username: 'Viper', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Viper', duration: '01:15', country: 'DE', isActive: false, isFriend: false },
];

const mockRequests = [
    { id: 1, username: 'Luna_M', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna', country: 'FR', time: '2m ago' },
];

const mockPending = [
    { id: 1, username: 'Ghost', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ghost', country: 'BR', status: 'Sent' },
];

export const RightSidebar = () => {
    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState<'history' | 'requests' | 'pending'>('history');
    const isVoiceGame = pathname === '/app/voice';

    return (
        <aside className="w-[320px] pt-8 pl-8 hidden lg:block flex flex-col h-screen overflow-hidden">
            {/* 1. Fixed Header Area */}
            <div className="flex-none">
                {isVoiceGame ? (
                    <div className="flex items-center gap-6 mb-8 border-b border-zinc-900 pb-2">
                        {['history', 'requests', 'pending'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                    ? 'text-white'
                                    : 'text-zinc-600 hover:text-zinc-400'
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <div className="h-0.5 bg-white mt-1.5 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                ) : (
                    <>
                        {pathname === '/explore' && (
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <img
                                        src="/social/arisu.png"
                                        alt="Arisu"
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-white">a1r4su</p>
                                        <p className="text-sm text-zinc-400">Arisu</p>
                                    </div>
                                </div>
                                <button className="text-xs font-semibold text-blue-500 hover:text-white">You</button>
                            </div>
                        )}
                        <div className="flex items-center justify-between mb-4 mt-2">
                            <span className="text-sm font-semibold text-zinc-400">Suggested for you</span>
                            <button className="text-xs font-semibold text-white">See All</button>
                        </div>
                    </>
                )}
            </div>

            {/* 2. Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide pr-2">
                <div className="space-y-6">
                    {isVoiceGame ? (
                        <>
                            {activeTab === 'history' && mockHistory.map((user) => (
                                <div key={user.id} className="group flex items-center justify-between animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full border border-white/5 bg-zinc-900 p-0.5" />
                                            {user.isActive && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full" />}
                                        </div>
                                        <div className="max-w-[120px]">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-bold text-white truncate">{user.username}</p>
                                                <ReactCountryFlag countryCode={user.country} svg className="w-3 h-2 opacity-60" />
                                            </div>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Clock className="w-2.5 h-2.5 text-zinc-600" />
                                                <p className="text-[10px] font-bold text-zinc-500 tracking-tighter tabular-nums">{user.duration}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!user.isFriend && (
                                            <button className="p-2 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-xl transition-all">
                                                <UserPlus className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button className="p-2 bg-white/5 hover:bg-white text-zinc-400 hover:text-black rounded-xl transition-all">
                                            <Phone className="w-3.5 h-3.5 fill-current" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {activeTab === 'requests' && mockRequests.map(req => (
                                <div key={req.id} className="group flex items-center justify-between animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={req.avatar} alt={req.username} className="w-10 h-10 rounded-full border border-white/5 bg-zinc-900 p-0.5" />
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full" />
                                        </div>
                                        <div className="max-w-[120px]">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-bold text-white truncate">{req.username}</p>
                                                <ReactCountryFlag countryCode={req.country} svg className="w-3 h-2 opacity-60" />
                                            </div>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Clock className="w-2.5 h-2.5 text-zinc-600" />
                                                <p className="text-[10px] font-bold text-zinc-500 tracking-tighter uppercase">{req.time}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1.5 bg-white hover:bg-zinc-200 text-black text-[10px] font-black rounded-xl transition-all shadow-lg active:scale-95">
                                        Accept
                                    </button>
                                </div>
                            ))}
                            {activeTab === 'pending' && mockPending.map(p => (
                                <div key={p.id} className="group flex items-center justify-between animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={p.avatar} alt={p.username} className="w-10 h-10 rounded-full border border-white/5 bg-zinc-900 p-0.5 grayscale" />
                                        </div>
                                        <div className="max-w-[120px]">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-bold text-zinc-400 truncate">{p.username}</p>
                                                <ReactCountryFlag countryCode={p.country} svg className="w-3 h-2 opacity-30 grayscale" />
                                            </div>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{p.status}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="p-2 hover:bg-zinc-900 text-zinc-700 hover:text-red-500 rounded-xl transition-all">
                                        <Clock className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </>
                    ) : (
                        suggestions.map((user) => (
                            <div key={user.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full" />
                                    <div className="max-w-[150px]">
                                        <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                                        <p className="text-xs text-zinc-400 truncate">{user.subtitle}</p>
                                    </div>
                                </div>
                                <button className="text-xs font-semibold text-blue-500 hover:text-white">Follow</button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 3. Fixed Footer Area */}
            <footer className="flex-none pt-10 pb-12 mt-auto border-t border-zinc-900/50 bg-black shadow-[0_-10px_30px_rgba(0,0,0,0.8)] z-10">
                <div className="flex flex-wrap gap-x-2 gap-y-1 mb-4">
                    {['About', 'Help', 'Press', 'API', 'Jobs', 'Privacy', 'Terms', 'Locations', 'Language', 'Meta Verified'].map((link) => (
                        <span key={link} className="cursor-pointer hover:underline text-[11px] text-zinc-500 font-medium">{link}</span>
                    ))}
                </div>
                <p className="font-black tracking-widest opacity-20 text-[9px] text-zinc-500 uppercase">© 2026 NOZORIN FROM NORELE</p>
            </footer>
        </aside>
    );
};
