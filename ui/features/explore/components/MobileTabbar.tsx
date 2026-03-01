'use client';

import React from 'react';
import { Home, Search, Phone, Heart } from 'lucide-react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const MobileTabbar = () => {
    const pathname = usePathname();

    return (
        <nav className="h-[50px] border-t border-zinc-800 bg-black flex items-center justify-around fixed bottom-0 left-0 right-0 z-50">
            <Link href="/app">
                <Home className={`w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity ${pathname === '/app' ? 'text-white' : 'text-zinc-600'}`} />
            </Link>
            <Link href="/explore">
                <Search className={`w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity ${pathname === '/explore' ? 'text-white' : 'text-zinc-600'}`} />
            </Link>
            <Link href="/explore/call">
                <Phone className={`w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity ${pathname.startsWith('/explore/call') ? 'text-white' : 'text-zinc-600'}`} />
            </Link>
            <div className="relative">
                <Heart className="text-zinc-600 w-6 h-6 cursor-not-allowed" />
            </div>
            <div className="w-6 h-6 rounded-full border border-white overflow-hidden cursor-pointer hover:opacity-70 transition-opacity">
                <img
                    src="https://i.pravatar.cc/150?u=jason"
                    alt="profile"
                    className="w-full h-full object-cover"
                />
            </div>
        </nav>
    );
};
