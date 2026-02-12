
import React from 'react';
import ReactCountryFlag from 'react-country-flag';

interface IncomingCallOverlayProps {
    fromCountry: string;
    fromCountryCode: string;
    mode: 'voice';
    onAccept: () => void;
    onDecline: () => void;
    error?: string | null;
}

export const IncomingCallOverlay: React.FC<IncomingCallOverlayProps> = ({
    fromCountry,
    fromCountryCode,
    mode,
    onAccept,
    onDecline,
    error
}) => {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#18181b] p-8 rounded-3xl border border-white/10 shadow-2xl w-full max-w-sm flex flex-col items-center animate-in zoom-in-95 duration-300">
                <div className="relative mb-6">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${error ? 'bg-red-500/10 border-red-500/30' : 'bg-[#FF8ba7]/20 border-[#FF8ba7]/30 animate-pulse'}`}>
                        {error ? (
                            <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <ReactCountryFlag
                                countryCode={fromCountryCode}
                                svg
                                style={{
                                    width: '4em',
                                    height: '4em',
                                    scale: '1.5',
                                }}
                            />
                        )}
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-1">
                    {error ? 'Call Ended' : 'Incoming Voice Call'}
                </h2>
                <p className="text-zinc-400 mb-8 flex items-center gap-2">
                    {error ? error : (
                        <>
                            <span>{fromCountry}</span>
                            <span>is calling you...</span>
                        </>
                    )}
                </p>

                {!error && (
                    <div className="flex w-full gap-4">
                        <button
                            onClick={onDecline}
                            className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all active:scale-[0.98]"
                        >
                            Decline
                        </button>
                        <button
                            onClick={onAccept}
                            className="flex-1 py-4 bg-[#FF8ba7] hover:bg-[#ff7b9c] text-white font-bold rounded-2xl transition-all shadow-lg shadow-pink-500/25 active:scale-[0.98]"
                        >
                            Accept
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
