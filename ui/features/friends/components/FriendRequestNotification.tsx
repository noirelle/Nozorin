import React from 'react';
import ReactCountryFlag from 'react-country-flag';
import { X, UserPlus, CheckCircle2 } from 'lucide-react';
import { getAvatarUrl } from '@/utils/avatar';

interface FriendRequestNotificationProps {
    profile: {
        id: string;
        username: string;
        avatar: string;
        country_name?: string;
        country?: string;
    };
    onClose: () => void;
    type?: 'received' | 'accepted' | 'sent' | 'cancelled' | 'removed';
    isActor?: boolean;
}

export const FriendRequestNotification: React.FC<FriendRequestNotificationProps> = ({
    profile,
    onClose,
    type = 'received',
    isActor = false
}) => {
    // Use the utility for avatar URL with fallback to username-based seed
    const avatarSrc = getAvatarUrl(profile.avatar || profile.username);

    const isAcceptance = type === 'accepted';
    const isNegative = type === 'removed' || type === 'cancelled';

    // Auto-dismiss after 5 seconds
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose, profile.id, type]);

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] w-[95%] max-w-[420px] animate-in slide-in-from-top-12 duration-500 ease-out">
            <div className="relative group">
                {/* Soft Glow Effect */}
                <div className={`absolute inset-0 blur-3xl rounded-[32px] -z-10 animate-pulse ${isAcceptance ? 'bg-emerald-500/10' : isNegative ? 'bg-zinc-500/10' : 'bg-[#FF0055]/10'}`} />

                <div className="bg-white/95 backdrop-blur-2xl border border-zinc-100 rounded-[32px] p-4 shadow-[0_20px_60px_rgba(255,0,85,0.08),0_10px_20px_rgba(0,0,0,0.04)] flex items-center justify-between gap-4">

                    {/* User Info Section */}
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="relative shrink-0">
                            <div className={`w-12 h-12 rounded-2xl overflow-hidden ring-4 ring-offset-0 bg-zinc-50 border border-zinc-100 flex items-center justify-center ${isAcceptance ? 'ring-emerald-50/50' : isNegative ? 'ring-zinc-100/50' : 'ring-pink-50/50'}`}>
                                <img
                                    src={avatarSrc}
                                    alt={profile.username}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-lg ${isAcceptance ? 'bg-emerald-500' : isNegative ? 'bg-zinc-500' : 'bg-[#FF0055]'}`}>
                                {isAcceptance ? (
                                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                                ) : type === 'removed' || type === 'cancelled' ? (
                                    <X className="w-2.5 h-2.5 text-white" />
                                ) : (
                                    <UserPlus className="w-2.5 h-2.5 text-white" />
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col min-w-0">
                            <h3 className="text-sm font-black text-zinc-900 truncate uppercase tracking-widest">
                                {profile.username}
                            </h3>
                            <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-bold uppercase tracking-wider truncate ${isAcceptance ? 'text-emerald-600' : isNegative ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                    {type === 'accepted' ? (isActor ? 'Accepted a friend request' : 'Accepted your request!') :
                                        type === 'sent' ? 'Sent a friend request' :
                                            type === 'cancelled' ? 'Cancelled request' :
                                                type === 'removed' ? 'Removed from friends' :
                                                    'Sent a friend request'}
                                </span>
                                {profile.country && (
                                    <ReactCountryFlag
                                        countryCode={profile.country}
                                        svg
                                        style={{ width: '12px', height: '9px', borderRadius: '1.5px', opacity: 0.8 }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
