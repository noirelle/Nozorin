import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from '../components/icons';

export default function AppFeatures() {
    return (
        <section className="py-20 md:py-32 bg-white relative overflow-hidden">
            {/* Decorative Background Elements - Subtle */}
            <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-pink-50/40 rounded-full blur-3xl opacity-50 transform -translate-y-1/2 -translate-x-1/2"></div>
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-50/40 rounded-full blur-3xl opacity-40"></div>

            <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24">

                    {/* Left: Text Content */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="inline-block px-4 py-1.5 bg-pink-50 text-pink-600 rounded-full font-bold text-xs mb-6 uppercase tracking-wider">
                            Features
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 leading-tight tracking-tight">
                            Every way to <br />
                            <span className="text-[#FF8ba7]">Connect.</span>
                        </h2>
                        <p className="text-lg text-gray-500 mb-10 max-w-md mx-auto md:mx-0 font-medium leading-relaxed">
                            Experience the best random voice matching platform. Jump in and start meeting people from around the world instantly.
                        </p>


                        <div className="flex items-center gap-3">
                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-400"></span>
                            <span className="font-bold text-gray-700">Crystal Clear Audio</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-pink-400"></span>
                            <span className="font-bold text-gray-700">Real-time Messaging</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-purple-400"></span>
                            <span className="font-bold text-gray-700">Global Matchmaking</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-400"></span>
                            <span className="font-bold text-gray-700">No Sign Up Required</span>
                        </div>

                        <Link href="/about" className="inline-flex items-center gap-3 text-gray-900 font-bold text-lg group hover:text-pink-500 transition-colors">
                            <span className="border-b-2 border-gray-200 group-hover:border-pink-500 transition-colors">Start Matching</span>
                            <ArrowRightIcon className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {/* Right: Feature Grid Visual */}
                    <div className="flex-1 w-full max-w-md">
                        <div className="grid grid-cols-2 gap-4 md:gap-6">
                            <div className="space-y-4 md:space-y-6 transform md:translate-y-12">
                                {/* Chats */}
                                <div className="bg-white p-6 md:p-8 rounded-[2rem] aspect-square flex flex-col items-center justify-center shadow-xl shadow-gray-100 hover:rotate-2 transition-transform cursor-default border border-gray-50 group">
                                    <div className="text-5xl md:text-6xl mb-3 group-hover:scale-110 transition-transform bg-blue-50 w-20 h-20 flex items-center justify-center rounded-2xl">⚡</div>
                                    <span className="font-bold text-gray-800 text-sm md:text-base">Instant</span>
                                </div>
                                {/* Voice */}
                                <div className="bg-white p-6 md:p-8 rounded-[2rem] aspect-square flex flex-col items-center justify-center shadow-xl shadow-gray-100 hover:-rotate-2 transition-transform cursor-default border border-gray-50 group">
                                    <div className="text-5xl md:text-6xl mb-3 group-hover:scale-110 transition-transform bg-pink-50 w-20 h-20 flex items-center justify-center rounded-2xl">🎙️</div>
                                    <span className="font-bold text-gray-800 text-sm md:text-base">Voice</span>
                                </div>
                            </div>
                            <div className="space-y-4 md:space-y-6">
                                {/* Calls */}
                                <div className="bg-white p-6 md:p-8 rounded-[2rem] aspect-square flex flex-col items-center justify-center shadow-xl shadow-gray-100 hover:-rotate-2 transition-transform cursor-default border border-gray-50 group">
                                    <div className="text-5xl md:text-6xl mb-3 group-hover:scale-110 transition-transform bg-blue-50 w-20 h-20 flex items-center justify-center rounded-2xl">📞</div>
                                    <span className="font-bold text-gray-800 text-sm md:text-base">Calls</span>
                                </div>
                                {/* Friends */}
                                <div className="bg-white p-6 md:p-8 rounded-[2rem] aspect-square flex flex-col items-center justify-center shadow-xl shadow-gray-100 hover:rotate-2 transition-transform cursor-default border border-gray-50 group">
                                    <div className="text-5xl md:text-6xl mb-3 group-hover:scale-110 transition-transform bg-yellow-50 w-20 h-20 flex items-center justify-center rounded-2xl">👯</div>
                                    <span className="font-bold text-gray-800 text-sm md:text-base">Friends</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
