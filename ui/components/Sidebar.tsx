'use client';

import React from 'react';
import {
    Home,
    Phone,
    MessageCircle,
    Search,
    Compass,
    Heart,
    PlusSquare,
    User,
    Menu,
    Instagram
} from 'lucide-react';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
    { icon: Home, label: 'Home', href: '/app', isActive: true },
    { icon: Phone, label: 'Calls', href: '/explore/call', isActive: true },
    { icon: Search, label: 'Search', href: '#', isActive: false },
    { icon: Compass, label: 'Explore', href: '/explore', isActive: true },
    { icon: MessageCircle, label: 'Messages', href: '#', badge: 1, isActive: false },
    { icon: Heart, label: 'Notifications', href: '#', isActive: false },
    { icon: PlusSquare, label: 'Create', href: '#', isActive: false },
    { icon: User, label: 'Profile', href: '#', isActive: true },
];

export const Sidebar = () => {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-screen w-[72px] hover:w-[245px] bg-black flex flex-col px-3 py-5 z-50 transition-all duration-300 ease-in-out group/sidebar overflow-hidden">
            <div className="px-3 mb-10 mt-2">
                <Link href="/">
                    <Instagram className="text-white w-7 h-7" />
                </Link>
            </div>

            <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                    const isCurrent = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.label}
                            href={item.isActive ? item.href : '#'}
                            className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-200 group ${item.isActive
                                ? 'text-white cursor-pointer hover:bg-zinc-900 group/active'
                                : 'text-zinc-600 cursor-not-allowed'
                                } ${isCurrent ? 'font-bold' : ''}`}
                        >
                            <div className={`relative transition-transform duration-200 ${item.isActive ? 'group-hover:scale-110' : ''} shrink-0`}>
                                <item.icon
                                    className={`w-6 h-6 ${isCurrent ? 'text-white' : ''}`}
                                    strokeWidth={isCurrent ? 3 : 2}
                                />
                                {item.badge && item.isActive && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                                <span className={`text-[16px] ${isCurrent ? 'font-bold' : 'font-normal'}`}>{item.label}</span>
                                {!item.isActive && (
                                    <span className="text-[10px] text-zinc-500 font-medium -mt-1 tracking-wider">Upcoming</span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto space-y-2">
                <div className="flex items-center gap-4 p-3 text-white rounded-lg cursor-pointer transition-all duration-200 hover:bg-zinc-900 group">
                    <Menu className="w-6 h-6 transition-transform duration-200 group-hover:scale-110 shrink-0" />
                    <span className="text-[16px] opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">More</span>
                </div>
                <div className="flex items-center gap-4 p-3 text-white rounded-lg cursor-pointer transition-all duration-200 hover:bg-zinc-900 group">
                    <Menu className="w-6 h-6 opacity-0 transition-transform duration-200 group-hover:scale-110 shrink-0" />
                    <span className="text-[16px] text-xs text-zinc-400 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">Also from Meta</span>
                </div>
            </div>
        </aside>
    );
};
