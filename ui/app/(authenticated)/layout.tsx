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
import { DirectCallProvider } from '@/contexts/DirectCallContext';

function LayoutContent({ children }: { children: React.ReactNode }) {
    const { isMobile, isMounted } = useUI();
    const { user } = useAuth();

    if (!isMounted) {
        return <GlobalLoader />;
    }

    return (
        <div className={`min-h-screen selection:bg-pink-100 animate-in fade-in duration-700 ${isMobile ? 'bg-white flex flex-col' : 'bg-[#fdfbfc] flex'}`}>
            {/* Navigational elements that swap based on mode */}
            {!isMobile ? (
                <Sidebar user={user} />
            ) : (
                <MobileNavbar />
            )}

            {/* Stable Page Content Container */}
            <div className={`flex-1 flex flex-col min-w-0 ${isMobile ? 'relative overflow-y-auto pb-[50px]' : ''}`}>
                {children}
            </div>

            {isMobile && <MobileTabbar user={user} />}
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
                        <DirectCallProvider>
                            <LayoutContent>{children}</LayoutContent>
                        </DirectCallProvider>
                    </MediaProvider>
                </SocketProvider>
            </UIProvider>
        </AuthProvider>
    );
}
