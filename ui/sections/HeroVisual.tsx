'use client';

import React from 'react';

export default function HeroVisual() {
    return (
        <div className="relative w-[500px] h-[580px] scale-[0.9] xl:scale-100 flex items-center justify-center">

            {/* Top Left Laughing Emoji */}
            <div className="absolute top-[0px] left-[5%] z-50 animate-bounce-subtle">
                <div className="w-[60px] h-[60px] bg-[#FFD13B] rounded-full shadow-[0_12px_24px_rgba(0,0,0,0.15)] flex items-center justify-center text-[32px] border-[3px] border-white -rotate-[12deg] hover:scale-110 transition-transform cursor-pointer">
                    😆
                </div>
            </div>

            {/* Cooler Card (Middle Left) */}
            <div className="absolute top-[160px] left-[0px] w-[210px] h-[230px] rounded-[24px] overflow-hidden z-20 bg-white shadow-[0_15px_35px_rgba(0,0,0,0.08)] border-[6px] border-white transition-transform duration-500 hover:rotate-2">
                <img
                    src="/hero/cooler.png"
                    alt="Outdoor cooler"
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 w-8 h-8 bg-white/95 rounded-lg flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                    </svg>
                </div>
            </div>

            {/* Tall Main Story Card (Anchor) */}
            <div className="absolute top-[20px] right-[20px] w-[290px] h-[500px] rounded-[32px] overflow-hidden z-10 shadow-[0_20px_45px_rgba(0,0,0,0.15)] border-[8px] border-white bg-white transition-all duration-500 hover:-translate-y-2">
                <img
                    src="/hero/story.png"
                    alt="Happy friends"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>

                {/* Pink Timer Badge */}
                <div className="absolute top-5 right-5 bg-[#ec4899] text-white text-[13px] font-[600] px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                    </svg>
                    21:05
                </div>

                {/* Story Progress Bar */}
                <div className="absolute bottom-6 left-0 w-full px-8 flex items-center gap-1.5 z-10">
                    <div className="h-[3px] flex-1 bg-white/30 rounded-full overflow-hidden">
                        <div className="h-full w-[75%] bg-white rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* Small DJ Card (Bottom Left) */}
            <div className="absolute bottom-[40px] left-[40px] w-[190px] h-[260px] rounded-[28px] overflow-hidden z-30 bg-white shadow-[0_20px_40px_rgba(0,0,0,0.12)] border-[6px] border-white transition-transform duration-500 hover:-rotate-1">
                <div className="h-[75%] w-full overflow-hidden">
                    <img
                        src="/hero/dj.png"
                        alt="DJ Vibes"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="p-3 bg-white h-[25%] flex flex-col gap-1.5">
                    <div className="w-3/4 h-2 bg-gray-100 rounded-full"></div>
                    <div className="w-1/2 h-2 bg-gray-50 rounded-full"></div>
                </div>
                {/* Pink Icon */}
                <div className="absolute top-3.5 left-3.5 w-9 h-9 bg-[#ec4899] rounded-full flex items-center justify-center shadow-md border-2 border-white">
                    <svg className="w-4.5 h-4.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                </div>
            </div>

            {/* Circular Profile Overlay (Centered Over Story) */}
            <div className="absolute bottom-[0px] right-[110px] w-[140px] h-[140px] rounded-full bg-white border-[5px] border-[#ec4899] shadow-[0_15px_35px_rgba(0,0,0,0.18)] z-40 p-[3px] transition-transform hover:scale-105">
                <img
                    src="/hero/profile.png"
                    alt="User Profile"
                    className="w-full h-full rounded-full object-cover"
                />
            </div>

            {/* Right Pink Heart Emoji */}
            <div className="absolute bottom-[140px] right-[-10px] z-50 animate-glow-pulse">
                <div className="w-[64px] h-[64px] bg-[#ec4899] rounded-full shadow-[0_12px_24px_rgba(236,72,153,0.3)] flex items-center justify-center text-white border-[3px] border-white -rotate-[8deg] hover:scale-125 transition-transform cursor-pointer">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                </div>
            </div>

        </div>
    );
}
