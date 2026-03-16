import React from 'react';
import { MobileNavbar } from '@/components/MobileNavbar';
import { MobileTabbar } from '@/components/MobileTabbar';
import { usePathname } from 'next/navigation';

interface AdminMobileLayoutProps {
    children: React.ReactNode;
    logout: () => void;
    title?: string;
}

export const AdminMobileLayout: React.FC<AdminMobileLayoutProps> = ({ children, logout, title: propTitle }) => {
    const pathname = usePathname();

    const getRouteTitle = () => {
        if (propTitle) return propTitle;
        if (pathname === '/admin-panel/users-management') return 'User Management';
        return 'Admin Dashboard';
    };

    const title = getRouteTitle();

    return (
        <div className="flex flex-col h-screen bg-zinc-50 font-sans">
            <MobileNavbar />

            <main className="flex-1 p-6 pb-28 overflow-auto mt-4">
                <header className="mb-8">
                    <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
                        {title.split(' ')[0]} <span className="text-pink-600 font-bold">{title.split(' ').slice(1).join(' ')}</span>
                    </h1>
                    <p className="text-zinc-500 font-medium">System Overview</p>
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
