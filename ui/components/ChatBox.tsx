
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
}

export default function ChatBox({ messages, onSendMessage, isConnected }: ChatBoxProps) {
    const [input, setInput] = React.useState("");
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !isConnected) return;
        onSendMessage(input);
        setInput("");
    };

    return (
        <div className="flex flex-col h-full bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-gray-500 text-center mt-10">
                        Say hi to your new friend!
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${msg.isSelf ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[80%] px-4 py-2 rounded-lg ${msg.isSelf
                                    ? "bg-blue-600 text-white rounded-br-none"
                                    : "bg-gray-700 text-gray-200 rounded-bl-none"
                                }`}
                        >
                            <p>{msg.message}</p>
                            <span className="text-xs opacity-50 block text-right mt-1">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={endRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 bg-gray-900 border-t border-gray-700 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isConnected ? "Type a message..." : "Waiting for connection..."}
                    disabled={!isConnected}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={!isConnected || !input.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition"
                >
                    Send
                </button>
            </form>
        </div>
    );
}
