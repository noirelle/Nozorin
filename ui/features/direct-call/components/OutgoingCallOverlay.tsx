
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#18181b] p-8 rounded-3xl border border-white/10 shadow-2xl w-full max-w-sm flex flex-col items-center animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                    {error ? (
                        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    ) : (
                        <div className="w-12 h-12 rounded-full border-t-2 border-[#FF8ba7] animate-spin"></div>
                    )}
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">
                    {error === 'User declined' ? 'Declined' : error ? 'Call Failed' : 'Calling...'}
                </h2>
                <p className="text-zinc-400 mb-8 text-center">
                    {error === 'User declined' ? 'Partner rejected the request' : (error || 'Waiting for partner to answer')}
                </p>

                <button
                    onClick={onCancel}
                    className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all active:scale-[0.98]"
                >
                    Cancel Call
                </button>
            </div>
        </div>
    );
};
