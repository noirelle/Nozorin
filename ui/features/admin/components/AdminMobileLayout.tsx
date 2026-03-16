import React from 'react';
import { MobileNavbar } from '@/components/MobileNavbar';

interface AdminMobileLayoutProps {
    children: React.ReactNode;
    logout: () => void;
}

export const AdminMobileLayout: React.FC<AdminMobileLayoutProps> = ({ children, logout }) => {
    return (
        <div className="flex flex-col h-screen bg-zinc-50 font-sans">
            <MobileNavbar />
            
            <main className="flex-1 p-4 pb-20 overflow-auto">
                <header className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Admin</h1>
                        <p className="text-zinc-500 text-sm">Dashboard</p>
                    </div>
                    
                    <button 
                        onClick={logout}
                        className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 text-sm font-semibold rounded-lg hover:bg-zinc-50 shadow-sm"
                    >
                        Exit
                    </button>
                </header>

                {children}
            </main>
        </div>
    );
};
