import { useState, useRef, useEffect } from 'react';

export interface Message {
    sender_id: string;
    isSelf: boolean;
    message: string;
    timestamp: string;
}

export const useChatState = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [showChat, setShowChat] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return {
        messages,
        showChat,
        messagesEndRef,
        setMessages,
        setShowChat,
    };
};

export type UseChatStateReturn = ReturnType<typeof useChatState>;
