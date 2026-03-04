'use client';

import { Sidebar } from '@/components/Sidebar';
import { MobileNavbar } from '@/components/MobileNavbar';
import { MobileTabbar } from '@/components/MobileTabbar';
import { MultiSessionGuard } from '@/components/MultiSessionGuard';
import { GlobalLoader } from '@/components/GlobalLoader';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import { useUI, UIProvider } from '@/contexts/UIContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { MediaProvider } from '@/contexts/MediaContext';

function LayoutContent({ children }: { children: React.ReactNode }) {
    const { isMobile, isMounted } = useUI();
    const { user } = useAuth();

    if (!isMounted) {
        return <GlobalLoader />;
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

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <UIProvider>
                <SocketProvider>
                    <MediaProvider>
                        <LayoutContent>{children}</LayoutContent>
                    </MediaProvider>
                </SocketProvider>
            </UIProvider>
        </AuthProvider>
    );
}
