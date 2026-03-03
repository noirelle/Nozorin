'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MobileNavbar } from '@/components/MobileNavbar';
import { MobileTabbar } from '@/components/MobileTabbar';
import { MultiSessionGuard } from '@/components/MultiSessionGuard';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';

function LayoutContent({ children }: { children: React.ReactNode }) {
    const [isMobile, setIsMobile] = useState(false);
    const { user } = useAuth();

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

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
    );
}
