'use client';

import React from 'react';
import { Plus, Heart, Menu, ChevronDown, Settings, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/hooks';

export const MobileNavbar = () => {
    const pathname = usePathname();
    const { user } = useUser();
    const isProfile = pathname === '/app/profile';
    const isHome = pathname === '/app';

    return (
        <nav className="h-[52px] bg-white flex items-center justify-between px-4 sticky top-0 z-50 border-b border-zinc-100">
            {isProfile ? (
                <>
                    {/* Profile Header Layout */}
                    <div className="w-10 flex items-center justify-start">
                        <div className="relative">
                            <Plus className="text-zinc-300 w-7 h-7 cursor-not-allowed opacity-50" strokeWidth={2} />
                            <div className="absolute top-0 -right-0.5 w-[7px] h-[7px] bg-red-400 rounded-full border border-white opacity-50" />
                        </div>
                    </div>

                    <div className="flex-1 flex justify-center items-center gap-1 group cursor-pointer relative pr-4">
                        <span className="text-[17px] font-bold text-zinc-900 truncate max-w-[150px]">
                            {user?.username || 'Profile'}
                        </span>
                        <ChevronDown className="w-4 h-4 text-zinc-900 mt-0.5" strokeWidth={3} />
                        {/* Status Dot */}
                        <div className="absolute right-[calc(50%-85px)] top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full" />
                    </div>

                    <div className="w-10 flex items-center justify-end gap-4">
                        <div className="relative">
                            <Settings className="text-zinc-300 w-6 h-6 cursor-not-allowed opacity-50" strokeWidth={2} />
                        </div>
                        <Menu className="text-zinc-900 w-7 h-7 cursor-pointer" strokeWidth={2} />
                    </div>
                </>
            ) : (
                <>
                    {/* Default Header Layout */}
                    <div className="w-10 flex items-center justify-start">
                        {isHome ? (
                            <SlidersHorizontal className="text-zinc-900 w-6 h-6 cursor-pointer" strokeWidth={2.5} />
                        ) : (
                            <Plus className="text-zinc-300 w-7 h-7 cursor-not-allowed opacity-50" strokeWidth={2} />
                        )}
                    </div>

                    <Link href="/app" className="flex-1 flex justify-center">
                        <div style={{ fontFamily: "'Satisfy', cursive" }} className="text-2xl text-zinc-900 select-none cursor-pointer mt-1 font-bold">
                            nozorin
                        </div>
                    </Link>

                    <div className="w-10 flex items-center justify-end">
                        <div className="relative">
                            <Heart className="text-zinc-300 w-7 h-7 cursor-not-allowed opacity-50" strokeWidth={2} />
                        </div>
                    </div>
                </>
            )}
        </nav>
    );
};
