'use client';

import React from 'react';
import { Home, Search, Phone, Heart } from 'lucide-react';

export const MobileTabbar = () => {
    return (
        <nav className="h-[50px] border-t border-zinc-800 bg-black flex items-center justify-around fixed bottom-0 left-0 right-0 z-50">
            <Home className="text-white w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity" />
            <Search className="text-zinc-600 w-6 h-6 cursor-not-allowed" />
            <Phone className="text-white w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity" />
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
