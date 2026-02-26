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

interface FilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    currentCountry: string;
    onSelectCountry: (code: string) => void;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
    isOpen,
    onClose,
    currentCountry,
    onSelectCountry,
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCountries = useMemo(() => {
        return COUNTRIES.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const activeCountry = COUNTRIES.find(c => c.code === currentCountry);

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-0 left-0 w-full z-[100] flex justify-center pointer-events-none">
            {/* Drawer Content - Compact & Low Profile */}
            <div className="relative w-full bg-white rounded-t-[2rem] shadow-[0_-10px_60px_-15px_rgba(0,0,0,0.1)] border-t border-slate-100 p-6 animate-in slide-in-from-bottom duration-300 pointer-events-auto pb-8 flex flex-col max-h-[60vh]">

                {/* Drag Handle */}
                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6 shrink-0" />

                <div className="flex justify-between items-center mb-6 px-2 shrink-0">
                    <div>
                        <h2 className="text-2xl font-display font-bold tracking-tight text-slate-800">Filter</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                onSelectCountry('GLOBAL');
                                onClose();
                            }}
                            className="text-[10px] font-bold text-slate-400 tracking-wider hover:text-slate-600 transition-colors uppercase"
                        >
                            Reset
                        </button>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-600"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="space-y-6 px-2 w-full flex-1 overflow-hidden flex flex-col">
                    {/* Search Input - More Compact */}
                    <div className="relative w-full shrink-0">
                        <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search countries..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#F8F9FC] border-none rounded-xl py-3 pl-12 pr-4 text-slate-700 font-medium text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-[#FF8ba7]/20 transition-shadow outline-none"
                        />
                    </div>

                    {/* Active Selections */}
                    <div className="shrink-0 min-h-[40px]">
                        {activeCountry && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-100 bg-white shadow-sm animate-in fade-in zoom-in duration-300">
                                <div className="w-4 h-4 rounded-full overflow-hidden border border-slate-100 relative">
                                    {activeCountry.code === 'GLOBAL' ? (
                                        <span className="flex items-center justify-center w-full h-full bg-slate-100 text-[8px]">🌍</span>
                                    ) : (
                                        <ReactCountryFlag countryCode={activeCountry.code} svg style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    )}
                                </div>
                                <span className="text-xs font-bold text-slate-700">{activeCountry.name}</span>
                                {activeCountry.code !== 'GLOBAL' && (
                                    <button
                                        onClick={() => onSelectCountry('GLOBAL')}
                                        className="text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-full p-0.5 ml-1 transition-colors"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Country List */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1">
                        {filteredCountries.map((country_name) => (
                            <button
                                key={country_name.code}
                                onClick={() => onSelectCountry(country_name.code)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${currentCountry === country_name.code
                                    ? 'bg-[#FF0055]/5 border border-[#FF0055]/20'
                                    : 'hover:bg-slate-50 border border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-base overflow-hidden shrink-0">
                                        {country_name.code === 'GLOBAL' ? '🌍' : (
                                            <ReactCountryFlag countryCode={country_name.code} svg style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        )}
                                    </div>
                                    <span className={`text-sm font-bold text-left truncate ${currentCountry === country_name.code ? 'text-[#FF0055]' : 'text-slate-600 group-hover:text-slate-900'
                                        }`}>
                                        {country_name.name}
                                    </span>
                                </div>
                                {currentCountry === country_name.code && (
                                    <div className="w-5 h-5 rounded-full bg-[#FF0055] flex items-center justify-center text-white shrink-0">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        ))}
                        {filteredCountries.length === 0 && (
                            <div className="text-center py-6 text-slate-400 text-xs font-medium">
                                No countries found
                            </div>
                        )}
                    </div>
                </div>

                {/* Apply Button */}
                <div className="mt-6 flex justify-center w-full shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full max-w-sm bg-[#FF0055] hover:bg-[#E6004C] text-white font-bold py-3.5 rounded-2xl shadow-[0_10px_20px_-5px_rgba(255,0,85,0.3)] hover:shadow-[0_15px_25px_-5px_rgba(255,0,85,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                    >
                        Apply Filters
                    </button>
                </div>

            </div>
        </div>
    );
};
