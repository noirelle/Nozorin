'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogoIcon, ArrowRightIcon } from '../../components/icons';

export default function LoginWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleNext = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (step === 2) setStep(3);
        else if (step === 3) {
            // Finalize login logic here
            router.push('/');
        }
    };

    const isStepValid = () => {
        if (step === 1) return true;
        if (step === 2) return formData.email.includes('@');
        if (step === 3) return formData.password.length >= 1;
        return false;
    };

    return (
        <main className="h-[100dvh] max-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Soft decorative background blurs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-50/40 rounded-full blur-[100px] -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-50/20 rounded-full blur-[100px] -z-10 transform -translate-x-1/2 translate-y-1/2"></div>

            <div className="w-full max-w-xl flex flex-col h-full">
                {/* Header / Logo */}
                <div className="flex justify-center pt-4 mb-2 md:mb-12 shrink-0">
                    <Link href="/">
                        <LogoIcon className="w-10 h-10 md:w-14 md:h-14 shadow-2xl shadow-pink-100 rounded-2xl" />
                    </Link>
                </div>

                <div className="flex-1 flex flex-col justify-center overflow-y-auto md:overflow-hidden px-2">
                    {/* Step 1: Selection */}
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <button
                                onClick={() => router.push('/get-started')}
                                className="mb-10 text-[10px] font-black text-pink-500 uppercase tracking-widest flex items-center gap-2"
                            >
                                <span className="text-lg">←</span> Back
                            </button>
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-none mb-12">
                                Welcome <br /> <span className="text-pink-500">back.</span>
                            </h1>

                            <div className="space-y-3">
                                <button
                                    onClick={() => setStep(2)}
                                    className="w-full p-6 bg-gray-900 hover:bg-black text-white rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-between group transition-all"
                                >
                                    <span>Standard Email</span>
                                    <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>

                                <div className="grid grid-cols-2 gap-3">
                                    <button className="p-4 bg-white border border-gray-100 hover:border-pink-200 text-gray-900 rounded-[2rem] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 transition-all hover:shadow-lg hover:-translate-y-0.5">
                                        <svg className="w-5 h-5" viewBox="0 0 48 48">
                                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.13-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z" />
                                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                        </svg>
                                        Google
                                    </button>

                                    <button className="p-4 bg-white border border-gray-100 hover:border-blue-200 text-gray-900 rounded-[2rem] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 transition-all hover:shadow-lg hover:-translate-y-0.5">
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                        </svg>
                                        Facebook
                                    </button>

                                    <button className="p-4 bg-white border border-gray-100 hover:border-gray-400 text-gray-900 rounded-[2rem] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 transition-all hover:shadow-lg hover:-translate-y-0.5">
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74s2.57-.99 4.31-.65c.61.03 2.05.42 2.85 1.5-2.52 1.5-2.08 6.06.33 7.02-.38 1.15-.96 2.37-1.67 3.45-.66 1.05-1.28 1.95-2.26 2.08zM13.03 5c-.15 1.5-1.28 2.58-2.58 2.6-.33-1.62 1.25-2.91 2.34-3.02.13.01.24.16.24.42z" />
                                        </svg>
                                        Apple
                                    </button>

                                    <button className="p-4 bg-white border border-gray-100 hover:border-green-200 text-gray-900 rounded-[2rem] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 transition-all hover:shadow-lg hover:-translate-y-0.5">
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                        </svg>
                                        Phone
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleNext} className="flex flex-col justify-center">

                        {/* Step 2: Email */}
                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="mb-10 text-[10px] font-black text-pink-500 uppercase tracking-widest flex items-center gap-2"
                                >
                                    <span className="text-lg">←</span> Back
                                </button>
                                <label className="block text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-none mb-8">
                                    Verify your <br />
                                    <span className="text-pink-500">identity.</span>
                                </label>
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-transparent border-b-2 border-gray-100 text-2xl md:text-3xl font-bold text-gray-900 focus:outline-none focus:border-pink-500 placeholder-gray-200 py-4 transition-all"
                                />
                            </div>
                        )}

                        {/* Step 3: Password */}
                        {step === 3 && (
                            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="mb-10 text-[10px] font-black text-pink-500 uppercase tracking-widest flex items-center gap-2"
                                >
                                    <span className="text-lg">←</span> {formData.email}
                                </button>
                                <label className="block text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-none mb-8">
                                    Enter <br />
                                    <span className="text-pink-500">passcode.</span>
                                </label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-transparent border-b-2 border-gray-100 text-3xl md:text-4xl font-bold text-gray-900 focus:outline-none focus:border-pink-500 placeholder-gray-200 py-4 transition-all"
                                />
                            </div>
                        )}

                        {/* Global Next Button (Only for steps 2 & 3) */}
                        {step > 1 && (
                            <div className={`mt-12 flex justify-end transition-all duration-500 ${isStepValid() ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                                <button
                                    type="submit"
                                    className="p-4 bg-black text-white rounded-full hover:bg-pink-500 transition-colors shadow-lg"
                                >
                                    <ArrowRightIcon className="w-6 h-6" />
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {/* Progress Indicators */}
                <div className="mt-8 flex justify-center gap-4 shrink-0 pb-6">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`h-[2px] transition-all duration-1000 ${step >= s ? 'w-12 bg-pink-500' : 'w-4 bg-gray-100'}`}
                        />
                    ))}
                </div>
            </div>
        </main>
    );
}