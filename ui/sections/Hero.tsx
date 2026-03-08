'use client';

import React from 'react';
import HeroVisual from './HeroVisual';
import NozorinLogo from '../components/Logo';

export default function Hero({ onJoin }: { onJoin: (mode: 'chat' | 'voice') => void }) {
    return (
        <section className="w-full h-[100dvh] flex flex-col lg:flex-row font-sans text-[#1c1e21] overflow-hidden bg-white">

            {/* ── LEFT PANEL (White) ── */}
            <div className="w-full lg:w-[57%] h-[51%] sm:h-[60%] lg:h-full relative flex flex-col justify-center items-center bg-white border-b lg:border-b-0 lg:border-r border-[#fce7f3]">

                {/* Brand Logo */}
                <div className="absolute top-4 left-4 lg:top-10 lg:left-12 z-30">
                    <NozorinLogo className="w-[32px] h-[32px] sm:w-[40px] sm:h-[40px] lg:w-[64px] lg:h-[64px]" />
                </div>

                {/* Content Container */}
                <div className="flex flex-col-reverse lg:flex-row items-center justify-center w-full px-4 sm:px-12 md:px-20 lg:px-56 xl:px-72 z-10 pt-4 sm:pt-16 lg:pt-0">

                    {/* Headline */}
                    <div className="shrink-0 text-center lg:text-left z-20 transform lg:translate-y-24 mb-1 sm:mb-2 lg:mb-0">
                        <h1 className="text-[1.5rem] sm:text-[2.6rem] lg:text-[3.4rem] xl:text-[4.0rem] font-bold text-[#1c1e21] leading-[1.05] lg:leading-[0.98] tracking-tight">
                            Make<br className="hidden lg:block" /><span className="lg:hidden"> </span>
                            connections<br />
                            that<br className="hidden lg:block" /><span className="lg:hidden"> </span>
                            <span className="text-[#ec4899]">matter.</span>
                        </h1>
                    </div>

                    {/* Media Collage */}
                    <div className="shrink-0 flex items-center justify-center pointer-events-none lg:pointer-events-auto origin-center transform scale-[0.32] sm:scale-[0.55] lg:scale-[0.55] xl:scale-[0.8] lg:-mr-8 xl:-mr-12 -my-[195px] sm:-my-[120px] lg:my-0">
                        <HeroVisual />
                    </div>
                </div>
            </div>

            {/* ── RIGHT PANEL (Interactive) ── */}
            <div className="w-full lg:w-[43%] h-[49%] sm:h-[40%] lg:h-full flex flex-col items-center justify-center bg-white relative">

                {/* Login Form Container */}
                <div className="flex flex-col items-center lg:items-start w-full max-w-[380px] lg:max-w-[620px] px-6 sm:px-10 lg:px-12">

                    <h2 className="text-[15px] sm:text-[18px] lg:text-[22px] font-medium text-[#1c1e21] mb-2 sm:mb-3 lg:mb-6 w-full text-center lg:text-left">Login into Nozorin</h2>

                    {/* Form Fields Stack */}
                    <div className="w-full flex flex-col gap-1.5 lg:gap-3">
                        <input
                            type="text"
                            disabled
                            placeholder="Email or mobile number"
                            className="w-full h-[38px] sm:h-[46px] lg:h-[52px] px-4 rounded-xl border border-[#fce7f3] bg-gray-50/50 cursor-not-allowed opacity-60 text-[13px] sm:text-[15px] lg:text-[17px] outline-none"
                        />
                        <input
                            type="password"
                            disabled
                            placeholder="Password"
                            className="w-full h-[38px] sm:h-[46px] lg:h-[52px] px-4 rounded-xl border border-[#fce7f3] bg-gray-50/50 cursor-not-allowed opacity-60 text-[13px] sm:text-[15px] lg:text-[17px] outline-none"
                        />

                        <div className="mt-0.5 sm:mt-1 lg:mt-3">
                            <button
                                disabled
                                className="w-full h-[38px] sm:h-[42px] lg:h-[48px] bg-[#ec4899] opacity-40 cursor-not-allowed text-white rounded-[10px] sm:rounded-full font-bold text-[13px] sm:text-[15px] lg:text-[17px]"
                            >
                                Log in
                            </button>
                        </div>

                        <div className="flex justify-center mt-1 sm:mt-2 lg:mt-4">
                            <button disabled className="text-[#ec4899] opacity-40 cursor-not-allowed text-[11px] sm:text-[13px] lg:text-[15px] font-medium transition-all">
                                Forgot password?
                            </button>
                        </div>

                        <div className="h-px sm:h-2 lg:h-4 border-b border-[#fce7f3] my-1 sm:mb-4 lg:mb-10 w-full opacity-50"></div>

                        {/* Guest Access Button (Pink Theme) */}
                        <div className="w-full">
                            <button
                                onClick={() => onJoin('voice')}
                                className="w-full h-[38px] sm:h-[42px] lg:h-[48px] border-2 border-[#ec4899] bg-white hover:bg-[#fdf2f8] text-[#ec4899] rounded-[10px] sm:rounded-full font-bold text-[13px] sm:text-[15px] lg:text-[17px] transition-all active:scale-[0.98] cursor-pointer shadow-sm shadow-[#ec4899]/10"
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
