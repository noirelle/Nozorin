'use client';

import React, { useState, useEffect } from 'react';
import { admin } from '@/lib/api';
import { AdminStats } from '@/lib/api/endpoints/admin/types';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { 
    Users, 
    UserCheck, 
    Venus, 
    Mars, 
    Activity,
    ShieldCheck,
    ArrowUpRight
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const { isAdminAuthenticated } = useAdminAuth();

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

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-zinc-900 rounded-3xl p-8 mb-10 text-white shadow-2xl">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                            <ShieldCheck className="w-5 h-5 text-pink-400" />
                        </div>
                        <span className="text-zinc-400 font-semibold tracking-wider text-xs uppercase">System Status: Active</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Welcome back, Admin</h2>
                    <p className="text-zinc-400 max-w-lg">Everything looks great today. You have {stats?.totalUsers || 0} active users distributed across your platform. Check the latest insights below.</p>
                </div>
                
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-pink-600/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-blue-600/10 rounded-full blur-[80px]" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    { 
                        label: 'Total Users', 
                        value: stats?.totalUsers.toLocaleString() || '...', 
                        icon: Users,
                        bg: 'bg-blue-50',
                        textColor: 'text-blue-600'
                    },
                    { 
                        label: 'Females', 
                        value: stats?.totalFemales.toLocaleString() || '...', 
                        icon: Venus,
                        bg: 'bg-pink-50',
                        textColor: 'text-pink-600',
                        sub: stats ? `${((stats.totalFemales / stats.totalUsers) * 100).toFixed(1)}%` : ''
                    },
                    { 
                        label: 'Males', 
                        value: stats?.totalMales.toLocaleString() || '...', 
                        icon: Mars,
                        bg: 'bg-cyan-50',
                        textColor: 'text-cyan-600',
                        sub: stats ? `${((stats.totalMales / stats.totalUsers) * 100).toFixed(1)}%` : ''
                    },
                    { 
                        label: 'Claimed', 
                        value: stats?.totalClaimed.toLocaleString() || '...', 
                        icon: UserCheck,
                        bg: 'bg-emerald-50',
                        textColor: 'text-emerald-600',
                        sub: stats ? `${((stats.totalClaimed / stats.totalUsers) * 100).toFixed(1)}%` : ''
                    },
                ].map((stat) => (
                    <div key={stat.label} className="group bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.textColor} transition-colors group-hover:bg-zinc-900 group-hover:text-white duration-300`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">{stat.label}</p>
                            <h3 className="text-3xl font-bold text-zinc-900 mt-1">{stat.value}</h3>
                        </div>
                        {stat.sub && (
                            <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center justify-between">
                                <span className={`text-sm font-bold ${stat.textColor}`}>{stat.sub}</span>
                                <span className="text-xs text-zinc-400 font-medium">distribution</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Overview Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-100 shadow-sm p-8 flex flex-col items-center justify-center min-h-[300px] group border-dashed border-2 hover:border-pink-200 transition-colors">
                    <div className="p-4 bg-zinc-50 rounded-full mb-4 group-hover:bg-pink-50 transition-colors">
                        <Activity className="w-8 h-8 text-zinc-300 group-hover:text-pink-400 transition-colors" />
                    </div>
                    <h4 className="text-zinc-900 font-bold text-lg">Detailed Analytics</h4>
                    <p className="text-zinc-500 text-center max-w-sm mt-1">Real-time user engagement and traffic patterns will be visualized here.</p>
                </div>
                
                <div className="bg-zinc-900 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between">
                    <div>
                        <h4 className="font-bold text-xl mb-2">System Health</h4>
                        <p className="text-zinc-400 text-sm">All services are currently operational.</p>
                    </div>
                    
                    <div className="space-y-4 relative z-10">
                        {['Database', 'Socket Server', 'API Gateway'].map((service) => (
                            <div key={service} className="flex items-center justify-between">
                                <span className="text-sm text-zinc-300">{service}</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-bold text-emerald-500 uppercase">Online</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Decorative */}
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-600/30 rounded-full blur-3xl" />
                </div>
            </div>
        </div>
    );
};
