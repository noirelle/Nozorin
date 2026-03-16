'use client';

import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { GlobalLoader } from '@/components/GlobalLoader';
import { AdminDesktopLayout } from './AdminDesktopLayout';
import { AdminMobileLayout } from './AdminMobileLayout';
import { useIsMobile } from '@/hooks';
import { admin } from '@/lib/api';
import { AdminStats } from '@/lib/api/endpoints/admin/types';

export const AdminPanel: React.FC = () => {
    const [password, setPassword] = useState('');
    const [stats, setStats] = useState<AdminStats | null>(null);
    const { login, logout, isAdminAuthenticated, isAdminChecked, isLoading, error } = useAdminAuth();
    
    const isMobile = useIsMobile();

    useEffect(() => {
        if (isAdminAuthenticated) {
            fetchStats();
        }
    }, [isAdminAuthenticated]);

    const fetchStats = async () => {
        try {
            const result = await admin.getStats();
            if (result.data) {
                setStats(result.data);
            }
        } catch (err) {
            console.error('[ADMIN] Error fetching stats:', err);
        }
    };

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
                    className="p-8 bg-white rounded-2xl shadow-xl border border-zinc-100 w-full max-w-md"
                >
                    <div className="mb-8 text-center">
                        <img src="/nozorin_logo.svg" alt="Logo" className="w-12 h-12 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-zinc-900">Admin Login</h2>
                        <p className="text-zinc-500 mt-1">Enter your password to continue</p>
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
                        className="w-full py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                        {isLoading ? 'Verifying...' : 'Login to Dashboard'}
                    </button>
                </form>
            </div>
        );
    }

    const DashboardContent = (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Users', value: stats?.totalUsers.toLocaleString() || '...', change: '', color: 'zinc' },
                    { label: 'Female Users', value: stats?.totalFemales.toLocaleString() || '...', change: stats ? `${((stats.totalFemales / stats.totalUsers) * 100).toFixed(1)}%` : '', color: 'rose' },
                    { label: 'Male Users', value: stats?.totalMales.toLocaleString() || '...', change: stats ? `${((stats.totalMales / stats.totalUsers) * 100).toFixed(1)}%` : '', color: 'blue' },
                    { label: 'Claimed Accounts', value: stats?.totalClaimed.toLocaleString() || '...', change: stats ? `${((stats.totalClaimed / stats.totalUsers) * 100).toFixed(1)}%` : '', color: 'emerald' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between">
                        <div>
                            <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">{stat.label}</p>
                            <h3 className="text-3xl font-bold text-zinc-900 mt-2">{stat.value}</h3>
                        </div>
                        {stat.change && (
                            <p className="text-sm mt-4 font-semibold text-zinc-400">
                                <span className={`text-${stat.color}-500 mr-1`}>{stat.change}</span>
                                of total
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-10 bg-white rounded-2xl border border-zinc-100 shadow-sm h-64 flex items-center justify-center border-dashed">
                 <p className="text-zinc-400 italic">Admin modules will be implemented here...</p>
            </div>
        </>
    );

    if (isMobile) {
        return (
            <AdminMobileLayout logout={logout}>
                {DashboardContent}
            </AdminMobileLayout>
        );
    }

    return (
        <AdminDesktopLayout logout={logout}>
            {DashboardContent}
        </AdminDesktopLayout>
    );
};
