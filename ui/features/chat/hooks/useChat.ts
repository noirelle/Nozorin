import { useState, useRef, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';

export interface Message {
    senderId: string;
    isSelf: boolean;
    message: string;
    timestamp: string;
}

export const useChat = (socket: Socket | null, partnerId: string | null) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [showChat, setShowChat] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Listen for incoming messages
    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = ({
            senderId,
            message,
            timestamp,
        }: {
            senderId: string;
            message: string;
            timestamp: string;
        }) => {
            setMessages((prev) => [
                ...prev,
                {
                    senderId,
                    isSelf: false,
                    message,
                    timestamp,
                },
            ]);
            setShowChat(true); // Auto-open chat on receive
        };

        socket.on('receive-message', handleReceiveMessage);

        return () => {
            socket.off('receive-message', handleReceiveMessage);
        };
    }, [socket]);

    const sendMessage = useCallback((text: string) => {
        if (!partnerId || !socket) return;

        const msg: Message = {
            senderId: socket.id || 'me',
            isSelf: true,
            message: text,
            timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, msg]);
        socket.emit('send-message', { target: partnerId, message: text });
    }, [partnerId, socket]);

    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    return {
        messages,
        showChat,
        setShowChat,
        messagesEndRef,
        sendMessage,
        clearMessages,
    };
};
