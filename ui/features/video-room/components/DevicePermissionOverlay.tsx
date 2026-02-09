import React from 'react';

interface DevicePermissionOverlayProps {
    onRetry: () => void;
}

export const DevicePermissionOverlay: React.FC<DevicePermissionOverlayProps> = ({ onRetry }) => {
    return (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/95 text-white font-sans px-6 animate-in fade-in duration-300">
            <div className="max-w-4xl w-full flex flex-col items-center text-center">
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
                    Allow Access to Your Camera
                    <br />
                    and Microphone
                </h1>

                <p className="text-zinc-400 text-lg md:text-2xl max-w-2xl mb-12 font-medium leading-relaxed">
                    Click the icon next to the address bar, and allow access to the camera and microphone.
                </p>

                {/* Visual Guide for Address Bar (Generic) */}
                <div className="hidden md:flex flex-col items-center gap-2 mb-12 opacity-50">
                    <div className="flex items-center gap-2 p-2 px-4 rounded-full bg-zinc-800 border border-zinc-700">
                        <div className="w-4 h-4 rounded-full bg-zinc-600"></div>
                        <div className="w-32 h-2 rounded bg-zinc-700"></div>
                    </div>
                    <div className="w-px h-8 bg-zinc-700"></div>
                    <div className="text-xs text-zinc-500 font-mono">browser settings</div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-lg border border-white/10 transition-all active:scale-95 backdrop-blur-md"
                    >
                        Refresh Page
                    </button>
                    <button
                        onClick={onRetry}
                        className="px-8 py-3 rounded-full bg-white text-black font-bold text-lg hover:bg-gray-200 transition-all active:scale-95 shadow-lg shadow-white/10"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
