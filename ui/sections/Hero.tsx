'use client';

import React from 'react';
import HeroVisual from './HeroVisual';
import NozorinLogo from '../components/Logo';

export default function Hero({ onJoin }: { onJoin: (mode: 'chat' | 'voice') => void }) {
    return (
        <section className="w-full h-[100dvh] flex flex-col lg:flex-row font-sans text-[#1c1e21] overflow-hidden bg-white">

            {/* ── LEFT PANEL (White) ── */}
            <div className="w-full lg:w-[57%] flex-1 sm:h-[60%] lg:h-full relative flex flex-col justify-center items-center bg-white border-b lg:border-b-0 lg:border-r border-[#fce7f3] py-2 lg:py-0">

                {/* Brand Logo */}
                <div className="absolute top-[clamp(8px,2vh,16px)] left-[clamp(12px,4vw,20px)] sm:top-4 lg:top-10 lg:left-12 z-30">
                    <NozorinLogo className="w-[clamp(32px,8vw,48px)] h-[clamp(32px,8vw,48px)] sm:w-[40px] sm:h-[40px] lg:w-[64px] lg:h-[64px]" />
                </div>

                {/* Content Container */}
                <div className="flex flex-col-reverse lg:flex-row items-center justify-center w-full px-[clamp(16px,5vw,32px)] sm:px-12 md:px-20 lg:px-56 xl:px-72 z-10 pt-[clamp(2px,1vh,12px)] sm:pt-16 lg:pt-0">

                    {/* Headline */}
                    <div className="shrink-0 text-center lg:text-left z-20 transform lg:translate-y-24 mb-[clamp(2px,1vh,8px)] sm:mb-2 lg:mb-0">
                        <h1 className="text-[clamp(1.3rem,6vw,1.9rem)] sm:text-[2.6rem] lg:text-[3.4rem] xl:text-[4.0rem] font-bold text-[#1c1e21] leading-[1.05] lg:leading-[0.98] tracking-tight">
                            Make<br className="hidden lg:block" /><span className="lg:hidden"> </span>
                            connections<br />
                            that<br className="hidden lg:block" /><span className="lg:hidden"> </span>
                            <span className="text-[#ec4899]">matter.</span>
                        </h1>
                    </div>

                    {/* Media Collage */}
                    <div className="shrink-0 flex items-center justify-center pointer-events-none lg:pointer-events-auto origin-center transform scale-[0.24] min-[390px]:scale-[0.27] min-[420px]:scale-[0.30] sm:scale-[0.55] lg:scale-[0.55] xl:scale-[0.8] lg:-mr-8 xl:-mr-12 -mt-[clamp(195px,38vh,250px)] -mb-[clamp(175px,34vh,220px)] sm:-my-[120px] lg:my-0">
                        <HeroVisual />
                    </div>
                </div>
            </div>

            {/* ── RIGHT PANEL (Interactive) ── */}
            <div className="w-full lg:w-[43%] h-[55%] sm:h-[40%] lg:h-full flex flex-col items-center justify-center bg-white relative">

                {/* Login Form Container */}
                <div className="flex flex-col items-start w-full max-w-[380px] lg:max-w-[620px] px-6 sm:px-10 lg:px-12">

                    <h2 className="text-[clamp(16px,5vw,22px)] sm:text-[18px] lg:text-[22px] font-semibold text-[#1c1e21] mb-[clamp(6px,1.5vh,16px)] sm:mb-3 lg:mb-6 w-full text-left">Login into Nozorin</h2>

                    {/* Form Fields Stack */}
                    <div className="w-full flex flex-col gap-[clamp(6px,1.2vh,16px)] sm:gap-1.5 lg:gap-3">
                        <input
                            type="text"
                            disabled
                            placeholder="Email or mobile number"
                            className="w-full h-[clamp(40px,6.5vh,54px)] sm:h-[46px] lg:h-[52px] px-4 rounded-xl border-2 border-[#fce7f3] bg-gray-50/50 cursor-not-allowed opacity-60 text-[clamp(13px,4vw,17px)] sm:text-[15px] lg:text-[17px] font-medium outline-none"
                        />
                        <input
                            type="password"
                            disabled
                            placeholder="Password"
                            className="w-full h-[clamp(40px,6.5vh,54px)] sm:h-[46px] lg:h-[52px] px-4 rounded-xl border-2 border-[#fce7f3] bg-gray-50/50 cursor-not-allowed opacity-60 text-[clamp(13px,4vw,17px)] sm:text-[15px] lg:text-[17px] font-medium outline-none"
                        />

                        <div className="mt-[clamp(2px,0.5vh,8px)] sm:mt-1 lg:mt-3">
                            <button
                                disabled
                                className="w-full h-[clamp(40px,6vh,52px)] sm:h-[42px] lg:h-[48px] bg-[#ec4899] opacity-40 cursor-not-allowed text-white rounded-[10px] sm:rounded-full font-extrabold text-[clamp(14px,4vw,17px)] sm:text-[15px] lg:text-[17px]"
                            >
                                Log in
                            </button>
                        </div>

                        <div className="flex justify-center w-full mt-[clamp(4px,1vh,14px)] sm:mt-2 lg:mt-4">
                            <button disabled className="text-[#ec4899] opacity-40 cursor-not-allowed text-[clamp(12px,3vw,15px)] sm:text-[13px] lg:text-[15px] font-bold transition-all">
                                Forgot password?
                            </button>
                        </div>

                        <div className="h-[2px] sm:h-2 lg:h-4 border-b-2 border-[#fce7f3] mt-[clamp(6px,1.5vh,16px)] mb-[clamp(6px,1.5vh,16px)] sm:mb-4 lg:mb-10 w-full opacity-50"></div>

                        {/* Guest Access Button (Pink Theme) */}
                        <div className="w-full">
                            <button
                                onClick={() => onJoin('voice')}
                                className="w-full h-[clamp(40px,6vh,52px)] sm:h-[42px] lg:h-[48px] border-[3px] border-[#ec4899] bg-white hover:bg-[#fdf2f8] text-[#ec4899] rounded-[10px] sm:rounded-full font-extrabold text-[clamp(14px,4vw,17px)] sm:text-[15px] lg:text-[17px] transition-all active:scale-[0.98] cursor-pointer shadow-sm shadow-[#ec4899]/10"
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
