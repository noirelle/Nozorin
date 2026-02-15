
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useGuestLogin } from '../hooks/useGuestLogin';

interface WelcomeScreenProps {
    onSuccess: () => void;
}

export const WelcomeScreen = ({ onSuccess }: WelcomeScreenProps) => {
    const { registerGuest, isRegistering, error: apiError } = useGuestLogin();
    const [gender, setGender] = useState<string>('');
    const [agreed, setAgreed] = useState(false);
    const [validationError, setValidationError] = useState('');

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

    // Combine errors
    const error = validationError || apiError;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-4">
            <div className="w-full max-w-md space-y-8 text-center">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
                        Welcome
                    </h1>
                    <p className="text-gray-500">Tell us a bit about yourself to get started.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 text-left">
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">I am a...</label>
                        <div className="grid grid-cols-2 gap-4">
                            {['male', 'female'].map((g) => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setGender(g)}
                                    className={`p-4 rounded-xl border-2 transition-all ${gender === g
                                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                                        : 'border-gray-200 hover:border-pink-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="capitalize">{g}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-start space-x-3">
                        <input
                            id="terms"
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                        />
                        <label htmlFor="terms" className="text-sm text-gray-500">
                            I agree to the <a href="#" className="underline hover:text-gray-900">Terms of Service</a> and <a href="#" className="underline hover:text-gray-900">Privacy Policy</a>. I confirm I am 18 years or older.
                        </label>
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 font-medium text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isRegistering || !gender || !agreed}
                        className="w-full py-4 px-6 rounded-full bg-black text-white font-bold text-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isRegistering ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Joining...
                            </span>
                        ) : (
                            'Start Chatting'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
