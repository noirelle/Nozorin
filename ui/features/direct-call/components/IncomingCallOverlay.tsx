import React from 'react';
import ReactCountryFlag from 'react-country-flag';
import { Phone, X } from 'lucide-react';
import { getAvatarUrl } from '@/utils/avatar';

interface IncomingCallOverlayProps {
    from_username: string;
    from_avatar: string;
    from_country_name: string;
    from_country: string;
    mode: 'voice' | 'video';
    onAccept: () => void;
    onDecline: () => void;
    error?: string | null;
}

export const IncomingCallOverlay: React.FC<IncomingCallOverlayProps> = ({
    from_username,
    from_avatar,
    from_country_name,
    from_country,
    mode,
    onAccept,
    onDecline,
    error
}) => {
    // Use the utility for avatar URL with fallback to username-based seed
    const avatarSrc = getAvatarUrl(from_avatar || from_username);

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] w-[95%] max-w-[420px] animate-in slide-in-from-top-12 duration-500 ease-out">
            <div className="relative group">
                {/* Soft Glow Effect */}
                {!error && (
                    <div className="absolute inset-0 bg-[#FF0055]/10 blur-3xl rounded-[32px] -z-10 animate-pulse" />
                )}

                <div className="bg-white/95 backdrop-blur-2xl border border-zinc-100 rounded-[32px] p-4 shadow-[0_20px_60px_rgba(255,0,85,0.08),0_10px_20px_rgba(0,0,0,0.04)] flex items-center justify-between gap-4">

                    {/* User Info Section */}
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded-2xl overflow-hidden ring-4 ring-pink-50/50 bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                                <img
                                    src={avatarSrc}
                                    alt={from_username}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        // Final fallback using the utility directly with username if something still fails
                                        const fallback = getAvatarUrl(from_username);
                                        if (e.currentTarget.src !== fallback) {
                                            e.currentTarget.src = fallback;
                                        }
                                    }}
                                />
                            </div>
                            {!error && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg animate-bounce">
                                    <Phone className="w-2.5 h-2.5 text-white fill-white" />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col min-w-0">
                            <h3 className="text-sm font-black text-zinc-900 truncate uppercase tracking-widest">
                                {error ? 'Missed Call' : from_username}
                            </h3>
                            <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-bold uppercase tracking-wider truncate ${error ? 'text-red-500' : 'text-zinc-500'}`}>
                                    {error ? error : `Incoming ${mode}`}
                                </span>
                                {from_country && (
                                    <ReactCountryFlag
                                        countryCode={from_country}
                                        svg
                                        style={{ width: '12px', height: '9px', borderRadius: '1.5px', opacity: 0.8 }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {!error ? (
                            <>
                                <button
                                    onClick={onDecline}
                                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-50 hover:bg-zinc-100 text-zinc-400 hover:text-red-500 transition-all active:scale-95 border border-zinc-100"
                                    title="Decline"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={onAccept}
                                    className="px-6 h-10 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF0055] to-[#FF4D88] hover:shadow-[0_8px_20px_rgba(255,0,85,0.4)] text-white text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                                >
                                    <Phone className="w-3.5 h-3.5 fill-white" />
                                    <span>Accept</span>
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onDecline}
                                className="px-6 h-10 flex items-center justify-center rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                            >
                                Close
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
