'use client';

import React from 'react';
import { Home, Search, Compass, Heart, User } from 'lucide-react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/hooks';
import { UserProfile } from '@/types/user';

interface MobileTabbarProps {
    user?: UserProfile | null;
}

export const MobileTabbar = ({ user: propUser }: MobileTabbarProps) => {
    const pathname = usePathname();
    const { user: hookUser } = useUser();
    const user = propUser || hookUser;

    const isHome = pathname === '/app' || pathname === '/';

    return (
        <nav className="h-[50px] border-t border-zinc-200 bg-white flex items-center justify-around fixed bottom-0 left-0 right-0 z-50">
            <Link href="/app">
                <Home
                    className={`w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity ${isHome ? 'text-pink-600' : 'text-zinc-900'}`}
                    strokeWidth={isHome ? 3 : 2}
                />
            </Link>
            <div className="relative">
                <Search className="w-6 h-6 text-zinc-300 cursor-not-allowed opacity-50" />
            </div>
            <Link href="/app/explore">
                <Compass
                    className={`w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity ${pathname === '/app/explore' ? 'text-pink-600' : 'text-zinc-900'}`}
                    strokeWidth={pathname === '/app/explore' ? 3 : 2}
                />
            </Link>
            <div className="relative">
                <Heart className="text-zinc-300 w-6 h-6 cursor-not-allowed opacity-50" />
            </div>
            <Link href="/app/profile">
                <div className={`w-6 h-6 rounded-full border-2 overflow-hidden cursor-pointer hover:opacity-70 transition-opacity flex items-center justify-center ${pathname === '/app/profile' ? 'border-pink-600' : 'border-zinc-900'}`}>
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt="profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <User className={`w-4 h-4 ${pathname === '/app/profile' ? 'text-pink-600' : 'text-zinc-900'}`} />
                    )}
                </div>
            </Link>
        </nav>
    );
};
