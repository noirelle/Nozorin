'use client';

import React from 'react';
import { Gamepad2, Mic2, Users2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const features = [
    {
        title: 'Soul Game',
        onlineCount: 2450,
        icon: Gamepad2,
        color: 'from-pink-500 to-rose-600',
        action: 'Coming Soon',
        disabled: true
    },
    {
        title: 'Voice Game',
        onlineCount: 8432,
        icon: Mic2,
        color: 'from-purple-500 to-indigo-600',
        action: 'Join Voice',
        disabled: false
    },
    {
        title: 'Party Match',
        onlineCount: 1340,
        icon: Users2,
        color: 'from-orange-400 to-pink-500',
        action: 'Coming Soon',
        disabled: true
    }
];

interface FeatureCardsProps { }

export const FeatureCards = () => {
    const router = useRouter();

    const handleAction = (title: string, disabled: boolean) => {
        if (disabled) return;
        if (title === 'Voice Game') {
            router.push('/app/voice');
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {features.map((feature) => (
                <div
                    key={feature.title}
                    onClick={() => handleAction(feature.title, feature.disabled)}
                    className={`group relative bg-white border border-pink-100 shadow-sm rounded-[2rem] p-5 flex flex-col items-center text-center transition-all duration-300 ${!feature.disabled ? 'hover:scale-[1.02] hover:shadow-xl hover:shadow-pink-500/10 hover:border-pink-200 cursor-pointer' : 'opacity-75'
                        } overflow-hidden min-h-[220px] justify-between z-0`}
                >
                    {/* Background Illustration */}
                    <div className="absolute inset-0 z-[-1] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none">
                        <img src="/feature_bg.png" alt="" className="w-full h-full object-cover" />
                    </div>

                    {/* Background Gradient Blur */}
                    <div className={`absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity z-[-1]`} />

                    <div className="flex flex-col items-center z-10 w-full pt-1">
                        <div className={`p-4 rounded-3xl bg-gradient-to-br ${feature.color} mb-3.5 shadow-lg shadow-pink-500/20`}>
                            <feature.icon className="w-6 h-6 text-white" />
                        </div>

                        <h3 className="text-xl font-bold text-zinc-900 mb-1.5 tracking-tight">{feature.title}</h3>
                        <div className="flex items-center gap-1.5 justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <p className="text-zinc-500 text-[11px] font-bold tracking-wide uppercase">
                                <span className="text-zinc-900 text-xs">{feature.onlineCount.toLocaleString()}</span> online
                            </p>
                        </div>
                    </div>

                    <button
                        disabled={feature.disabled}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAction(feature.title, feature.disabled);
                        }}
                        className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all duration-200 shadow-sm ${feature.disabled
                            ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
                            : 'bg-zinc-900 text-white hover:bg-zinc-800 hover:shadow-md active:scale-95'
                            }`}
                    >
                        {feature.action}
                    </button>
                </div>
            ))}
        </div>
    );
};
