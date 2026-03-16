'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { admin } from '@/lib/api';
import { UserListItem } from '@/lib/api/endpoints/admin/types';
import { 
    Search, 
    Filter, 
    Users, 
    ChevronLeft, 
    ChevronRight, 
    MoreHorizontal,
    UserCheck,
    UserX,
    Clock,
    Globe,
    UserCircle,
    Venus,
    Mars,
    Activity,
    Users as UsersIcon,
    History
} from 'lucide-react';

const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
};

export const UsersManagement: React.FC = () => {
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [genderFilter, setGenderFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await admin.listUsers({
                page,
                limit,
                search: debouncedSearch,
                gender: genderFilter,
                is_claimed: statusFilter
            });
            if (result.data) {
                setUsers(result.data.users);
                setTotal(result.data.total);
            }
        } catch (err) {
            console.error('[ADMIN] Error fetching users:', err);
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, debouncedSearch, genderFilter, statusFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm mb-6 flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input 
                        type="text"
                        placeholder="Search by username..."
                        className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-zinc-50 p-1.5 rounded-2xl border border-zinc-100">
                        {['all', 'male', 'female'].map((g) => (
                            <button
                                key={g}
                                onClick={() => setGenderFilter(g)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                                    genderFilter === g 
                                    ? 'bg-white text-zinc-900 shadow-sm' 
                                    : 'text-zinc-500 hover:text-zinc-900'
                                }`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 bg-zinc-50 p-1.5 rounded-2xl border border-zinc-100">
                        {[
                            { label: 'All', value: 'all' },
                            { label: 'Claimed', value: 'true' },
                            { label: 'Guests', value: 'false' },
                        ].map((s) => (
                            <button
                                key={s.value}
                                onClick={() => setStatusFilter(s.value)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                    statusFilter === s.value 
                                    ? 'bg-white text-zinc-900 shadow-sm' 
                                    : 'text-zinc-500 hover:text-zinc-900'
                                }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-zinc-50/50 border-b border-zinc-100">
                                <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-wider">User</th>
                                <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-wider">Gender</th>
                                <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-wider">Country</th>
                                <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-wider">Activity</th>
                                <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-8">
                                            <div className="h-10 bg-zinc-50 rounded-2xl" />
                                        </td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-zinc-400">
                                            <UserX className="w-12 h-12" />
                                            <p className="font-medium text-lg">No users found matching your criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.map((user) => (
                                <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img 
                                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar}`} 
                                                    alt={user.username}
                                                    className="w-11 h-11 rounded-2xl bg-zinc-100 group-hover:scale-110 transition-transform duration-300"
                                                />
                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                                                    Date.now() - user.last_active_at < 300000 ? 'bg-emerald-500' : 'bg-zinc-300'
                                                }`} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-zinc-900">{user.username}</div>
                                                <div className="text-[10px] text-zinc-400 font-medium">
                                                    {user.id.slice(0, 8)} • Last seen {formatRelativeTime(user.last_active_at)}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {user.gender === 'female' ? (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 text-pink-600 rounded-xl text-xs font-bold">
                                                <Venus className="w-3.5 h-3.5" />
                                                <span className="capitalize">Female</span>
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold">
                                                <Mars className="w-3.5 h-3.5" />
                                                <span className="capitalize">Male</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            {user.country ? (
                                                <>
                                                    <span className={`fi fi-${user.country.toLowerCase()} rounded-sm w-5 h-3.5 shadow-sm`} />
                                                    <span className="text-sm font-semibold text-zinc-700">{user.country_name}</span>
                                                </>
                                            ) : (
                                                <Globe className="w-4 h-4 text-zinc-300" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                    <UsersIcon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-zinc-900">{user.friendCount}</div>
                                                    <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-tighter">Friends</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                                                    <History className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-zinc-900">{user.historyCount}</div>
                                                    <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-tighter">Calls</div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        {user.is_claimed ? (
                                            <div className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-xl">
                                                <UserCheck className="w-3.5 h-3.5" />
                                                Claimed
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-1 text-zinc-400 font-bold text-xs bg-zinc-50 px-3 py-1.5 rounded-xl">
                                                <Clock className="w-3.5 h-3.5" />
                                                Guest
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
                                            <MoreHorizontal className="w-5 h-5 text-zinc-400" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {total > limit && (
                    <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                        <p className="text-sm text-zinc-500 font-medium whitespace-nowrap">
                            Showing <span className="text-zinc-900 font-bold">{(page - 1) * limit + 1}</span> to <span className="text-zinc-900 font-bold">{Math.min(page * limit, total)}</span> of <span className="text-zinc-900 font-bold">{total}</span>
                        </p>
                        
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 bg-white border border-zinc-200 rounded-xl disabled:opacity-50 hover:bg-zinc-50 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                    const pageNum = i + 1; // Simplified for now
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPage(pageNum)}
                                            className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                                                page === pageNum 
                                                ? 'bg-zinc-900 text-white shadow-lg' 
                                                : 'bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-900'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 bg-white border border-zinc-200 rounded-xl disabled:opacity-50 hover:bg-zinc-50 transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
