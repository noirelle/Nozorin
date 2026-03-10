import React from 'react';
import { X, PhoneForwarded } from 'lucide-react';

interface OutgoingCallOverlayProps {
    onCancel: () => void;
    error?: string | null;
}

export const OutgoingCallOverlay: React.FC<OutgoingCallOverlayProps> = ({
    onCancel,
    error
}) => {
    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] w-[95%] max-w-[420px] animate-in slide-in-from-top-12 duration-500 ease-out">
            <div className="relative group">
                {/* Soft Glow Effect */}
                {!error && (
                    <div className="absolute inset-0 bg-[#FF0055]/10 blur-3xl rounded-[32px] -z-10 animate-pulse" />
                )}

                <div className="bg-white/95 backdrop-blur-2xl border border-zinc-100 rounded-[32px] p-4 shadow-[0_20px_60px_rgba(255,0,85,0.08),0_10px_20px_rgba(0,0,0,0.04)] flex items-center justify-between gap-4">

                    {/* Status Section */}
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="relative shrink-0">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ring-4 transition-all duration-500 ${error ? 'bg-red-50 ring-red-100/50' : 'bg-pink-50 ring-pink-100/50'}`}>
                                {error ? (
                                    <X className="w-6 h-6 text-red-500" />
                                ) : (
                                    <div className="relative">
                                        <PhoneForwarded className="w-6 h-6 text-[#FF0055] animate-pulse" />
                                        <div className="absolute -inset-1 border-2 border-t-[#FF0055] border-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col min-w-0">
                            <h3 className="text-sm font-black text-zinc-900 truncate uppercase tracking-widest">
                                {error === 'User declined' ? 'Declined' : error ? 'Call Failed' : 'Calling Partner'}
                            </h3>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider truncate">
                                {error === 'User declined' ? 'Request rejected' : (error || 'Waiting for answer...')}
                            </p>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onCancel}
                            className={`px-6 h-10 flex items-center justify-center rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${error ? 'bg-zinc-900 hover:bg-zinc-800 text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'}`}
                        >
                            {error ? 'Close' : 'Cancel'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
