'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from '../components/icons';
import { useStats } from '../hooks';

export default function SocialProof() {
    const { stats } = useStats();

    // Format large numbers (e.g., 7200000 -> "7.2m")
    const formatLargeNumber = (num: number) => {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}m`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}k`;
        }
        return num.toString();
    };

    return (
        <section className="py-20 md:py-32 bg-white relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-yellow-50/40 rounded-full blur-3xl opacity-50 transform -translate-y-1/2 -translate-x-1/2"></div>
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-50/40 rounded-full blur-3xl opacity-40"></div>

            <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24">

                    {/* Left: Stats & Text */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="inline-block px-4 py-1.5 bg-purple-50 text-purple-600 rounded-full font-bold text-xs mb-6 uppercase tracking-wider">
                            Live Stats
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 leading-tight tracking-tight">
                            Join the <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Global Buzz.</span>
                        </h2>
                        <p className="text-lg text-gray-500 mb-10 max-w-md mx-auto md:mx-0 font-medium leading-relaxed">
                            Every second, new friendships are sparking across continents. Don&apos;t miss out on the fun!
                        </p>

                        <div className="grid grid-cols-2 gap-8 mb-10">
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/50">
                                <div className="text-4xl md:text-5xl font-black text-gray-900 mb-2">{formatLargeNumber(stats.totalConnections)}</div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Connections</div>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/50">
                                <div className="text-4xl md:text-5xl font-black text-gray-900 mb-2">{formatLargeNumber(stats.matchesToday)}</div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Pairs Matched Today</div>
                            </div>
                        </div>

                        <Link href="/about" className="inline-flex items-center gap-3 text-gray-900 font-bold text-lg group hover:text-pink-500 transition-colors">
                            <span className="border-b-2 border-gray-200 group-hover:border-pink-500 transition-colors">See how it works</span>
                            <ArrowRightIcon className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {/* Right: Avatar Grid / Visual */}
                    <div className="flex-1 w-full max-w-md">
                        <div className="grid grid-cols-2 gap-4 md:gap-6">
                            <div className="space-y-4 md:space-y-6 transform md:translate-y-12">
                                <div className="bg-white p-8 rounded-[2rem] aspect-square flex items-center justify-center text-7xl shadow-xl shadow-gray-100 hover:rotate-3 transition-transform cursor-default border border-gray-50">
                                    <div className="bg-purple-50 w-full h-full rounded-2xl flex items-center justify-center">🧔</div>
                                </div>
                                <div className="bg-white p-8 rounded-[2rem] aspect-square flex items-center justify-center text-7xl shadow-xl shadow-gray-100 hover:-rotate-3 transition-transform cursor-default border border-gray-50">
                                    <div className="bg-pink-50 w-full h-full rounded-2xl flex items-center justify-center">👱‍♀️</div>
                                </div>
                            </div>
                            <div className="space-y-4 md:space-y-6">
                                <div className="bg-white p-8 rounded-[2rem] aspect-square flex items-center justify-center text-7xl shadow-xl shadow-gray-100 hover:-rotate-3 transition-transform cursor-default border border-gray-50">
                                    <div className="bg-blue-50 w-full h-full rounded-2xl flex items-center justify-center">🕶️</div>
                                </div>
                                <div className="bg-white p-8 rounded-[2rem] aspect-square flex items-center justify-center text-7xl shadow-xl shadow-gray-100 hover:rotate-3 transition-transform cursor-default border border-gray-50">
                                    <div className="bg-yellow-50 w-full h-full rounded-2xl flex items-center justify-center">👻</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
