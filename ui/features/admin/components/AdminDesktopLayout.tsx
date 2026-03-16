import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { usePathname } from 'next/navigation';

interface AdminDesktopLayoutProps {
    children: React.ReactNode;
    logout: () => void;
    title?: string;
}

export const AdminDesktopLayout: React.FC<AdminDesktopLayoutProps> = ({ children, logout, title: propTitle }) => {
    const pathname = usePathname();
    
    const getRouteTitle = () => {
        if (propTitle) return propTitle;
        if (pathname === '/admin-panel/users-management') return 'User Management';
        return 'Admin Dashboard';
    };

    const title = getRouteTitle();

    return (
        <div className="flex h-screen bg-zinc-50 font-sans">
            <Sidebar 
                user={{ id: 'admin', username: 'Administrator' } as any} 
                onLogout={logout}
            />

            <main className="flex-1 ml-[160px] pt-16 pb-12 px-8 overflow-auto">
                <div className="max-w-6xl mx-auto">
                    <header className="mb-10">
                        <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tightest">
                            {title.split(' ')[0]} <span className="text-pink-600">{title.split(' ').slice(1).join(' ')}</span>
                        </h1>
                        <p className="text-zinc-500 mt-2 text-lg font-medium max-w-2xl">
                            {pathname === '/admin-panel/users-management' 
                                ? 'Manage and monitor your community members and their account status.'
                                : 'Monitor your community insights and system performance in real-time.'}
                        </p>
                    </header>

                    {children}
                </div>
            </main>
        </div>
    );
};
