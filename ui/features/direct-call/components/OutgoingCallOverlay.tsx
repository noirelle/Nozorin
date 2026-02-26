
import React from 'react';

interface OutgoingCallOverlayProps {
    onCancel: () => void;
    error?: string | null;
}

export const OutgoingCallOverlay: React.FC<OutgoingCallOverlayProps> = ({
    onCancel,
    error
}) => {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="w-[340px] overflow-hidden rounded-[2.5rem] bg-zinc-900/90 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center p-10 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">

                {/* Visual Ring Element */}
                <div className="relative mb-10 pt-4">
                    {error ? (
                        <div className="w-24 h-24 rounded-full bg-red-500/10 border-4 border-red-500/30 flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="absolute inset-0 scale-[2] bg-[#FF0055]/20 rounded-full blur-2xl animate-pulse" />
                            <div className="w-24 h-24 rounded-full border-4 border-[#FF0055]/30 flex items-center justify-center relative shadow-[0_0_30px_rgba(255,0,85,0.3)]">
                                <div className="absolute inset-0 rounded-full border-4 border-t-[#FF0055] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                                <svg className="w-10 h-10 text-[#FF0055] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-center w-full">
                    <h2 className="text-2xl font-display font-black text-white mb-2 tracking-tight">
                        {error === 'User declined' ? 'Declined' : error ? 'Call Failed' : 'Calling...'}
                    </h2>
                    <p className="text-zinc-400 text-sm font-medium mb-10 leading-relaxed max-w-[200px] mx-auto">
                        {error === 'User declined' ? 'Partner rejected the request' : (error || 'Waiting for partner to answer')}
                    </p>
                </div>

                <button
                    onClick={onCancel}
                    className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all active:scale-[0.98] border border-white/5 shadow-lg"
                >
                    {error ? 'Close' : 'Cancel Call'}
                </button>
            </div>
        </div>
    );
};
