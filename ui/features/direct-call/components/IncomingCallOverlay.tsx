
import React from 'react';
import ReactCountryFlag from 'react-country-flag';

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
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="w-[340px] overflow-hidden rounded-[2.5rem] bg-zinc-900/90 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center p-8 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">

                {/* Visual Ring Element */}
                <div className="relative mb-8 pt-4">
                    <div className="absolute inset-0 scale-[2.5] bg-[#FF0055]/20 rounded-full blur-3xl animate-pulse" />
                    <div className="relative w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-[#FF0055] to-[#FF8ba7] shadow-[0_0_30px_rgba(255,0,85,0.4)]">
                        <div className="w-full h-full rounded-full bg-zinc-900 overflow-hidden border-4 border-zinc-900">
                            {from_avatar ? (
                                <img src={from_avatar} alt={from_username} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-3xl font-bold text-white">
                                    {from_username?.charAt(0).toUpperCase() || 'V'}
                                </div>
                            )}
                        </div>
                    </div>
                    {!error && (
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-green-500 border-4 border-zinc-900 flex items-center justify-center shadow-lg animate-bounce">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        </div>
                    )}
                </div>

                <div className="text-center w-full">
                    <h2 className="text-2xl font-display font-black text-white mb-1 tracking-tight">
                        {error ? 'Missed Call' : `@${from_username}`}
                    </h2>
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <span className="text-zinc-400 text-sm font-medium">
                            {error ? error : `Incoming ${mode} call from ${from_country_name}`}
                        </span>
                        {from_country && <ReactCountryFlag countryCode={from_country} svg className="w-4 h-3 rounded-sm opacity-80" />}
                    </div>
                </div>

                {!error ? (
                    <div className="flex w-full gap-4 mt-2">
                        <button
                            onClick={onDecline}
                            className="flex-1 group py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-2xl transition-all active:scale-[0.95] flex flex-col items-center gap-1 border border-white/5"
                        >
                            <span className="text-xs uppercase tracking-widest text-zinc-500 group-hover:text-zinc-400">Decline</span>
                        </button>
                        <button
                            onClick={onAccept}
                            className="flex-2 group py-4 px-8 bg-gradient-to-r from-[#FF0055] to-[#FF4D88] hover:shadow-[0_0_30px_rgba(255,0,85,0.4)] text-white font-bold rounded-2xl transition-all active:scale-[0.95] flex flex-col items-center gap-1"
                        >
                            <span className="text-xs uppercase tracking-widest opacity-70 group-hover:opacity-100">Accept</span>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={onDecline}
                        className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all active:scale-[0.98]"
                    >
                        Close
                    </button>
                )}
            </div>
        </div>
    );
};
