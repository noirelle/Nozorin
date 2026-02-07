import React from 'react';

import AboutVisual from './AboutVisual';

export default function AboutUs() {
    return (
        <section id="about" className="flex flex-col-reverse md:flex-row items-center justify-between px-6 py-16 md:py-24 md:px-12 max-w-7xl mx-auto gap-12 bg-gradient-to-b from-white to-pink-50/20">

            {/* Visual Section (Left) */}
            <div className="flex-1 w-full flex items-center justify-center">
                <AboutVisual />
            </div>

            {/* Content Section (Right) */}
            <div className="flex-1 max-w-lg">
                <div className="inline-block px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full font-bold text-xs mb-6 uppercase tracking-wider">
                    Why Nozorin?
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-black mb-6 md:mb-8 leading-tight tracking-tight">
                    More than just <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-400">chatting.</span>
                </h2>

                <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                    We&apos;ve built a safe haven for spontaneous connections. No creeps, no bots, just vibes.
                </p>

                <div className="grid gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-center hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-2xl shrink-0">
                            🛡️
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Safe & Secure</h3>
                            <p className="text-gray-500 text-sm font-medium">Moderated 24/7 for your peace of mind.</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-center hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl shrink-0">
                            ✨
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Simply Fun</h3>
                            <p className="text-gray-500 text-sm font-medium">No login required. Just click and connect.</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-center hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center text-2xl shrink-0">
                            ⚡
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Lightning Fast</h3>
                            <p className="text-gray-500 text-sm font-medium">Optimized for low latency video & audio.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
