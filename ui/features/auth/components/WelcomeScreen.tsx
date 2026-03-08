
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useGuestLogin } from '@/hooks';
import { NozorinLogo } from '@/components/Logo';
import { TermsModal } from './TermsModal';

interface WelcomeScreenProps {
    onSuccess: () => void;
}

export const WelcomeScreen = ({ onSuccess }: WelcomeScreenProps) => {
    const { registerGuest, isRegistering, error: apiError } = useGuestLogin();
    const [gender, setGender] = useState<string>('');
    const [agreed, setAgreed] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [showTermsModal, setShowTermsModal] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError('');

        if (!gender) {
            setValidationError('Please select your gender');
            return;
        }

        if (!agreed) {
            setValidationError('You must agree to the terms');
            return;
        }

        const success = await registerGuest({ username: "", gender, agreed });
        if (success) {
            onSuccess();
        }
    };

    const handleTermsClick = () => {
        if (!agreed) {
            setShowTermsModal(true);
        } else {
            setAgreed(false);
        }
    };

    const handleAgree = () => {
        setAgreed(true);
        setShowTermsModal(false);
    };

    // Combine errors
    const error = validationError || apiError;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-4">
            {/* Subtle background blurs */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-pink-50/40 rounded-full blur-3xl opacity-50 pointer-events-none" />

            <div className="w-full max-w-[420px] relative z-10">
                {/* Logo + Brand */}
                <div className="flex flex-col items-center mb-10">
                    <NozorinLogo className="w-16 h-16 mb-4" />
                    <h1 className="text-[28px] font-bold text-[#1c1e21] tracking-tight">
                        Welcome to Nozorin
                    </h1>
                    <p className="text-[15px] text-gray-400 mt-1.5 font-medium">
                        Tell us a bit about yourself to get started.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Gender Selection */}
                    <div className="space-y-3">
                        <label className="block text-[13px] font-semibold text-gray-500 uppercase tracking-wider">
                            I am a...
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {['male', 'female'].map((g) => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setGender(g)}
                                    className={`h-[52px] rounded-xl border-2 font-bold text-[16px] capitalize transition-all duration-200 cursor-pointer ${gender === g
                                            ? 'border-[#ec4899] bg-[#fdf2f8] text-[#ec4899] shadow-sm shadow-[#ec4899]/10'
                                            : 'border-[#fce7f3] bg-white text-gray-500 hover:border-[#ec4899]/40 hover:bg-[#fdf2f8]/50'
                                        }`}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        {g === 'male' ? '👦' : '👧'}
                                        {g}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="flex items-start gap-3 px-1">
                        <input
                            id="terms"
                            type="checkbox"
                            checked={agreed}
                            onChange={handleTermsClick}
                            className="mt-0.5 h-[18px] w-[18px] rounded border-[#fce7f3] text-[#ec4899] focus:ring-[#ec4899] cursor-pointer accent-[#ec4899]"
                        />
                        <label className="text-[13px] text-gray-400 font-medium leading-relaxed">
                            I agree to the{' '}
                            <button
                                type="button"
                                onClick={() => setShowTermsModal(true)}
                                className="text-[#ec4899] hover:underline cursor-pointer font-semibold"
                            >
                                Terms of Service
                            </button>
                            {' '}and{' '}
                            <button
                                type="button"
                                onClick={() => setShowTermsModal(true)}
                                className="text-[#ec4899] hover:underline cursor-pointer font-semibold"
                            >
                                Privacy Policy
                            </button>.
                            I confirm I am 18 years or older.
                        </label>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="text-[13px] text-red-500 font-semibold text-center bg-red-50 rounded-xl py-2.5 px-4">
                            {error}
                        </div>
                    )}

                    {/* Divider */}
                    <div className="h-px bg-[#fce7f3] w-full opacity-60" />

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isRegistering || !gender || !agreed}
                        className="w-full h-[48px] rounded-full bg-[#ec4899] hover:bg-[#db2777] text-white font-bold text-[17px] transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm shadow-[#ec4899]/20"
                    >
                        {isRegistering ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Joining...
                            </span>
                        ) : (
                            'Continue'
                        )}
                    </button>
                </form>
            </div>

            {/* Terms & Privacy Modal */}
            <TermsModal
                isOpen={showTermsModal}
                onClose={() => setShowTermsModal(false)}
                onAgree={handleAgree}
            />
        </div>
    );
};
