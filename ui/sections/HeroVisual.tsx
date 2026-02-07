import React from 'react';

export default function HeroVisual() {
    return (
        <div className="relative w-full max-w-md aspect-[4/5] md:aspect-square flex items-center justify-center scale-[0.8] sm:scale-90 md:scale-100 mt-8 sm:mt-0">

            {/* Background Aura - softer */}
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-200/30 via-purple-100/30 to-blue-200/30 blur-3xl rounded-full"></div>

            {/* BACK CARD: Video Call Interface - Simpler */}
            <div className="absolute top-0 right-0 w-64 h-[420px] bg-gray-900 rounded-[2rem] shadow-2xl shadow-gray-200 border border-gray-100 transform rotate-6 scale-95 z-0 overflow-hidden">
                <div className="absolute inset-0 bg-gray-800">
                    {/* Fake Video Feed Gradient */}
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 opacity-80"></div>
                    <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
                        alt="User"
                        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
                    />

                    {/* Overlay UI */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-white/90">
                        <div className="px-3 py-1 bg-black/20 backdrop-blur-md rounded-full text-[10px] font-bold">LIVE</div>
                    </div>

                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-xl hover:bg-white/30 transition-colors cursor-pointer">👋</div>
                        <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors cursor-pointer shadow-lg shadow-red-500/30">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* FRONT CARD: Minimal Chat Interface */}
            <div className="relative w-72 h-[480px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100/50 z-10 overflow-hidden transform -rotate-3 transition-transform hover:rotate-0 duration-500">

                {/* Header */}
                <div className="p-6 pb-4 border-b border-gray-50 flex items-center gap-4 bg-white/80 backdrop-blur-sm z-20 relative">
                    <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-pink-500 to-purple-500">
                        <img
                            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
                            alt="Avatar"
                            className="w-full h-full rounded-full object-cover border-2 border-white"
                        />
                    </div>
                    <div>
                        <div className="font-bold text-gray-900 text-lg leading-tight">Yvannah Elyse</div>
                        <div className="text-xs text-green-500 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Online
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="p-5 space-y-4 bg-gray-50/50 h-full relative">
                    <div className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-wider mb-4">Today</div>

                    {/* Incoming */}
                    <div className="flex gap-3">
                        <img
                            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
                            alt="Avatar"
                            className="w-8 h-8 rounded-full object-cover self-end mb-1"
                        />
                        <div className="bg-white px-5 py-3 rounded-2xl rounded-bl-none text-gray-600 shadow-sm border border-gray-100 max-w-[200px] text-sm leading-relaxed">
                            <p>Hey! Nice to meet you 👋</p>
                        </div>
                    </div>

                    {/* Outgoing */}
                    <div className="flex gap-3 flex-row-reverse">
                        <div className="bg-[#FF8ba7] px-5 py-3 rounded-2xl rounded-br-none text-white shadow-md shadow-pink-200/50 max-w-[200px] text-sm leading-relaxed font-medium">
                            <p>Hi Yvannah! Where are you from?</p>
                        </div>
                    </div>
                    {/* Incoming 2 */}
                    <div className="flex gap-3">
                        <img
                            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
                            alt="Avatar"
                            className="w-8 h-8 rounded-full object-cover self-end mb-1"
                        />
                        <div className="bg-white px-5 py-3 rounded-2xl rounded-bl-none text-gray-600 shadow-sm border border-gray-100 w-16 flex items-center justify-center">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-75"></span>
                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Minimal floating elements */}
            <div className="absolute top-[20%] -left-8 bg-white p-3 rounded-2xl shadow-xl shadow-gray-100 border border-gray-50 animate-float-delayed z-20">
                <span className="text-2xl">💖</span>
            </div>
            <div className="absolute bottom-[20%] -right-4 bg-white p-3 rounded-2xl shadow-xl shadow-gray-100 border border-gray-50 animate-float z-20">
                <span className="text-2xl">✨</span>
            </div>

        </div>
    );
}
