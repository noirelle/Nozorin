'use client';

import React from 'react';
import { X, Filter, Clock, Users, UserCheck, Trash2, Check } from 'lucide-react';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    filters: {
        gender: string;
        status: string;
        active_since: string;
    };
    onApply: (filters: { gender: string; status: string; active_since: string }) => void;
    onReset: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({ 
    isOpen, 
    onClose, 
    filters: initialFilters, 
    onApply,
    onReset
}) => {
    const [tempFilters, setTempFilters] = React.useState(initialFilters);

    if (!isOpen) return null;

    const handleApply = () => {
        onApply(tempFilters);
        onClose();
    };

    const sectionTitleClass = "text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2";
    const buttonBaseClass = "relative overflow-hidden py-4 px-6 rounded-2xl text-sm font-bold transition-all border flex items-center justify-between group";
    const activeButtonClass = "bg-pink-50 border-pink-100 text-pink-600 shadow-sm shadow-pink-100/50";
    const inactiveButtonClass = "bg-zinc-50 border-transparent text-zinc-500 hover:bg-zinc-100/80 hover:border-zinc-200";

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-zinc-900/40 backdrop-blur-md animate-in fade-in duration-500"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative w-full max-w-[480px] bg-white rounded-[40px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.15)] border border-white/20 overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col max-h-[90vh]">
                
                {/* Decorative background blurs */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-pink-100/50 rounded-full blur-[80px]" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-100/30 rounded-full blur-[80px]" />

                {/* Header */}
                <div className="relative z-10 px-10 pt-10 pb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">Filters</h2>
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.15em] mt-1">Refine your user directory</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all shadow-sm"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="relative z-10 flex-1 overflow-y-auto px-10 py-4 space-y-10 scrollbar-hide">
                    {/* Gender Filter */}
                    <div>
                        <div className={sectionTitleClass}>
                            <Users className="w-3.5 h-3.5" strokeWidth={3} />
                            Gender Preference
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {['all', 'male', 'female'].map((g) => (
                                <button
                                    key={g}
                                    onClick={() => setTempFilters(prev => ({ ...prev, gender: g }))}
                                    className={`${buttonBaseClass} ${tempFilters.gender === g ? activeButtonClass : inactiveButtonClass}`}
                                >
                                    <span className="capitalize">{g === 'all' ? 'Everyone' : g}</span>
                                    {tempFilters.gender === g && (
                                        <div className="w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                                            <Check className="w-3 h-3 text-white" strokeWidth={4} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Account Status Filter */}
                    <div>
                        <div className={sectionTitleClass}>
                            <UserCheck className="w-3.5 h-3.5" strokeWidth={3} />
                            Account Accuracy
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { label: 'All Accounts', value: 'all' },
                                { label: 'Claimed Profiles', value: 'true' },
                                { label: 'Guest Sessions', value: 'false' },
                            ].map((s) => (
                                <button
                                    key={s.value}
                                    onClick={() => setTempFilters(prev => ({ ...prev, status: s.value }))}
                                    className={`${buttonBaseClass} ${tempFilters.status === s.value ? activeButtonClass : inactiveButtonClass}`}
                                >
                                    <span>{s.label}</span>
                                    {tempFilters.status === s.value && (
                                        <div className="w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                                            <Check className="w-3 h-3 text-white" strokeWidth={4} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recently Active Filter */}
                    <div>
                        <div className={sectionTitleClass}>
                            <Clock className="w-3.5 h-3.5" strokeWidth={3} />
                            Recent Activity
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: 'Anytime', value: 'all' },
                                { label: 'Last Hour', value: '1' },
                                { label: 'Last 24 Hours', value: '24' },
                                { label: 'Last 7 Days', value: '168' },
                            ].map((t) => (
                                <button
                                    key={t.value}
                                    onClick={() => setTempFilters(prev => ({ ...prev, active_since: t.value }))}
                                    className={`${buttonBaseClass} ${tempFilters.active_since === t.value ? activeButtonClass : inactiveButtonClass} ${tempFilters.active_since === t.value ? 'px-5' : ''}`}
                                >
                                    <span className="text-xs truncate">{t.label}</span>
                                    {tempFilters.active_since === t.value && (
                                        <div className="w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center animate-in zoom-in duration-300 shrink-0">
                                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-20 px-10 py-8 bg-white border-t border-zinc-50 flex items-center gap-4">
                    <button 
                        onClick={() => {
                            onReset();
                            setTempFilters({ gender: 'all', status: 'all', active_since: 'all' });
                        }}
                        className="py-5 px-6 rounded-[24px] bg-zinc-50 text-zinc-400 font-bold hover:text-zinc-900 transition-all flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={handleApply}
                        className="flex-1 py-5 px-8 rounded-[24px] bg-zinc-900 text-white font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 hover:shadow-zinc-300 flex items-center justify-center gap-3 group"
                    >
                        Apply Selection
                        <Filter className="w-4 h-4 text-pink-500 group-hover:rotate-12 transition-transform" />
                    </button>
                </div>
            </div>

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};
