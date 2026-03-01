'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MobileNavbar } from '@/features/explore/components/MobileNavbar';
import { MobileTabbar } from '@/features/explore/components/MobileTabbar';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (isMobile) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col">
                <MobileNavbar />
                <main className="flex-1 overflow-y-auto pb-[50px]">
                    {children}
                </main>
                <MobileTabbar />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Fixed Sidebar */}
            <Sidebar />

            {/* Page Content */}
            {children}
        </div>
    );
}
