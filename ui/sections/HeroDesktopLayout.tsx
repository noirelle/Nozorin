'use client';

import React from 'react';
import HeroVisual from './HeroVisual';

export default function HeroDesktopLayout({ onJoin }: { onJoin: (mode: 'chat' | 'voice') => void }) {
    return (
        <section className="w-full h-[100dvh] hidden xl:flex flex-row font-sans text-[#1c1e21] overflow-hidden bg-white">

            {/* ── LEFT PANEL (White) ── */}
            <div className="w-[57%] h-full relative flex flex-col justify-center items-center bg-white border-r border-[#fce7f3] py-0">

                {/* Brand Logo */}
                <div className="absolute top-10 left-12 z-30">
                    <img src="/nozorin_logo.svg" alt="Nozorin Logo" className="w-[64px] h-[64px]" />
                </div>

                {/* Content Container */}
                <div className="flex flex-row items-center justify-center w-full px-56 xl:px-72 z-10 pt-0">

                    {/* Headline */}
                    <div className="shrink-0 text-left z-20 transform translate-y-24 mb-0">
                        <h1 className="text-[3.4rem] xl:text-[4.0rem] font-bold text-[#1c1e21] leading-[0.98] tracking-tight">
                            Make<br />
                            connections<br />
                            that<br />
                            <span className="text-[#ec4899]">matter.</span>
                        </h1>
                    </div>

                    {/* Media Collage */}
                    {/* <div className="shrink-0 flex items-center justify-center pointer-events-auto origin-center transform scale-[0.55] xl:scale-[0.8] -mr-8 xl:-mr-12 my-0">
                        <HeroVisual />
                    </div> */}
                </div>
            </div>

            {/* ── RIGHT PANEL (Interactive) ── */}
            <div className="w-[43%] h-full flex flex-col items-center justify-center bg-white relative">

                {/* Login Form Container */}
                <div className="flex flex-col items-start w-full max-w-[620px] px-12">

                    <h2 className="text-[22px] font-semibold text-[#1c1e21] mb-6 w-full text-left">Login into Nozorin</h2>

                    {/* Form Fields Stack */}
                    <div className="w-full flex flex-col gap-3">
                        <input
                            type="text"
                            disabled
                            placeholder="Email or mobile number"
                            className="w-full h-[52px] px-4 rounded-xl border-2 border-[#fce7f3] bg-gray-50/50 cursor-not-allowed opacity-60 text-[17px] font-medium outline-none"
                        />
                        <input
                            type="password"
                            disabled
                            placeholder="Password"
                            className="w-full h-[52px] px-4 rounded-xl border-2 border-[#fce7f3] bg-gray-50/50 cursor-not-allowed opacity-60 text-[17px] font-medium outline-none"
                        />

                        <div className="mt-3">
                            <button
                                disabled
                                className="w-full h-[48px] bg-[#ec4899] opacity-40 cursor-not-allowed text-white rounded-full font-extrabold text-[17px]"
                            >
                                Log in
                            </button>
                        </div>

                        <div className="flex justify-center w-full mt-4">
                            <button disabled className="text-[#ec4899] opacity-40 cursor-not-allowed text-[15px] font-bold transition-all">
                                Forgot password?
                            </button>
                        </div>

                        <div className="h-4 border-b-2 border-[#fce7f3] mt-4 mb-10 w-full opacity-50"></div>

                        {/* Guest Access Button (Pink Theme) */}
                        <div className="w-full">
                            <button
                                onClick={() => onJoin('voice')}
                                className="w-full h-[48px] border-[3px] border-[#ec4899] bg-white hover:bg-[#fdf2f8] text-[#ec4899] rounded-full font-extrabold text-[17px] transition-all active:scale-[0.98] cursor-pointer shadow-sm shadow-[#ec4899]/10"
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
