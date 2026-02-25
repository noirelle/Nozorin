'use client';

import React from 'react';
import ReactCountryFlag from 'react-country-flag';

interface FriendRequestNotificationProps {
    profile: {
        id: string;
        username: string;
        avatar: string;
        country?: string;
        countryCode?: string;
    };
    onView: () => void;
    onClose: () => void;
    isAcceptance?: boolean;
}

export const FriendRequestNotification: React.FC<FriendRequestNotificationProps> = ({
    profile,
    onView,
    onClose,
    isAcceptance
}) => {
    return (
        <div className="fixed top-6 right-6 z-[200] w-full max-w-sm animate-in slide-in-from-right-8 duration-500">
            <div className={`backdrop-blur-2xl rounded-3xl p-4 shadow-[0_20px_50px_rgba(255,183,206,0.3)] border border-white flex items-center gap-4 relative group ${isAcceptance ? 'bg-emerald-50/90' : 'bg-white/90'}`}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/10"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Avatar with Ring */}
                <div className="relative shrink-0">
                    <div className={`w-14 h-14 rounded-full p-0.5 animate-pulse ${isAcceptance ? 'bg-gradient-to-tr from-emerald-400 to-teal-500' : 'bg-gradient-to-tr from-[#FF0055] to-[#FF8BA7]'}`}>
                        <div className="w-full h-full rounded-full bg-white p-0.5 overflow-hidden">
                            <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover rounded-full" />
                        </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-xs">{isAcceptance ? '🎉' : '👋'}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-slate-800 truncate">{profile.username}</span>
                        {profile.countryCode && (
                            <ReactCountryFlag countryCode={profile.countryCode} svg className="w-3 h-2" />
                        )}
                    </div>
                    <p className={`text-[11px] font-medium line-clamp-1 ${isAcceptance ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {isAcceptance ? 'Accepted your friend request!' : 'Sent you a friend request'}
                    </p>

                    <button
                        onClick={onView}
                        className={`mt-2 px-4 py-1.5 text-white text-[10px] font-bold rounded-xl transition-colors shadow-sm active:scale-95 ${isAcceptance ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-[#FF0055] hover:bg-[#E6004D]'}`}
                    >
                        {isAcceptance ? 'VIEW FRIENDS' : 'VIEW IN CIRCLE'}
                    </button>
                </div>
            </div>
        </div>
    );
};
