import React from 'react';
import { LogoIcon } from './icons';

interface RoomNavbarProps {
    onNavigateToHistory?: () => void;
    variant?: 'desktop' | 'mobile';
}

export function RoomNavbar({
    onNavigateToHistory,
    variant = 'desktop'
}: RoomNavbarProps) {
    // Desktop navbar (for large screens)
    if (variant === 'desktop') {
        return (
            <div className="hidden lg:flex h-16 items-center justify-between px-6 shrink-0 bg-transparent relative z-30">
                <div className="flex items-center gap-12">
                    <div className="flex items-center gap-3">
                        <LogoIcon className="w-10 h-10 text-[#FF8ba7]" />
                        <span className="text-2xl font-display font-bold tracking-tight text-[#FF8ba7] leading-none">nozorin</span>
                    </div>
                </div>
            </div>
        );
    }

    // Mobile navbar (for small screens)
    return (
        <div className="lg:hidden px-4 py-3 flex items-center justify-between pointer-events-auto bg-transparent">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-shrink-0">
                    <LogoIcon className="w-7 h-7 text-[#FF8ba7] flex-shrink-0" />
                    <span className="text-lg font-display font-bold tracking-tight text-[#FF8ba7] leading-none">nozorin</span>
                </div>
            </div>
        </div>
    );
}
