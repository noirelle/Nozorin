import { useCallback } from 'react';
import { emitSendMessage } from '../../../../lib/socket/chat/chat.actions';
import { getSocketClient } from '../../../../lib/socket/core/socketClient';
import { Message, UseChatStateReturn } from './useChatState';

interface UseChatActionsProps {
    partnerId: string | null;
    setMessages: UseChatStateReturn['setMessages'];
    setShowChat: UseChatStateReturn['setShowChat'];
}

export const useChatActions = ({ partnerId, setMessages, setShowChat }: UseChatActionsProps) => {
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
    }, [partnerId, setMessages]);

    const clearMessages = useCallback(() => {
        setMessages([]);
    }, [setMessages]);

    return { sendMessage, clearMessages, setShowChat };
};
