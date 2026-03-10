import React, { useMemo, useState } from 'react';
import ReactCountryFlag from "react-country-flag";
import { X, Search, Check } from 'lucide-react';

const countries = [
    { code: 'PH', name: 'Philippines' },
    { code: 'US', name: 'United States' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'TH', name: 'Thailand' },
    { code: 'SG', name: 'Singapore' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' },
    { code: 'IN', name: 'India' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'RU', name: 'Russia' },
    { code: 'TR', name: 'Turkey' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'AU', name: 'Australia' },
    { code: 'CA', name: 'Canada' },
].sort((a, b) => a.name.localeCompare(b.name));

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentCountry: string;
    onSelectCountry: (code: string) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
    isOpen,
    onClose,
    currentCountry,
    onSelectCountry,
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCountries = useMemo(() => {
        return countries.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-[440px] bg-white rounded-[32px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.1)] border border-white p-8 animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 uppercase tracking-widest">Match Preferences</h2>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-1">Select your preferred region</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Country List & Search */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="relative mb-6">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Search countries..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium text-zinc-700 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-pink-500/10 focus:border-pink-200 transition-all"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-hide">
                        {/* Global Option */}
                        <button
                            onClick={() => {
                                onSelectCountry('GLOBAL');
                                onClose();
                            }}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${currentCountry === 'GLOBAL'
                                ? 'bg-pink-50 border-pink-100 text-pink-600'
                                : 'hover:bg-zinc-50 border-transparent text-zinc-600'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🌍</span>
                                <span className="text-sm font-bold">Global / Everyone</span>
                            </div>
                            {currentCountry === 'GLOBAL' && (
                                <div className="w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" strokeWidth={4} />
                                </div>
                            )}
                        </button>

                        <div className="h-px bg-zinc-100 my-4" />

                        {filteredCountries.map((country) => (
                            <button
                                key={country.code}
                                onClick={() => {
                                    onSelectCountry(country.code);
                                    onClose();
                                }}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${currentCountry === country.code
                                    ? 'bg-pink-50 border-pink-100 text-pink-600'
                                    : 'hover:bg-zinc-50 border-transparent text-zinc-600 group'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-6 rounded overflow-hidden shadow-sm shadow-black/5 ring-1 ring-black/5 transition-transform group-hover:scale-110">
                                        <ReactCountryFlag
                                            countryCode={country.code}
                                            svg
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                    <span className="text-sm font-bold">{country.name}</span>
                                </div>
                                {currentCountry === country.code && (
                                    <div className="w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" strokeWidth={4} />
                                    </div>
                                )}
                            </button>
                        ))}

                        {filteredCountries.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">No matching countries</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-8 pt-6 border-t border-zinc-50">
                    <p className="text-[10px] text-zinc-400 font-medium leading-relaxed bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100/50">
                        Preferences take priority. If no matches are found for your selected country, we'll connect you with available users worldwide to keep you talking.
                    </p>
                </div>
            </div>

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};
