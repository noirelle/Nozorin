'use client';

import React from 'react';
import { Gamepad2, Mic2, Users2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const features = [
    {
        title: 'Soul Game',
        description: 'Find your perfect match today.',
        icon: Gamepad2,
        color: 'from-pink-500 to-rose-600',
        action: 'Coming Soon',
        disabled: true
    },
    {
        title: 'Voice Game',
        description: 'Instant voice chat rooms.',
        icon: Mic2,
        color: 'from-purple-500 to-indigo-600',
        action: 'Join Voice',
        disabled: false
    },
    {
        title: 'Party Match',
        description: 'Meet multiple people at once.',
        icon: Users2,
        color: 'from-orange-400 to-pink-500',
        action: 'Coming Soon',
        disabled: true
    }
];

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
                    className={`group relative bg-zinc-900/80 border border-zinc-800/50 rounded-[2rem] p-5 flex flex-col items-center text-center transition-all duration-300 ${!feature.disabled ? 'hover:scale-[1.02] hover:bg-zinc-800/80 hover:shadow-2xl hover:shadow-black/50 cursor-pointer' : 'opacity-75'
                        } overflow-hidden min-h-[220px] justify-between`}
                >
                    {/* Background Gradient Blur */}
                    <div className={`absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`} />

                    <div className="flex flex-col items-center">
                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${feature.color} mb-3 shadow-lg shadow-black/20`}>
                            <feature.icon className="w-5 h-5 text-white" />
                        </div>

                        <h3 className="text-lg font-bold text-white mb-1 tracking-tight">{feature.title}</h3>
                        <p className="text-zinc-500 text-xs leading-tight font-medium max-w-[140px]">
                            {feature.description}
                        </p>
                    </div>

                    <button
                        disabled={feature.disabled}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAction(feature.title, feature.disabled);
                        }}
                        className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all duration-200 shadow-lg ${feature.disabled
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-white text-black hover:bg-zinc-200 active:scale-95'
                            }`}
                    >
                        {feature.action}
                    </button>
                </div>
            ))}
        </div>
    );
};
