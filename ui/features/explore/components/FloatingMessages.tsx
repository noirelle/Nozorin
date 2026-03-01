'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';

export const FloatingMessages = () => {
    return (
        <div className="fixed bottom-4 right-5 flex items-center gap-2 bg-[#262626] text-white px-4 py-3 rounded-2xl shadow-lg border border-zinc-800 cursor-pointer hover:bg-zinc-800 transition-colors z-50">
            <div className="relative">
                <MessageSquare className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    1
                </span>
            </div>
            <span className="font-semibold text-sm">Messages</span>
            <div className="w-4 h-4 rounded-full border-2 border-transparent border-t-purple-500 border-r-pink-500 border-b-yellow-500 ml-2 animate-spin-slow"></div>
        </div>
    );
};
