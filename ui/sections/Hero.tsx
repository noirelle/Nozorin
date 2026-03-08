'use client';

import React from 'react';
import HeroVisual from './HeroVisual';
import NozorinLogo from '../components/Logo';

export default function Hero({ onJoin }: { onJoin: (mode: 'chat' | 'voice') => void }) {
    return (
        <section className="w-full h-[100dvh] flex flex-col lg:flex-row font-sans text-[#1c1e21] overflow-hidden bg-white">

            {/* ── LEFT PANEL (White) ── */}
            <div className="lg:w-[57%] h-full relative flex flex-col justify-center items-center bg-white border-r border-[#fce7f3]">

                {/* Brand Logo */}
                <div className="absolute top-8 left-8 lg:top-10 lg:left-12 z-30">
                    <NozorinLogo className="w-[64px] h-[64px]" />
                </div>

                {/* Content Container */}
                <div className="flex flex-col lg:flex-row items-center justify-center gap-4 xl:gap-8 w-full px-20 lg:px-56 xl:px-72 z-10">

                    {/* Headline */}
                    <div className="shrink-0 text-left transform translate-y-24">
                        <h1 className="text-[2.8rem] lg:text-[3.4rem] xl:text-[4.0rem] font-bold text-[#1c1e21] leading-[0.98] tracking-tight">
                            Make<br />
                            connections<br />
                            that<br />
                            <span className="text-[#ec4899]">matter.</span>
                        </h1>
                    </div>

                    {/* Media Collage */}
                    <div className="shrink-0 scale-[0.55] lg:scale-[0.65] xl:scale-[0.8] -mr-8 xl:-mr-12">
                        <HeroVisual />
                    </div>
                </div>
            </div>

            {/* ── RIGHT PANEL (Interactive) ── */}
            <div className="lg:w-[43%] h-full flex flex-col items-center justify-center bg-white relative">

                {/* Login Form Container */}
                <div className="flex flex-col items-start w-full max-w-[620px] px-8 lg:px-12">

                    <h2 className="text-[20px] lg:text-[22px] font-medium text-[#1c1e21] mb-6">Login into Nozorin</h2>

                    {/* Form Fields Stack */}
                    <div className="w-full flex flex-col gap-3">
                        <input
                            type="text"
                            disabled
                            placeholder="Email or mobile number"
                            className="w-full h-[52px] px-4 rounded-xl border border-[#fce7f3] bg-gray-50/50 cursor-not-allowed opacity-60 text-[17px] outline-none"
                        />
                        <input
                            type="password"
                            disabled
                            placeholder="Password"
                            className="w-full h-[52px] px-4 rounded-xl border border-[#fce7f3] bg-gray-50/50 cursor-not-allowed opacity-60 text-[17px] outline-none"
                        />

                        <div className="mt-3">
                            <button
                                disabled
                                className="w-full h-[48px] bg-[#ec4899] opacity-40 cursor-not-allowed text-white rounded-full font-bold text-[17px]"
                            >
                                Log in
                            </button>
                        </div>

                        <div className="flex justify-center mt-4">
                            <button disabled className="text-[#ec4899] opacity-40 cursor-not-allowed text-[15px] font-medium transition-all">
                                Forgot password?
                            </button>
                        </div>

                        <div className="h-2 lg:h-4 border-b border-[#fce7f3] mb-8 lg:mb-10 w-full opacity-50"></div>

                        {/* Guest Access Button (Pink Theme) */}
                        <div className="w-full">
                            <button
                                onClick={() => onJoin('voice')}
                                className="w-full h-[48px] border border-[#ec4899] bg-white hover:bg-[#fdf2f8] text-[#ec4899] rounded-full font-bold text-[17px] transition-all active:scale-[0.98] cursor-pointer shadow-sm shadow-[#ec4899]/10"
                            >
                                Continue as Guest
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
