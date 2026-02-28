'use client';

import React from 'react';
import { PlusSquare, Heart } from 'lucide-react';

export const MobileNavbar = () => {
    return (
        <nav className="h-10 border-b border-zinc-800 bg-black flex items-center justify-between px-4 sticky top-0 z-50">
            {/* Instagram-style Logo Font */}
            <div className="text-2xl font-serif text-white italic tracking-tight select-none cursor-pointer">
                nozorin
            </div>

            <div className="flex items-center gap-5">
                <PlusSquare className="text-zinc-600 w-6 h-6 cursor-not-allowed" />
                <div className="relative">
                    <Heart className="text-zinc-600 w-6 h-6 cursor-not-allowed" />
                </div>
            </div>
        </nav>
    );
};
