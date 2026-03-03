'use client';

import React from 'react';
import { Gamepad2, Mic2, Users2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UpcomingBadge } from '@/components/UpcomingBadge';

const features = [
    {
        title: 'Soul game',
        onlineCount: '79k+',
        icon: Gamepad2,
        color: 'bg-pink-50 text-pink-50', // Note: using light color for bg, text is handled below
        iconColor: 'text-pink-500',
        onlineColor: 'text-pink-400',
        disabled: true
    },
    {
        title: 'Voice game',
        onlineCount: '77k+',
        icon: Mic2,
        color: 'bg-emerald-50 text-emerald-50',
        iconColor: 'text-emerald-500',
        onlineColor: 'text-emerald-400',
        disabled: false
    },
    {
        title: 'Party Match',
        onlineCount: '31k+',
        icon: Users2,
        color: 'bg-indigo-50 text-indigo-50',
        iconColor: 'text-indigo-500',
        onlineColor: 'text-indigo-400',
        disabled: true
    }
];

interface FeatureCardsProps { }

export const FeatureCards = () => {
    const router = useRouter();

    const handleAction = (title: string, disabled: boolean) => {
        if (disabled) return;
        if (title === 'Voice game') {
            router.push('/app/voice');
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {features.map((feature) => (
                <div
                    key={feature.title}
                    onClick={() => handleAction(feature.title, feature.disabled)}
                    className={`group relative bg-white border border-zinc-100 shadow-sm rounded-2xl p-3.5 flex flex-col items-center text-center transition-all duration-300 ${!feature.disabled ? 'hover:scale-[1.02] hover:shadow-xl hover:shadow-pink-500/10 hover:border-pink-200 cursor-pointer' : 'opacity-75'
                        } overflow-hidden min-h-[150px] justify-center z-0`}
                >
                    {/* Background Illustration */}
                    <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
                        <img src="/feature_bg.png" alt="" className="w-full h-full object-cover" />
                    </div>

                    {/* Background Gradient Blur */}
                    <div className={`absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br ${feature.iconColor.replace('text', 'from').replace('500', '400')} to-white opacity-5 blur-2xl group-hover:opacity-10 transition-opacity z-0`} />

                    <div className="flex flex-col items-center z-10 w-full">
                        <div className={`p-2.5 rounded-2xl ${feature.color} mb-2.5 shadow-sm`}>
                            <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
                        </div>

                        <h3 className="text-[13px] font-bold text-zinc-900 mb-1 tracking-tight uppercase">{feature.title}</h3>

                        {!feature.disabled ? (
                            <div className="flex items-center gap-1 justify-center">
                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                <p className={`text-[9px] font-bold ${feature.onlineColor} tracking-wide uppercase`}>
                                    <span className="text-zinc-900 text-[10px] font-bold">{feature.onlineCount}</span> online
                                </p>
                            </div>
                        ) : (
                            <UpcomingBadge variant="small" />
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
