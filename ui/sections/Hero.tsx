'use client';

import React from 'react';
import { MessageIcon, MicIcon } from '../components/icons';
import HeroVisual from './HeroVisual';
import { useStats } from '../hooks';

export default function Hero({ onJoin }: { onJoin: (mode: 'chat' | 'voice') => void }) {
    const { stats } = useStats();

    // Format number for display (e.g., 12500 -> "12.5k+")
    const formatNumber = (num: number) => {
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}k+`;
        }
        return `${num}+`;
    };

    return (
        <section className="relative flex flex-col lg:flex-row items-center justify-center lg:justify-between px-6 py-8 md:py-16 lg:py-20 max-w-7xl mx-auto gap-8 lg:gap-12 overflow-hidden lg:min-h-[600px]">

            {/* Background Decoration - simplified for elegance */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-pink-50/50 rounded-full blur-3xl opacity-60"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-50/30 rounded-full blur-3xl opacity-40"></div>
            </div>

            <div className="flex-1 max-w-2xl z-10 w-full pt-4 lg:pt-0 text-center lg:text-left">


                <h1 className="text-5xl sm:text-7xl lg:text-[5.5rem] font-bold text-gray-900 leading-[1] mb-4 md:mb-6 tracking-tight">
                    Discover <br />
                    <span className="text-[#FF8ba7]">People.</span>
                </h1>

                <p className="text-lg md:text-xl text-gray-500 mb-8 max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed">
                    Connect instantly with people from over 190 countries. Start a conversation and make new friends today.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-center lg:justify-start">
                    <button
                        onClick={() => onJoin('voice')}
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-[#FF8ba7] hover:bg-[#ff7b9c] text-white rounded-full font-bold text-lg shadow-xl shadow-pink-200/50 hover:shadow-2xl hover:shadow-pink-300/50 transition-all transform hover:-translate-y-1 active:scale-95 w-full sm:w-auto min-w-[200px]"
                    >
                        <MicIcon className="w-5 h-5" />
                        Start Matching
                    </button>
                </div>

                <div className="mt-8 md:mt-12 flex items-center justify-center lg:justify-start gap-4 text-sm font-medium text-gray-400">
                    <div className="flex -space-x-3">
                        <div className="w-10 h-10 rounded-full border-[3px] border-white shadow-sm bg-gray-100 overflow-hidden">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                        </div>
                        <div className="w-10 h-10 rounded-full border-[3px] border-white shadow-sm bg-gray-100 overflow-hidden">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" alt="User" />
                        </div>
                        <div className="w-10 h-10 rounded-full border-[3px] border-white shadow-sm bg-gray-100 overflow-hidden">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mark" alt="User" />
                        </div>
                    </div>
                    <div>
                        <span className="text-gray-900 font-bold block">{formatNumber(stats.people_online)} People Online</span>
                        <span className="text-xs text-green-500 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Live Now
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full flex items-center justify-center lg:justify-end">
                <HeroVisual />
            </div>
        </section>
    );
}
