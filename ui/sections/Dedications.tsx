
'use client';

import React from 'react';

export default function Dedications() {

    const strangerNames = [
        "Maine", "Maecy", "Yvannah", "Chiela", "Freya", "Jenny", "Yana", "Earl", "JM", "Ashley", "Hannah", "Diana, Princess of Wales", "Gilian", "Maria B."
    ];

    const themes = [
        { bg: "bg-pink-100", text: "text-pink-600", border: "border-pink-200" },
        { bg: "bg-purple-100", text: "text-purple-600", border: "border-purple-200" },
        { bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-200" },
        { bg: "bg-yellow-100", text: "text-yellow-600", border: "border-yellow-200" },
        { bg: "bg-orange-100", text: "text-orange-600", border: "border-orange-200" },
        { bg: "bg-green-100", text: "text-green-600", border: "border-green-200" },
    ];

    return (
        <section className="py-20 md:py-32 bg-white relative overflow-hidden">
            {/* Soft Pastel Background Accents */}
            <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-pink-50/40 rounded-full blur-3xl opacity-50 transform -translate-y-1/2 -translate-x-1/2"></div>
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-50/40 rounded-full blur-3xl opacity-40"></div>

            <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24">

                    {/* Left side: Dedication Message (Pinned) */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="inline-block px-4 py-1.5 bg-pink-50 text-pink-500 rounded-full font-bold text-xs mb-6 uppercase tracking-wider">
                            My Dedications
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 leading-tight tracking-tight">
                            A tribute to the <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">beautiful connections.</span>
                        </h2>
                        <div className="space-y-6 text-lg text-gray-500/80 mb-10 max-w-lg mx-auto md:mx-0 font-medium leading-relaxed">
                            <p>
                                Nozorin is built on the memories of those I met along the way. Every name listed here represents a spark of interaction that helped shape this journey. These are the strangers who shared a moment of their time, a piece of their story, and a sliver of their world with me before this platform even had a name.
                            </p>
                            <p>
                                It is through these serendipitous encounters that the vision for this space was born—a place where every &quot;hello&quot; has the potential to become a lasting memory. To everyone who walked this path with me, knowingly or unknowingly, this space belongs to you as much as it does to the future connections waiting to happen.
                            </p>
                        </div>
                    </div>

                    {/* Right side: Centered Compact Name Grid */}
                    <div className="flex-1 w-full max-w-md">
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-3 w-full">
                                {strangerNames.map((name, index) => {
                                    const theme = themes[index % themes.length];
                                    return (
                                        <div
                                            key={index}
                                            className="relative group cursor-default"
                                        >
                                            <div className={`${theme.bg} ${theme.border} h-14 w-full rounded-2xl border-b-4 flex items-center justify-center shadow-md group-hover:-translate-y-1 transition-all duration-300`}>
                                                <div className={`${theme.text} font-black uppercase tracking-tighter leading-none text-center px-2 text-[10px] md:text-[11px]`}>
                                                    {name}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-10 opacity-20 text-center">
                                <span className="inline-block px-4 py-1.5 bg-gray-50 rounded-full text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">
                                    ✨ with love ✨
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
