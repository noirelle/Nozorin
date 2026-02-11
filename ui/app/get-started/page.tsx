'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogoIcon, ArrowRightIcon } from '../../components/icons';

export default function GetStartedWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);

    return (
        <main className="h-[100dvh] max-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Soft decorative background blurs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-50/40 rounded-full blur-[100px] -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-50/20 rounded-full blur-[100px] -z-10 transform -translate-x-1/2 translate-y-1/2"></div>

            <div className="w-full max-w-xl flex flex-col h-full justify-between">
                {/* Header / Logo */}
                <div className="flex justify-center pt-4 mb-2 md:mb-12 shrink-0">
                    <Link href="/">
                        <LogoIcon className="w-10 h-10 md:w-14 md:h-14 shadow-2xl shadow-pink-100 rounded-2xl" />
                    </Link>
                </div>

                <div className="flex-1 flex flex-col justify-center overflow-hidden px-2">
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 flex flex-col h-full justify-center">
                            <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-none mb-2 text-center">
                                You <br /> <span className="text-pink-500">belong here.</span>
                            </h1>
                            <p className="text-gray-400 font-bold text-center mb-4 text-xs md:text-sm uppercase tracking-[0.2em]">
                                Ready to explore?
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
                                <button
                                    onClick={() => setStep(2)}
                                    className="p-4 md:p-8 bg-white border border-gray-100 hover:border-pink-200 rounded-[2rem] md:rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-pink-50 transition-all text-center group"
                                >
                                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-pink-500 rounded-full mx-auto mb-3 md:mb-6 group-hover:scale-[2] transition-transform"></div>
                                    <h3 className="text-lg md:text-xl font-black text-gray-900 mb-0.5 md:mb-1">New</h3>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Create Account</p>
                                </button>

                                <button
                                    onClick={() => router.push('/login')}
                                    className="p-4 md:p-8 bg-white border border-gray-100 hover:border-gray-300 rounded-[2rem] md:rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-gray-50 transition-all text-center group"
                                >
                                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-200 rounded-full mx-auto mb-3 md:mb-6 group-hover:scale-[2] transition-transform"></div>
                                    <h3 className="text-lg md:text-xl font-black text-gray-900 mb-0.5 md:mb-1">Returning</h3>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Sign In</p>
                                </button>
                            </div>

                            <div className="mt-2 text-center mx-auto">
                                <p className="text-[10px] md:text-xs text-gray-400 mb-1 md:mb-2 leading-relaxed">
                                    Actually, you don&apos;t need to log in to start—you can continue as a guest.
                                </p>
                                <button
                                    onClick={() => router.push('/guest')}
                                    className="text-[10px] md:text-xs font-black text-pink-500 hover:text-pink-600 transition-colors uppercase tracking-[0.2em] border-b-2 border-pink-100 hover:border-pink-500 pb-0.5 md:pb-1"
                                >
                                    Start as Guest
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-700">
                            <button
                                onClick={() => setStep(1)}
                                className="mb-10 text-[10px] font-black text-pink-500 uppercase tracking-widest flex items-center gap-2"
                            >
                                <span className="text-lg">←</span> Back
                            </button>
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-none mb-12">
                                Start your <br /> <span className="text-pink-500">journey.</span>
                            </h1>

                            <div className="space-y-3">
                                <button
                                    onClick={() => router.push('/signup')}
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
                </div>

                {/* Progressive indicator */}
                <div className="mt-12 flex justify-center gap-4 shrink-0 pb-6">
                    <div className={`h-[2px] transition-all duration-1000 ${step === 1 ? 'w-12 bg-pink-500' : 'w-4 bg-gray-100'}`}></div>
                    <div className={`h-[2px] transition-all duration-1000 ${step === 2 ? 'w-12 bg-pink-500' : 'w-4 bg-gray-100'}`}></div>
                </div>
            </div>
        </main>
    );
}
