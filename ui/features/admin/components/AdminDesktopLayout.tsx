import React from 'react';
import { Sidebar } from '@/components/Sidebar';

interface AdminDesktopLayoutProps {
    children: React.ReactNode;
    logout: () => void;
}

export const AdminDesktopLayout: React.FC<AdminDesktopLayoutProps> = ({ children, logout }) => {
    return (
        <div className="flex h-screen bg-zinc-50 font-sans">
            <Sidebar user={{ id: 'admin', username: 'Administrator' } as any} />
            
            <main className="flex-1 ml-[72px] p-8 overflow-auto">
                <div className="max-w-5xl mx-auto">
                    <header className="mb-8 flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Admin Dashboard</h1>
                            <p className="text-zinc-500 mt-1">Manage your application and users from here.</p>
                        </div>
                        
                        <button 
                            onClick={logout}
                            className="px-5 py-2.5 bg-white border border-zinc-200 text-zinc-700 font-semibold rounded-xl hover:bg-zinc-50 transition-colors shadow-sm"
                        >
                            Logout
                        </button>
                    </header>

                    {children}
                </div>
            </main>
        </div>
    );
};
