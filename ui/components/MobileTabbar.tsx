'use client';

import React from 'react';
import { Home, MessageCircle, Compass, Search, User, LogOut } from 'lucide-react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/hooks';
import { UserProfile } from '@/types/user';

interface MobileTabbarProps {
    user?: UserProfile | null;
    onLogout?: () => void;
}

export const MobileTabbar = ({ user: propUser, onLogout }: MobileTabbarProps) => {
    const pathname = usePathname();
    const { user: hookUser } = useUser();
    const user = propUser || hookUser;

    const isHome = pathname === '/app' || pathname === '/';

    return (
        <nav className="h-[52px] border-t border-zinc-100 bg-white flex items-center justify-around fixed bottom-0 left-0 right-0 z-50">
            <Link href="/app">
                <Home
                    className={`w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity ${isHome ? 'text-pink-600' : 'text-zinc-900'}`}
                    strokeWidth={isHome ? 2.5 : 2}
                />
            </Link>
            <div className="relative">
                <MessageCircle className="w-6 h-6 text-zinc-200 cursor-not-allowed" />
            </div>
            <Link href="/app/explore">
                <Compass
                    className={`w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity ${pathname === '/app/explore' ? 'text-pink-600' : 'text-zinc-900'}`}
                    strokeWidth={pathname === '/app/explore' ? 2.5 : 2}
                />
            </Link>
            <div className="relative">
                <Search className="text-zinc-200 w-6 h-6 cursor-not-allowed" />
            </div>
            <Link 
                href={onLogout ? '#' : "/app/profile"}
                onClick={(e) => {
                    if (onLogout) {
                        e.preventDefault();
                        onLogout();
                    }
                }}
            >
                <div className={`w-6 h-6 rounded-full border-2 overflow-hidden cursor-pointer hover:opacity-70 transition-opacity flex items-center justify-center ${(pathname === '/app/profile' && !onLogout) ? 'border-pink-600' : 'border-zinc-100'}`}>
                    {onLogout ? (
                        <LogOut className="w-4 h-4 text-zinc-900" />
                    ) : user?.avatar ? (
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
