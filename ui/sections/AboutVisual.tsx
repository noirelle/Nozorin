import React from 'react';

export default function AboutVisual() {
    return (
        <div className="w-full max-w-md mx-auto relative px-4 sm:px-0">
            <div className="grid grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-4 md:space-y-6 transform md:translate-y-8">
                    <div className="bg-purple-50 p-6 md:p-8 rounded-[2rem] aspect-square flex flex-col items-center justify-center text-center shadow-lg hover:rotate-2 transition-transform cursor-vertical-text border border-purple-100">
                        <span className="text-4xl md:text-5xl mb-2">🌍</span>
                        <span className="text-xs md:text-sm font-bold text-purple-700">Global</span>
                    </div>
                    <div className="bg-pink-50 p-6 md:p-8 rounded-[2rem] aspect-square flex flex-col items-center justify-center text-center shadow-lg hover:-rotate-2 transition-transform cursor-vertical-text border border-pink-100">
                        <span className="text-4xl md:text-5xl mb-2">💖</span>
                        <span className="text-xs md:text-sm font-bold text-pink-700">Matches</span>
                    </div>
                </div>
                <div className="space-y-4 md:space-y-6">
                    <div className="bg-blue-50 p-6 md:p-8 rounded-[2rem] aspect-square flex flex-col items-center justify-center text-center shadow-lg hover:-rotate-2 transition-transform cursor-vertical-text border border-blue-100">
                        <span className="text-4xl md:text-5xl mb-2">🛡️</span>
                        <span className="text-xs md:text-sm font-bold text-blue-700">Secure</span>
                    </div>
                    <div className="bg-yellow-50 p-6 md:p-8 rounded-[2rem] aspect-square flex flex-col items-center justify-center text-center shadow-lg hover:rotate-2 transition-transform cursor-vertical-text border border-yellow-100">
                        <span className="text-4xl md:text-5xl mb-2">⚡</span>
                        <span className="text-xs md:text-sm font-bold text-yellow-700">Fast</span>
                    </div>
                </div>
            </div>

            {/* Background Decor */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-200 rounded-full blur-3xl opacity-30 -z-10"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-30 -z-10"></div>
        </div>
    );
}
