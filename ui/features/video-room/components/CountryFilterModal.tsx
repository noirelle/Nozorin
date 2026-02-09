import React, { useMemo, useState } from 'react';
import ReactCountryFlag from "react-country-flag";
import { countries } from 'countries-list';

// Convert countries object to array
const countriesList = Object.entries(countries).map(([code, data]) => ({
    code,
    name: data.name
})).sort((a, b) => a.name.localeCompare(b.name));

// Add Global manually
export const COUNTRIES = [
    { code: 'GLOBAL', name: 'Global' },
    ...countriesList
];

interface CountryFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectCountry: (code: string) => void;
    selectedCountryCode: string;
}

export const CountryFilterModal: React.FC<CountryFilterModalProps> = ({
    isOpen,
    onClose,
    onSelectCountry,
    selectedCountryCode,
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCountries = useMemo(() => {
        return COUNTRIES.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative z-10 w-full max-w-md bg-[#18181b] rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200 overflow-hidden mx-4">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                    <h3 className="text-lg font-bold text-white">Select Region</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 bg-zinc-900/30">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search countries..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-[#FF8ba7]/50 focus:ring-1 focus:ring-[#FF8ba7]/50 transition-all font-medium"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="overflow-y-auto overflow-x-hidden flex-1 p-2 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-1">
                        {filteredCountries.map((country) => (
                            <button
                                key={country.code}
                                onClick={() => {
                                    onSelectCountry(country.code);
                                    onClose();
                                }}
                                className={`flex items-center gap-4 p-3 rounded-xl transition-all group ${selectedCountryCode === country.code
                                    ? 'bg-[#FF8ba7]/10 border border-[#FF8ba7]/30'
                                    : 'hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                <span className="text-2xl shadow-sm drop-shadow-sm flex items-center justify-center w-8 h-8">
                                    {country.code === 'GLOBAL' ? '🌍' : (
                                        <ReactCountryFlag
                                            countryCode={country.code}
                                            svg
                                            style={{
                                                width: '1.5em',
                                                height: '1.5em',
                                            }}
                                        />
                                    )}
                                </span>
                                <span className={`flex-1 text-left font-medium ${selectedCountryCode === country.code ? 'text-[#FF8ba7]' : 'text-zinc-300 group-hover:text-white'
                                    }`}>
                                    {country.name}
                                </span>
                                {selectedCountryCode === country.code && (
                                    <svg className="w-5 h-5 text-[#FF8ba7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        ))}

                        {filteredCountries.length === 0 && (
                            <div className="py-12 text-center text-white/30">
                                <p>No countries found</p>
                            </div>
                        )}
                    </div>
                </div>

                {selectedCountryCode !== 'GLOBAL' && (
                    <div className="p-4 border-t border-white/5 bg-zinc-900/50">
                        <button
                            onClick={() => {
                                onSelectCountry('GLOBAL');
                                onClose();
                            }}
                            className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white font-medium transition-colors text-sm"
                        >
                            Clear Filter (Show All)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
