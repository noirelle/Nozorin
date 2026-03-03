'use client';

import React from 'react';
import { Home, Search, Phone, Heart, User } from 'lucide-react';

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

    return (
        <nav className="h-[50px] border-t border-zinc-200 bg-white flex items-center justify-around fixed bottom-0 left-0 right-0 z-50">
            <Link href="/app">
                <Home className={`w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity ${pathname === '/app' ? 'text-zinc-900' : 'text-zinc-300'}`} />
            </Link>
            <Link href="/explore">
                <Search className={`w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity ${pathname === '/explore' ? 'text-zinc-900' : 'text-zinc-300'}`} />
            </Link>
            <Link href="/explore/call">
                <Phone className={`w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity ${pathname.startsWith('/explore/call') ? 'text-zinc-900' : 'text-zinc-300'}`} />
            </Link>
            <div className="relative">
                <Heart className="text-zinc-300 w-6 h-6 cursor-not-allowed" />
            </div>
            <Link href="/app/profile">
                <div className={`w-6 h-6 rounded-full border overflow-hidden cursor-pointer hover:opacity-70 transition-opacity flex items-center justify-center ${pathname === '/app/profile' ? 'border-zinc-900' : 'border-zinc-300'}`}>
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt="profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <User className={`w-4 h-4 ${pathname === '/app/profile' ? 'text-zinc-900' : 'text-zinc-300'}`} />
                    )}
                </div>
            </Link>
        </nav>
    );
};
