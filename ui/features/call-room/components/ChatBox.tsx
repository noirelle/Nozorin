import React, { useRef, useEffect } from "react";

interface Message {
    senderId: string;
    isSelf: boolean;
    message: string;
    timestamp: string;
}

interface ChatBoxProps {
    messages: Message[];
    onSendMessage: (message: string) => void;
    isConnected: boolean;
    minimal?: boolean;
    showScrollbar?: boolean;
}

export default function ChatBox({ messages, onSendMessage, isConnected, minimal, showScrollbar }: ChatBoxProps) {
    const [input, setInput] = React.useState("");
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = input.trim();
        if (!trimmedInput || !isConnected) return;
        onSendMessage(trimmedInput);
        setInput("");
    };

    return (
        <div className={`flex flex-col h-full font-sans text-sm md:text-base ${minimal ? 'bg-transparent' : 'bg-white'}`}>
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth ${minimal && !showScrollbar ? 'scrollbar-hide' : 'scrollbar-sleek'}`}>
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-white/50">
                        <div className="text-4xl mb-2 grayscale opacity-50">✨</div>
                        <p className="font-medium">Say hi!</p>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${msg.isSelf ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                        <div
                            className={`max-w-[85%] px-4 py-2.5 shadow-sm relative backdrop-blur-sm ${msg.isSelf
                                ? "bg-[#FF8ba7] text-white rounded-2xl rounded-tr-none"
                                : "bg-white/10 text-white border border-white/10 rounded-2xl rounded-tl-none"
                                }`}
                        >
                            <p className="leading-relaxed font-medium">{msg.message}</p>
                            <span className={`text-[10px] block text-right mt-1 font-medium opacity-60`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={endRef} />
            </div>

            <form onSubmit={handleSubmit} className={`p-3 md:p-4 z-10 ${minimal ? 'bg-transparent' : 'bg-[#1a1a1a] border-t border-white/5'} sticky bottom-0`}>
                <div className="relative flex items-center gap-2 group">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter your message"
                        disabled={!isConnected}
                        className={`w-full rounded-full pl-5 pr-12 py-3 focus:outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-[15px]
                            ${minimal
                                ? 'bg-black/50 border border-white/20 text-white placeholder-zinc-400 focus:border-white/40 focus:bg-black/70 backdrop-blur-md'
                                : 'bg-black/20 border border-white/10 text-white placeholder-gray-500 focus:bg-black/40 focus:border-white/20'
                            }`}
                    />
                    <button
                        type="submit"
                        disabled={!isConnected || !input.trim()}
                        className={`absolute right-1.5 p-2 rounded-full text-white transition-all duration-300 flex items-center justify-center
                            disabled:opacity-0 disabled:scale-75
                            ${minimal
                                ? 'bg-zinc-700 hover:bg-zinc-600 border border-white/10 shadow-sm scale-100 active:scale-95 w-9 h-9'
                                : 'bg-white/10 hover:bg-white/20 text-white/90 hover:text-white border border-white/5'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
}
