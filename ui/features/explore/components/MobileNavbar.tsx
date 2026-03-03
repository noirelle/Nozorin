'use client';

import React from 'react';
import { Plus, Heart } from 'lucide-react';
import Link from 'next/link';

export const MobileNavbar = () => {
    return (
        <nav className="h-[52px] bg-white flex items-center justify-between px-4 sticky top-0 z-50 border-b border-zinc-100">
            {/* Left Action - Plus (Disabled) */}
            <div className="w-10 flex items-center justify-start">
                <Plus className="text-zinc-300 w-7 h-7 cursor-not-allowed opacity-50" strokeWidth={2} />
            </div>

            {/* Instagram-style Centered Logo */}
            <Link href="/app" className="flex-1 flex justify-center">
                <div style={{ fontFamily: "'Satisfy', cursive" }} className="text-2xl text-zinc-900 select-none cursor-pointer mt-1 font-bold">
                    nozorin
                </div>
            </Link>

            {/* Right Action - Notifications (Disabled) */}
            <div className="w-10 flex items-center justify-end">
                <div className="relative">
                    <Heart className="text-zinc-300 w-7 h-7 cursor-not-allowed opacity-50" strokeWidth={2} />
                </div>
            </div>
        </nav>
    );
};
