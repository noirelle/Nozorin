import React from 'react';
import Link from 'next/link';
import { LogoIcon } from './icons';

export default function Navbar() {
    return (
        <nav className="flex items-center justify-between px-6 py-4 md:px-12 max-w-7xl mx-auto">
            <Link href="/" className="flex items-center gap-2 group select-none">
                <LogoIcon className="w-9 h-9 text-[#FF8ba7] transition-transform group-hover:scale-105" />
                <span className="text-4xl font-display font-bold tracking-tight text-[#FF8ba7] pb-1">
                    nozorin
                </span>
            </Link>

            {/* Removed Sign In and Get Started features */}

        </nav>
    );
}
