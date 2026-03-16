'use client';

import React, { useEffect, useState } from 'react';
import { 
    X, 
    Calendar, 
    Mail, 
    Shield, 
    MapPin, 
    History as HistoryIcon, 
    Users as FriendsIcon,
    Clock,
    Phone,
    MessageCircle,
    UserCircle,
    Globe
} from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';
import { admin } from '@/lib/api';
import { UserDetails } from '@/lib/api/endpoints/admin/types';
import { getAvatarUrl } from '@/utils/avatar';
import { formatRelativeTime } from '@/lib/utils';

interface UserDetailModalProps {
    userId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({ userId, isOpen, onClose }) => {
    const [user, setUser] = useState<UserDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'history' | 'friends'>('history');

    useEffect(() => {
        if (isOpen && userId) {
            const fetchDetails = async () => {
                setIsLoading(true);
                try {
                    const response = await admin.getUserDetails(userId);
                    if (response.data) {
                        setUser(response.data);
                    }
                } catch (err) {
                    console.error('[ADMIN] Error fetching user details:', err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchDetails();
        } else {
            setUser(null);
        }
    }, [isOpen, userId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6">
            <div 
                className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
                onClick={onClose} 
            />
            
            <div className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 max-h-[90vh] flex flex-col">
                
                {/* Header/Banner Area */}
                <div className="relative h-32 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900">
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all border border-white/10 z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Avatar Overlap */}
                    <div className="absolute -bottom-12 left-8 p-1.5 bg-white rounded-3xl shadow-xl">
                        {user ? (
                            <img 
                                src={getAvatarUrl(user.avatar)} 
                                alt={user.username}
                                className="w-24 h-24 rounded-[22px] bg-zinc-100 object-cover"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-[22px] bg-zinc-100 flex items-center justify-center">
                                <UserCircle className="w-12 h-12 text-zinc-300" />
                            </div>
                        )}
                        {user?.is_online && (
                            <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-lg" />
                        )}
                    </div>
                </div>

                <div className="pt-16 px-8 pb-8 overflow-y-auto flex-1 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-400">
                            <div className="w-10 h-10 border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin" />
                            <p className="font-bold text-sm">Loading user details...</p>
                        </div>
                    ) : user ? (
                        <div className="space-y-8">
                            {/* Profile Info */}
                            <div>
                                <h2 className="text-2xl font-black text-zinc-900 flex items-center gap-3">
                                    {user.username}
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                        user.is_claimed 
                                        ? 'bg-indigo-50 border-indigo-100 text-indigo-600' 
                                        : 'bg-zinc-50 border-zinc-100 text-zinc-400'
                                    }`}>
                                        {user.is_claimed ? 'Registered' : 'Guest'}
                                    </span>
                                </h2>
                                <p className="text-zinc-400 text-xs font-medium mt-1">User ID: {user.id}</p>
                            </div>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Joined</p>
                                    <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Country</p>
                                    <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                                        <div className="w-4 h-4 rounded-full overflow-hidden border border-zinc-200">
                                            <ReactCountryFlag countryCode={user.country || 'un'} svg />
                                        </div>
                                        {user.country_name || 'Unknown'}
                                    </div>
                                </div>
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Matches</p>
                                    <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                                        <HistoryIcon className="w-3.5 h-3.5 text-zinc-400" />
                                        {user.historyCount}
                                    </div>
                                </div>
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Friends</p>
                                    <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                                        <FriendsIcon className="w-3.5 h-3.5 text-zinc-400" />
                                        {user.friendCount}
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="space-y-4">
                                <div className="flex items-center p-1.5 bg-zinc-100 rounded-3xl w-fit">
                                    <button 
                                        onClick={() => setActiveTab('history')}
                                        className={`px-6 py-2 rounded-2xl text-xs font-bold transition-all ${
                                            activeTab === 'history' 
                                            ? 'bg-white text-zinc-900 shadow-sm' 
                                            : 'text-zinc-500 hover:text-zinc-900'
                                        }`}
                                    >
                                        Match History
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('friends')}
                                        className={`px-6 py-2 rounded-2xl text-xs font-bold transition-all ${
                                            activeTab === 'friends' 
                                            ? 'bg-white text-zinc-900 shadow-sm' 
                                            : 'text-zinc-500 hover:text-zinc-900'
                                        }`}
                                    >
                                        Friends List
                                    </button>
                                </div>

                                <div className="bg-zinc-50 rounded-[28px] border border-zinc-100 overflow-hidden">
                                    {activeTab === 'history' ? (
                                        <div className="divide-y divide-zinc-100">
                                            {user.history.length > 0 ? (
                                                user.history.map((item) => (
                                                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-zinc-100/50 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <img 
                                                                src={getAvatarUrl(item.partner_avatar)} 
                                                                alt={item.partner_username}
                                                                className="w-10 h-10 rounded-xl bg-white border border-zinc-200"
                                                            />
                                                            <div>
                                                                <p className="text-xs font-bold text-zinc-900">{item.partner_username}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <div className="w-3.5 h-3.5 rounded-sm overflow-hidden border border-zinc-200 grayscale">
                                                                        <ReactCountryFlag countryCode={item.partner_country} svg />
                                                                    </div>
                                                                    <span className="text-[10px] text-zinc-400 font-medium">{item.partner_country_name}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="flex items-center gap-1 text-zinc-900 font-black text-[10px] justify-end">
                                                                {item.mode === 'voice' ? <Phone className="w-3 h-3 text-pink-500" /> : <MessageCircle className="w-3 h-3 text-indigo-500" />}
                                                                {Math.floor(item.duration / 60)}m {item.duration % 60}s
                                                            </div>
                                                            <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                                                                {new Date(item.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-12 flex flex-col items-center gap-3 text-zinc-400">
                                                    <Clock className="w-8 h-8 opacity-20" />
                                                    <p className="text-xs font-bold">No call history yet</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-zinc-100">
                                            {user.friends.length > 0 ? (
                                                user.friends.map((friend) => (
                                                    <div key={friend.id} className="p-4 flex items-center justify-between hover:bg-zinc-100/50 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <img 
                                                                src={getAvatarUrl(friend.friend_avatar)} 
                                                                alt={friend.friend_username}
                                                                className="w-10 h-10 rounded-xl bg-white border border-zinc-200"
                                                            />
                                                            <div>
                                                                <p className="text-xs font-bold text-zinc-900">{friend.friend_username}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <div className="w-3.5 h-3.5 rounded-sm overflow-hidden border border-zinc-200 grayscale">
                                                                        <ReactCountryFlag countryCode={friend.friend_country_code} svg />
                                                                    </div>
                                                                    <span className="text-[10px] text-zinc-400 font-medium">{friend.friend_country}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] text-zinc-400 font-medium italic">
                                                            Friend since {new Date(friend.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-12 flex flex-col items-center gap-3 text-zinc-400">
                                                    <FriendsIcon className="w-8 h-8 opacity-20" />
                                                    <p className="text-xs font-bold">No friends added yet</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-20 text-center text-zinc-400">
                            <p className="font-bold">Failed to load user data</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
