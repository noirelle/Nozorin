'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MobileNavbar } from '@/features/explore/components/MobileNavbar';
import { MobileTabbar } from '@/features/explore/components/MobileTabbar';
import { MultiSessionGuard } from '@/components/MultiSessionGuard';
import { useUser } from '@/hooks';
import { WelcomeScreen } from '@/features/auth/components/WelcomeScreen';

const GlobalLoader = () => (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
        <div className="relative flex flex-col items-center">
            {/* Pulsing Logo or Icon */}
            <div className="w-20 h-20 mb-8 relative">
                <div className="absolute inset-0 bg-pink-500 rounded-3xl rotate-45 animate-pulse opacity-20" />
                <div className="absolute inset-2 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl rotate-45 flex items-center justify-center shadow-lg shadow-pink-100">
                    <svg className="w-8 h-8 text-white -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor font-bold">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </div>
            </div>

            {/* Progress/Loading Text */}
            <div className="flex flex-col items-center gap-3">
                <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 animate-pulse">
                    Initializing Session
                </span>
            </div>
        </div>
    </div>
);

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobile, setIsMobile] = useState(false);
    const [isImageReady, setIsImageReady] = useState(false);
    const { isChecking, user, isChecked, refreshUser } = useUser();

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Preload user avatar to prevent blink
    useEffect(() => {
        if (user?.avatar) {
            const img = new Image();
            img.src = user.avatar;

            const handleLoad = () => {
                // Use decode() if available for smoother painting
                if ('decode' in img) {
                    img.decode()
                        .then(() => setIsImageReady(true))
                        .catch(() => setIsImageReady(true)); // Fallback if decode fails
                } else {
                    setIsImageReady(true);
                }
            };

            if (img.complete) {
                handleLoad();
            } else {
                img.onload = handleLoad;
                img.onerror = () => setIsImageReady(true); // Don't block forever on error
            }
        } else if (isChecked && !user) {
            setIsImageReady(true);
        }
    }, [user?.avatar, isChecked, user]);

    // Show global loader during initial fetch and image preloading
    const shouldShowLoader = isChecking || (user?.avatar && !isImageReady);

    if (shouldShowLoader) {
        return <GlobalLoader />;
    }

    // If check is complete but no user, show WelcomeScreen
    if (isChecked && !user) {
        return <WelcomeScreen onSuccess={refreshUser} />;
    }

    if (isMobile) {
        return (
            <div className="min-h-screen bg-white text-zinc-900 flex flex-col selection:bg-pink-100 animate-in fade-in duration-700">
                <MobileNavbar />
                <main className="flex-1 overflow-y-auto pb-[50px]">
                    {children}
                </main>
                <MobileTabbar user={user} />
                <MultiSessionGuard />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fdfbfc] text-zinc-900 flex selection:bg-pink-100 animate-in fade-in duration-700">
            {/* Fixed Sidebar */}
            <Sidebar user={user} />

            {/* Page Content */}
            <div className="flex-1">
                {children}
            </div>
            <MultiSessionGuard />
        </div>
    );
}
