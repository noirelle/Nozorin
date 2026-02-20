import { useState, useRef, useEffect, useCallback } from 'react';
import { useSocketEvent } from '../../../lib/socket';
import { SocketEvents } from '../../../lib/socket';
import { emitSendMessage } from '../../../lib/socket/chat/chat.actions';
import { ReceiveMessagePayload } from '../../../lib/socket/chat/chat.types';
import { getSocketClient } from '../../../lib/socket/socketClient';

export interface Message {
    senderId: string;
    isSelf: boolean;
    message: string;
    timestamp: string;
}

export const useChat = (partnerId: string | null) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [showChat, setShowChat] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleReceiveMessage = useCallback((data: ReceiveMessagePayload) => {
        setMessages(prev => [...prev, { ...data, isSelf: false }]);
        setShowChat(true);
    }, []);

    useSocketEvent<ReceiveMessagePayload>(SocketEvents.RECEIVE_MESSAGE, handleReceiveMessage);

    const sendMessage = useCallback((text: string) => {
        if (!partnerId) return;
        const socket = getSocketClient();
        const msg: Message = {
            senderId: socket?.id || 'me',
            isSelf: true,
            message: text,
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, msg]);
        emitSendMessage(partnerId, text);
    }, [partnerId]);

    const clearMessages = useCallback(() => { setMessages([]); }, []);

    return {
        messages,
        showChat,
        setShowChat,
        messagesEndRef,
        sendMessage,
        clearMessages,
    };
};
