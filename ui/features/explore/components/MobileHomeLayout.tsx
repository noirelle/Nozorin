'use client';

import React from 'react';
import { Gamepad2, Mic2, Users2, MessageSquare, Plus, Mars, Venus } from 'lucide-react';
import ReactCountryFlag from "react-country-flag";
import { useRouter } from 'next/navigation';
import { UpcomingBadge } from '@/components/UpcomingBadge';

const features = [
    {
        title: 'Soul game',
        onlineCount: '79k+',
        icon: Gamepad2,
        color: 'bg-pink-50 text-pink-500',
        onlineColor: 'text-pink-400',
        disabled: true
    },
    {
        title: 'Voice game',
        onlineCount: '77k+',
        icon: Mic2,
        color: 'bg-emerald-50 text-emerald-500',
        onlineColor: 'text-emerald-400',
        disabled: false
    },
    {
        title: 'Party Match',
        onlineCount: '31k+',
        icon: Users2,
        color: 'bg-indigo-50 text-indigo-500',
        onlineColor: 'text-indigo-400',
        disabled: true
    }
];

const mobileUsers = [
    {
        id: 1,
        username: 'noirelle_dev',
        age: 24,
        gender: 'male',
        status: 'Building Nozorin 🚀',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        country: 'US',
        isOnline: true,
        isNew: true
    },
    {
        id: 2,
        username: 'serena_vibe',
        age: 22,
        gender: 'female',
        status: 'Looking for a voice match! 🎙️',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
        country: 'PH',
        isOnline: true
    },
    {
        id: 3,
        username: 'mark_the_player',
        age: 26,
        gender: 'male',
        status: 'Anyone for Soul Game?',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mark',
        country: 'CA',
        isOnline: true
    }
];

export const MobileHomeLayout = () => {
    const router = useRouter();

    const handleAction = (title: string, disabled: boolean) => {
        if (disabled) return;
        if (title === 'Voice game') {
            router.push('/app/voice');
        }
    };

    return (
        <div className="flex flex-col min-h-full bg-white pb-24 overflow-x-hidden animate-in fade-in duration-500">
            {/* 1. Feature Cards Grid */}
            <div className="grid grid-cols-3 gap-3 px-4 pt-4 mb-6">
                {features.map((feature) => (
                    <div
                        key={feature.title}
                        onClick={() => handleAction(feature.title, feature.disabled)}
                        className={`group relative flex flex-col items-center p-3 rounded-2xl bg-white border border-zinc-100 shadow-sm transition-all overflow-hidden min-h-[120px] justify-center ${!feature.disabled
                            ? 'active:scale-95 cursor-pointer hover:border-pink-100'
                            : 'opacity-75 cursor-not-allowed'
                            }`}
                    >
                        {/* Background Illustration */}
                        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
                            <img src="/feature_bg.png" alt="" className="w-full h-full object-cover" />
                        </div>

                        {/* Background Gradient Blur */}
                        <div className={`absolute -top-8 -right-8 w-16 h-16 bg-gradient-to-br ${feature.onlineColor.replace('text', 'from').replace('400', '300')} to-white opacity-5 blur-2xl z-0`} />

                        <div className="flex flex-col items-center z-10 w-full">
                            <div className={`p-2.5 rounded-2xl ${feature.color} mb-2 shadow-sm`}>
                                <feature.icon className="w-5 h-5" />
                            </div>
                            <h3 className="text-[11px] font-bold text-zinc-900 mb-0.5 whitespace-nowrap uppercase tracking-tight">{feature.title}</h3>
                            <div className="flex items-center gap-1">
                                {!feature.disabled ? (
                                    <>
                                        <div className={`w-1 h-1 rounded-full ${feature.onlineColor.replace('text', 'bg')} animate-pulse`} />
                                        <span className={`text-[9px] font-bold ${feature.onlineColor} tracking-tighter uppercase`}>{feature.onlineCount} {feature.title === 'Party Match' ? 'Playing' : 'Online'}</span>
                                    </>
                                ) : (
                                    <UpcomingBadge variant="small" />
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 2. OnlineMatch Highlight Card */}
            <div className="px-4 mb-8">
                <div className="relative bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm border border-zinc-100">
                            <MessageSquare className="w-6 h-6 text-pink-500" strokeWidth={2} />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 font-bold text-zinc-900 tracking-tight text-[15px]">
                                <span>OnlineMatch</span>
                                <span className="text-zinc-300 text-lg leading-none mb-0.5">›</span>
                            </div>
                            <span className="text-zinc-500 text-[11px] font-medium uppercase tracking-wider opacity-80">Meet a new friend online</span>
                        </div>
                    </div>

                    <div className="bg-pink-50 text-pink-600 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-widest border border-pink-100">
                        Wide
                        <span className="text-[8px] opacity-70 mb-0.5">⇌</span>
                    </div>
                </div>
            </div>

            {/* 3. User List */}
            <div className="flex flex-col px-4 space-y-4">
                {mobileUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-4 active:opacity-60 transition-opacity cursor-pointer group">
                        <div className="relative shrink-0">
                            <div className={`p-[2px] rounded-full ${user.isNew ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600' : 'bg-zinc-200'}`}>
                                <div className="p-[2px] bg-white rounded-full relative">
                                    <img
                                        src={user.avatar}
                                        alt={user.username}
                                        className="w-14 h-14 rounded-full object-cover bg-white"
                                    />
                                    {user.isOnline && (
                                        <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full z-10 shadow-sm" />
                                    )}
                                    <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full border border-zinc-100 shadow-sm z-10">
                                        <ReactCountryFlag
                                            countryCode={user.country}
                                            svg
                                            className="w-3.5 h-2.5 rounded-[1px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 min-w-0 border-b border-zinc-100 pb-4">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[14px] font-bold text-zinc-900 truncate tracking-tight">{user.username}</span>
                                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${user.gender === 'female' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'} uppercase tracking-tight`}>
                                    {user.gender === 'female' ? <Venus className="w-2.5 h-2.5" strokeWidth={3} /> : <Mars className="w-2.5 h-2.5" strokeWidth={3} />}
                                    {user.age}
                                </div>
                            </div>
                            <p className="text-[13px] text-zinc-500 font-medium mb-1.5 line-clamp-1 truncate opacity-90">
                                {user.status}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* 4. Floating Status Button */}
            <div className="fixed bottom-[72px] right-4 z-40">
                <button className="flex items-center gap-2 bg-white border border-zinc-200 shadow-lg px-5 h-10 rounded-full text-zinc-900 font-bold text-[13px] uppercase tracking-wide active:scale-95 transition-all">
                    <Plus className="w-5 h-5 text-zinc-900" strokeWidth={2.5} />
                    Status
                </button>
            </div>
        </div>
    );
};
