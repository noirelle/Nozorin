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

            <div className="flex items-center gap-6">
                <Link href="/login" className="text-gray-500 hover:text-[#FF8ba7] font-bold text-sm transition-colors hidden sm:block">
                    Sign In
                </Link>
                <Link
                    href="/get-started"
                    className="px-6 py-2.5 bg-[#FF8ba7] hover:bg-[#ff7b9c] text-white rounded-full font-bold text-sm shadow-lg shadow-pink-200 hover:shadow-xl hover:shadow-pink-300 transition-all transform hover:-translate-y-0.5 active:scale-95"
                >
                    Get Started
                </Link>
            </div>
        </nav>
    );
}
