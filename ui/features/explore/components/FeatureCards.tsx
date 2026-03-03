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
        disabled: true
    },
    {
        title: 'Voice Game',
        onlineCount: 8432,
        icon: Mic2,
        color: 'from-purple-500 to-indigo-600',
        disabled: false
    },
    {
        title: 'Party Match',
        onlineCount: 1340,
        icon: Users2,
        color: 'from-orange-400 to-pink-500',
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {features.map((feature) => (
                <div
                    key={feature.title}
                    onClick={() => handleAction(feature.title, feature.disabled)}
                    className={`group relative bg-white border border-pink-100 shadow-sm rounded-[1.75rem] p-4 flex flex-col items-center text-center transition-all duration-300 ${!feature.disabled ? 'hover:scale-[1.02] hover:shadow-xl hover:shadow-pink-500/10 hover:border-pink-200 cursor-pointer' : 'opacity-75'
                        } overflow-hidden min-h-[170px] justify-center z-0`}
                >
                    {/* Background Illustration */}
                    <div className="absolute inset-0 z-[-1] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none">
                        <img src="/feature_bg.png" alt="" className="w-full h-full object-cover" />
                    </div>

                    {/* Background Gradient Blur */}
                    <div className={`absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity z-[-1]`} />

                    <div className="flex flex-col items-center z-10 w-full">
                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${feature.color} mb-3 shadow-lg shadow-pink-500/20`}>
                            <feature.icon className="w-5 h-5 text-white" />
                        </div>

                        <h3 className="text-lg font-bold text-zinc-900 mb-1 tracking-tight">{feature.title}</h3>

                        {!feature.disabled ? (
                            <div className="flex items-center gap-1.5 justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <p className="text-zinc-500 text-[10px] font-bold tracking-wide uppercase">
                                    <span className="text-zinc-900 text-[11px]">{feature.onlineCount.toLocaleString()}</span> online
                                </p>
                            </div>
                        ) : (
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-3 py-1 bg-zinc-50 rounded-full border border-zinc-100">
                                Coming Soon
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
