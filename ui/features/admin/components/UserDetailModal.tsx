'use client';

import React, { useEffect, useState } from 'react';
import { 
    X, 
    Calendar, 
    History as HistoryIcon, 
    Users as FriendsIcon,
    Clock,
    Phone,
    MessageCircle,
    UserCircle,
    Copy,
    Check,
    ChevronRight,
    Search,
    Globe,
    Pencil,
    Trash2
} from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';
import { admin } from '@/lib/api';
import { UserDetails } from '@/lib/api/endpoints/admin/types';
import { getAvatarUrl } from '@/utils/avatar';

interface UserDetailModalProps {
    userId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({ userId, isOpen, onClose }) => {
    const [user, setUser] = useState<UserDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'history' | 'friends'>('history');
    const [copied, setCopied] = useState(false);
    
    // Edit/Delete States
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editGender, setEditGender] = useState<'male' | 'female' | 'other'>('other');
    const [isUpdating, setIsUpdating] = useState(false);
    
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            const fetchDetails = async () => {
                setIsLoading(true);
                try {
                    const response = await admin.getUserDetails(userId);
                    if (response.data) {
                        setUser(response.data);
                        setEditName(response.data.username);
                        setEditGender(response.data.gender);
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
            setCopied(false);
            setIsEditing(false);
            setIsDeleting(false);
            setIsDeleteConfirming(false);
        }
    }, [isOpen, userId]);

