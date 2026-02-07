import React from 'react';

export default function OurStory() {
    return (
        <section className="py-20 md:py-32 bg-gray-50 overflow-hidden relative">
            <div className="max-w-4xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <span className="inline-block py-1 px-3 rounded-full bg-orange-100 text-orange-600 text-xs font-bold uppercase tracking-wider mb-4">
                        The Origin
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
                        Why we built <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600">Nozorin.</span>
                    </h2>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-orange-100/50 border border-gray-100 relative">
                    {/* Decorative Quote Icon */}
                    <div className="absolute -top-6 -left-4 md:-left-8 w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center text-4xl text-white shadow-lg transform -rotate-12">
                        ❝
                    </div>

                    <div className="space-y-6 text-lg text-gray-600 leading-relaxed font-medium">
                        <p>
                            <span className="text-gray-900 font-bold text-xl">It started with a feeling.</span> You remember the old internet? The one where you could hop on, meet a stranger, and talk about *anything* until 4 AM?
                        </p>
                        <p>
                            Somewhere along the way, social media became... curated. Staged. Algorithm-heavy. We lost the serendipity of just bumping into a random human and saying &quot;Hello.&quot;
                        </p>
                        <p>
                            We built Nozorin to bring that magic back. No profiles to groom, no followers to chase. just <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600 font-bold">raw, unfiltered human connection</span> (but safe, always safe).
                        </p>
                        <p>
                            Whether you&apos;re here to vent, laugh, or find a new best friend from across the ocean—we&apos;re glad you made it.
                        </p>
                    </div>

                    <div className="mt-10 flex items-center gap-4 pt-8 border-t border-gray-50">
                        <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                            {/* Placeholder generic avatar or just a color */}
                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
                        </div>
                        <div>
                            <div className="font-bold text-gray-900">The Nozorin Team</div>
                            <div className="text-sm text-gray-500">Builders & Dreamers</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Background Decorations */}
            <div className="absolute top-20 left-0 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute bottom-20 right-0 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        </section>
    );
}
