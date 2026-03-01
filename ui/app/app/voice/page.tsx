'use client';

import { useState, useEffect } from 'react';
import { DesktopVoiceLayout } from '@/features/explore/components/DesktopVoiceLayout';
import { MobileNavbar } from '@/features/explore/components/MobileNavbar';
import { MobileTabbar } from '@/features/explore/components/MobileTabbar';

export default function VoicePage() {
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
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                        <h1 className="text-xl font-bold text-white mb-2">Voice Game</h1>
                        <p>Content coming soon...</p>
                    </div>
                </main>
                <MobileTabbar />
            </div>
        );
    }

    return <DesktopVoiceLayout />;
}