    const handleUpdate = async () => {
        if (!userId || !user) return;
        setIsUpdating(true);
        try {
            const response = await admin.updateUser(userId, { 
                username: editName, 
                gender: editGender 
            });
            if (response.data) {
                setUser({ ...user, ...response.data });
                setIsEditing(false);
                // We should ideally trigger a global refresh here too
                window.dispatchEvent(new CustomEvent('admin:refresh-users'));
            }
        } catch (err) {
            console.error('[ADMIN] Update error:', err);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!userId) return;
        setIsDeleting(true);
        try {
            await admin.deleteUser(userId);
            window.dispatchEvent(new CustomEvent('admin:refresh-users'));
            onClose();
        } catch (err) {
            console.error('[ADMIN] Delete error:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteHistory = async (historyId: string) => {
        try {
            await admin.deleteHistory(historyId);
            if (user) {
                setUser({
                    ...user,
                    history: user.history.filter(h => h.id !== historyId),
                    historyCount: user.historyCount - 1
                });
            }
        } catch (err) {
            console.error('[ADMIN] Delete history error:', err);
        }
    };

    const handleDeleteFriend = async (friendId: string) => {
        try {
            await admin.deleteFriend(friendId);
            if (user) {
                setUser({
                    ...user,
                    friends: user.friends.filter(f => f.id !== friendId),
                    friendCount: user.friendCount - 1
                });
            }
        } catch (err) {
            console.error('[ADMIN] Delete friend error:', err);
        }
    };

    const copyId = () => {
        if (userId) {
            navigator.clipboard.writeText(userId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div 
                className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px] animate-in fade-in duration-500" 
                onClick={onClose} 
            />
            
            <div className="relative w-full max-w-lg bg-zinc-50 shadow-2xl h-full flex flex-col animate-in slide-in-from-right-full duration-500 ease-in-out border-l border-zinc-200 shadow-zinc-900/20">
                
                {/* Fixed Header */}
                <div className="bg-white px-8 pt-8 pb-6 border-b border-zinc-100 shrink-0">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <h3 className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">User Profile</h3>
                            {isEditing && (
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase rounded-full border border-indigo-100">
                                    Editing
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {!isEditing && !isDeleteConfirming && (
                                <div className="flex items-center bg-zinc-50 border border-zinc-100 rounded-2xl p-1 gap-1">
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm hover:shadow-zinc-200/50"
                                        title="Edit Profile"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <div className="w-px h-4 bg-zinc-200 mx-0.5" />
                                    <button 
                                        onClick={() => setIsDeleteConfirming(true)}
                                        className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-sm hover:shadow-rose-100/50"
                                        title="Delete Account"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <button 
                                onClick={onClose}
                                className="p-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 rounded-2xl transition-all border border-zinc-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="h-24 flex items-center gap-6 animate-pulse">
                            <div className="w-24 h-24 rounded-[32px] bg-zinc-100" />
                            <div className="space-y-3 flex-1">
                                <div className="h-6 bg-zinc-100 rounded-lg w-1/2" />
                                <div className="h-4 bg-zinc-100 rounded-lg w-1/3" />
                            </div>
                        </div>
                    ) : user ? (
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="p-1 bgColor bg-zinc-100 rounded-[36px] border border-zinc-100 shadow-inner">
                                    <img 
                                        src={getAvatarUrl(user.avatar)} 
                                        alt={user.username}
                                        className="w-24 h-24 rounded-[32px] object-cover shadow-sm"
                                    />
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-7 h-7 border-4 border-white rounded-full shadow-lg ${
                                    user.is_online ? 'bg-emerald-500' : 'bg-zinc-300'
                                }`} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <input 
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-lg font-black focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Username"
                                            autoFocus
                                        />
                                        <div className="flex p-1 bg-zinc-50 border border-zinc-100 rounded-xl">
                                            {(['male', 'female'] as const).map((g) => (
                                                <button
                                                    key={g}
                                                    onClick={() => setEditGender(g)}
                                                    className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                                        editGender === g 
                                                        ? 'bg-white text-zinc-900 shadow-sm' 
                                                        : 'text-zinc-400 hover:text-zinc-600'
                                                    }`}
                                                >
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={handleUpdate}
                                                disabled={isUpdating}
                                                className="flex-1 px-4 py-2 bg-zinc-900 text-white text-xs font-black rounded-xl hover:bg-zinc-800 disabled:opacity-50"
                                            >
                                                {isUpdating ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            <button 
                                                onClick={() => setIsEditing(false)}
                                                className="px-4 py-2 bg-zinc-100 text-zinc-600 text-xs font-black rounded-xl hover:bg-zinc-200"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-black text-zinc-900 truncate flex items-center gap-2">
                                            {user.username}
                                            {user.is_claimed && (
                                                <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center shrink-0">
                                                    <Check className="w-3 h-3 text-white stroke-[4]" />
                                                </div>
                                            )}
                                        </h2>
                                        <div className="flex items-center gap-2 mt-1.5 p-1.5 pl-2 bg-zinc-50 border border-zinc-100 rounded-xl w-fit group">
                                            <span className="text-zinc-400 text-[10px] font-bold font-mono truncate max-w-[120px]">{user.id}</span>
                                            <button 
                                                onClick={copyId}
                                                className="p-1 hover:bg-white rounded-md transition-colors text-zinc-400 hover:text-zinc-900 border border-transparent hover:border-zinc-100"
                                            >
                                                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 custom-scrollbar">
                    
                    {isDeleteConfirming ? (
                        <div className="bg-rose-50 border border-rose-100 p-8 rounded-[32px] text-center space-y-6 animate-in zoom-in-95 duration-300">
                            <div className="w-16 h-16 bg-rose-500 text-white rounded-[24px] flex items-center justify-center mx-auto shadow-lg shadow-rose-200">
                                <Trash2 className="w-8 h-8 stroke-[3]" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xl font-black text-rose-900">Delete User?</h4>
                                <p className="text-sm text-rose-600/80 font-medium">
                                    This action is permanent. All history, friends, and account data will be erased.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all disabled:opacity-50"
                                >
                                    {isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}
                                </button>
                                <button 
                                    onClick={() => setIsDeleteConfirming(false)}
                                    className="w-full py-4 bg-white text-zinc-600 font-black rounded-2xl hover:bg-zinc-50 border border-rose-100 transition-all"
                                >
                                    Keep User
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Basic Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-5 rounded-[28px] border border-zinc-100 shadow-sm shadow-zinc-200/50">
                                    <div className="p-2.5 bg-pink-50 text-pink-500 rounded-xl w-fit mb-4">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Join Date</p>
                                    <p className="text-zinc-900 font-black text-sm">
                                        {user ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '...'}
                                    </p>
                                </div>
                                <div className="bg-white p-5 rounded-[28px] border border-zinc-100 shadow-sm shadow-zinc-200/50">
                                    <div className="p-2.5 bg-indigo-50 text-indigo-500 rounded-xl w-fit mb-4">
                                        <Globe className="w-4 h-4" />
                                    </div>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Location</p>
                                    <div className="flex items-center gap-2 text-zinc-900 font-black text-sm">
                                        <div className="w-4 h-4 rounded-full overflow-hidden border border-zinc-100 grayscale-[0.5]">
                                            <ReactCountryFlag countryCode={user?.country || 'un'} svg />
                                        </div>
                                        {user?.country_name || 'Global'}
                                    </div>
                                </div>
                            </div>

                            {/* Stats Summary */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-5 rounded-[28px] border border-zinc-100 shadow-sm flex items-center justify-between group cursor-default">
                                    <div>
                                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Total Matches</p>
                                        <p className="text-2xl font-black text-zinc-900">{user?.historyCount || 0}</p>
                                    </div>
                                    <div className="p-3 bg-zinc-50 text-zinc-300 group-hover:text-zinc-900 rounded-2xl transition-colors">
                                        <HistoryIcon className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="bg-white p-5 rounded-[28px] border border-zinc-100 shadow-sm flex items-center justify-between group cursor-default">
                                    <div>
                                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Connections</p>
                                        <p className="text-2xl font-black text-zinc-900">{user?.friendCount || 0}</p>
                                    </div>
                                    <div className="p-3 bg-zinc-50 text-zinc-300 group-hover:text-zinc-900 rounded-2xl transition-colors">
                                        <FriendsIcon className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>

                            {/* Activity Feed */}
                            <div className="space-y-6 pb-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex p-1 bg-white border border-zinc-100 rounded-2xl shadow-sm">
                                        <button 
                                            onClick={() => setActiveTab('history')}
                                            className={`px-5 py-2.5 rounded-[14px] text-xs font-black transition-all ${
                                                activeTab === 'history' 
                                                ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-200' 
                                                : 'text-zinc-400 hover:text-zinc-900'
                                            }`}
                                        >
                                            Recent Matches
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab('friends')}
                                            className={`px-5 py-2.5 rounded-[14px] text-xs font-black transition-all ${
                                                activeTab === 'friends' 
                                                ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-200' 
                                                : 'text-zinc-400 hover:text-zinc-900'
                                            }`}
                                        >
                                            Friends List
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {activeTab === 'history' ? (
                                        user?.history && user.history.length > 0 ? (
                                            user.history.map((item) => (
                                                <div key={item.id} className="bg-white p-4 rounded-[24px] border border-zinc-100 hover:border-zinc-200 shadow-sm transition-all group/item flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-1 bg-zinc-50 rounded-2xl group-hover/item:scale-105 transition-transform">
                                                            <img 
                                                                src={getAvatarUrl(item.partner_avatar)} 
                                                                alt={item.partner_username}
                                                                className="w-11 h-11 rounded-[14px] object-cover bg-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-zinc-900">{item.partner_username}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">{item.mode} match</span>
                                                                <span className="w-1 h-1 rounded-full bg-zinc-200" />
                                                                <span className="text-[10px] text-zinc-400 font-bold">{Math.floor(item.duration / 60)}m {item.duration % 60}s</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 sm:opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => handleDeleteHistory(item.id)}
                                                            className="p-2 text-rose-500 sm:text-zinc-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                            title="Delete Record"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        <div className="p-2 bg-zinc-50 rounded-xl text-zinc-300 hidden sm:block">
                                                            <ChevronRight className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-20 flex flex-col items-center gap-4 text-zinc-300 bg-white rounded-[32px] border border-zinc-100 border-dashed">
                                                <HistoryIcon className="w-10 h-10 opacity-20" />
                                                <p className="text-xs font-black uppercase tracking-widest">No match history</p>
                                            </div>
                                        )
                                    ) : (
                                        user?.friends && user.friends.length > 0 ? (
                                            user.friends.map((friend) => (
                                                <div key={friend.id} className="bg-white p-4 rounded-[24px] border border-zinc-100 hover:border-zinc-200 shadow-sm transition-all group/item flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-1 bg-zinc-50 rounded-2xl group-hover/item:scale-105 transition-transform">
                                                            <img 
                                                                src={getAvatarUrl(friend.friend_avatar)} 
                                                                alt={friend.friend_username}
                                                                className="w-11 h-11 rounded-[14px] object-cover bg-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-zinc-900">{friend.friend_username}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <div className="w-3.5 h-3.5 rounded-sm overflow-hidden border border-zinc-100 grayscale hover:grayscale-0 transition-all">
                                                                    <ReactCountryFlag countryCode={friend.friend_country_code} svg />
                                                                </div>
                                                                <span className="text-[10px] text-zinc-400 font-bold">{friend.friend_country}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            onClick={() => handleDeleteFriend(friend.id)}
                                                            className="p-2 opacity-100 sm:opacity-0 group-hover/item:opacity-100 text-rose-500 sm:text-zinc-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                            title="Unfriend"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        <p className="text-[10px] text-zinc-300 font-black group-hover:text-emerald-500 transition-colors hidden sm:block uppercase">CONNECTED</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-20 flex flex-col items-center gap-4 text-zinc-300 bg-white rounded-[32px] border border-zinc-100 border-dashed">
                                                <FriendsIcon className="w-10 h-10 opacity-20" />
                                                <p className="text-xs font-black uppercase tracking-widest">No social connections</p>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
