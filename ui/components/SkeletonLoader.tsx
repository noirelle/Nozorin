/**
 * SkeletonLoader - Minimalist animated skeleton for searching state
 */
export const SkeletonLoader = () => {
    return (
        <div className="flex items-center justify-center w-full h-full">
            <div className="flex flex-col items-center gap-6">
                {/* Animated pulsing circle */}
                <div className="relative">
                    {/* Outer ring */}
                    <div className="w-24 h-24 rounded-full border-4 border-white/10 animate-pulse-ring absolute" />

                    {/* Main circle */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#FF8ba7]/20 to-[#3b82f6]/20 backdrop-blur-sm animate-pulse relative" />
                </div>

                {/* Simple skeleton bars */}
                <div className="flex flex-col gap-2 items-center">
                    <div className="w-32 h-3 bg-white/10 rounded-full animate-pulse" />
                    <div className="w-24 h-2 bg-white/5 rounded-full animate-pulse delay-75" />
                </div>
            </div>
        </div>
    );
};

/**
 * Desktop version with larger sizing
 */
export const SkeletonLoaderDesktop = () => {
    return (
        <div className="flex items-center justify-center w-full h-full">
            <div className="flex flex-col items-center gap-8">
                {/* Animated pulsing circle */}
                <div className="relative">
                    {/* Glow effect */}
                    <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-[#FF8ba7]/10 to-[#3b82f6]/10 blur-3xl absolute animate-glow-pulse" />

                    {/* Outer ring */}
                    <div className="w-40 h-40 rounded-full border-4 border-white/10 animate-pulse-ring absolute" />

                    {/* Main circle */}
                    <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#FF8ba7]/20 to-[#3b82f6]/20 backdrop-blur-sm animate-float relative" />
                </div>

                {/* Simple skeleton bars */}
                <div className="flex flex-col gap-3 items-center">
                    <div className="w-48 h-4 bg-white/10 rounded-full animate-pulse" />
                    <div className="w-32 h-3 bg-white/5 rounded-full animate-pulse delay-75" />
                </div>
            </div>
        </div>
    );
};
