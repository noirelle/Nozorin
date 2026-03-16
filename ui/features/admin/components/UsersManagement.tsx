'use client';

import React from 'react';
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
    History,
    SlidersHorizontal
} from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';
import { FilterModal } from './FilterModal';
import { getAvatarUrl } from '@/utils/avatar';
import { useUsersManagement } from '../hooks/users-management/useUsersManagement';
import { UserDetailModal } from './UserDetailModal';

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
    const {
        users,
        total,
        page,
        limit,
        isLoading,
        searchTerm,
        genderFilter,
        statusFilter,
        activeSinceFilter,
        isFilterModalOpen,
        setPage,
        setSearchTerm,
        setGenderFilter,
        setStatusFilter,
        setActiveSinceFilter,
        setIsFilterModalOpen,
        totalPages,
        selectedUserId,
        setSelectedUserId,
        isDetailModalOpen,
        setIsDetailModalOpen,
    } = useUsersManagement();

    const handleUserClick = (userId: string) => {
        setSelectedUserId(userId);
        setIsDetailModalOpen(true);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Top Bar with Search and Filter Button */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input 
                        type="text"
                        placeholder="Search users by name or ID..."
                        className="w-full pl-14 pr-6 py-4 bg-white border border-zinc-100 rounded-3xl focus:ring-2 focus:ring-pink-500 shadow-sm outline-none transition-all text-zinc-900 font-medium placeholder:text-zinc-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <button 
                    onClick={() => setIsFilterModalOpen(true)}
                    className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-bold transition-all shadow-sm border ${
                        genderFilter !== 'all' || statusFilter !== 'all' || activeSinceFilter !== 'all'
                        ? 'bg-zinc-900 border-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-200'
                        : 'bg-white border-zinc-100 text-zinc-900 hover:bg-zinc-50'
                    }`}
                >
                    <SlidersHorizontal className="w-5 h-5" />
                    Filters
                    {(genderFilter !== 'all' || statusFilter !== 'all' || activeSinceFilter !== 'all') && (
                        <span className="flex items-center justify-center w-5 h-5 bg-pink-500 text-[10px] text-white rounded-full">
                            {[genderFilter, statusFilter, activeSinceFilter].filter(f => f !== 'all').length}
                        </span>
                    )}
                </button>
            </div>

            <FilterModal 
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                filters={{
                    gender: genderFilter,
                    status: statusFilter,
                    active_since: activeSinceFilter
                }}
                onApply={(newFilters) => {
                    setGenderFilter(newFilters.gender);
                    setStatusFilter(newFilters.status);
                    setActiveSinceFilter(newFilters.active_since);
                    setPage(1);
                }}
                onReset={() => {
                    setGenderFilter('all');
                    setStatusFilter('all');
                    setActiveSinceFilter('all');
                    setPage(1);
                }}
            />

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
                                <tr 
                                    key={user.id} 
                                    onClick={() => handleUserClick(user.id)}
                                    className="hover:bg-zinc-50/50 transition-colors group cursor-pointer"
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img 
                                                    src={getAvatarUrl(user.avatar)} 
                                                    alt={user.username}
                                                    className="w-11 h-11 rounded-2xl bg-zinc-100 group-hover:scale-110 transition-transform duration-300"
                                                />
                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                                                    user.is_online ? 'bg-emerald-500' : 'bg-zinc-300'
                                                }`} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-zinc-900">{user.username}</div>
                                                <div className="text-[10px] text-zinc-400 font-medium">
                                                    {user.id.slice(0, 8)} {!user.is_online && `• Last seen ${formatRelativeTime(user.last_active_at)}`}
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
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-lg overflow-hidden flex items-center justify-center border border-zinc-100 shadow-sm bg-zinc-50">
                                                        <ReactCountryFlag 
                                                            countryCode={user.country} 
                                                            svg 
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover'
                                                            }}
                                                            title={user.country_name}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-semibold text-zinc-700">{user.country_name}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-zinc-400">
                                                    <Globe className="w-4 h-4" />
                                                    <span className="text-sm font-medium italic">Unknown</span>
                                                </div>
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
                                {(() => {
                                    const pages: (number | string)[] = [];
                                    const window = 2; // Pages to show on each side of current page
                                    
                                    if (totalPages <= 7) {
                                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                                    } else {
                                        pages.push(1);
                                        if (page > window + 2) pages.push('...');
                                        
                                        const start = Math.max(2, page - window);
                                        const end = Math.min(totalPages - 1, page + window);
                                        
                                        for (let i = start; i <= end; i++) pages.push(i);
                                        
                                        if (page < totalPages - (window + 1)) pages.push('...');
                                        pages.push(totalPages);
                                    }

                                    return pages.map((p, i) => {
                                        if (p === '...') {
                                            return <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-zinc-400">...</span>;
                                        }
                                        return (
                                            <button
                                                key={p}
                                                onClick={() => setPage(Number(p))}
                                                className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                                                    page === p 
                                                    ? 'bg-zinc-900 text-white shadow-lg' 
                                                    : 'bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-900'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        );
                                    });
                                })()}
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

            <UserDetailModal 
                userId={selectedUserId}
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
            />
        </div>
    );
};
