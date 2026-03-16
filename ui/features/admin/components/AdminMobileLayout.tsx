import React from 'react';
import { MobileNavbar } from '@/components/MobileNavbar';
import { MobileTabbar } from '@/components/MobileTabbar';

interface AdminMobileLayoutProps {
    children: React.ReactNode;
    logout: () => void;
}

export const AdminMobileLayout: React.FC<AdminMobileLayoutProps> = ({ children, logout }) => {
    return (
        <div className="flex flex-col h-screen bg-zinc-50 font-sans">
            <MobileNavbar />

            <main className="flex-1 p-4 pb-28 overflow-auto">
                <header className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Admin</h1>
                        <p className="text-zinc-500 text-sm">Dashboard</p>
                    </div>
                </header>

                {children}
            </main>

            <MobileTabbar 
                user={{ id: 'admin', username: 'Administrator' } as any} 
                onLogout={logout}
            />
        </div>
    );
};
