'use client';

import React, { useState } from 'react';
import { useAdminAuth } from '../hooks/admin-auth/useAdminAuth';
import { useAdminAuthEffects } from '../hooks/admin-auth/useAdminAuthEffects';
import { GlobalLoader } from '@/components/GlobalLoader';
import { AdminDesktopLayout } from './AdminDesktopLayout';
import { AdminMobileLayout } from './AdminMobileLayout';
import { useIsMobile } from '@/hooks';

interface AdminGuardProps {
    children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
    const [password, setPassword] = useState('');
    const { login, logout, refresh, isAdminAuthenticated, isAdminChecked, isLoading, error } = useAdminAuth();
    const isMobile = useIsMobile();

    // Singleton effects for admin lifecycle
    useAdminAuthEffects();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await login(password);
    };

    if (!isAdminChecked) {
        return <GlobalLoader />;
    }

    if (!isAdminAuthenticated) {
        return (
            <div className="flex justify-center items-center h-screen bg-zinc-50 font-sans px-4">
                <form
                    onSubmit={handleSubmit}
                    className="p-8 bg-white rounded-2xl shadow-xl border border-zinc-100 w-full max-w-md animate-in fade-in zoom-in duration-300"
                >
                    <div className="mb-8 text-center">
                        <img src="/nozorin_logo.svg" alt="Logo" className="w-12 h-12 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-zinc-900">Admin Access</h2>
                        <p className="text-zinc-500 mt-1">Please enter your credentials to continue</p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-zinc-700 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none"
                            disabled={isLoading}
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="p-3 mb-6 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium border border-rose-100 flex items-center gap-2">
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
                    >
                        {isLoading ? 'Verifying...' : 'Unlock Dashboard'}
                    </button>
                </form>
            </div>
        );
    }

    if (isMobile) {
        return (
            <AdminMobileLayout logout={logout}>
                {children}
            </AdminMobileLayout>
        );
    }

    return (
        <AdminDesktopLayout logout={logout}>
            {children}
        </AdminDesktopLayout>
    );
};
