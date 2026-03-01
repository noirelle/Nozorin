import { useCallback } from 'react';
import { useSocketEvent, SocketEvents } from '../../../../lib/socket';
import { ReceiveMessagePayload } from '../../../../lib/socket/chat/chat.types';
import { UseChatStateReturn } from './useChatState';

interface UseChatListenersProps {
    setMessages: UseChatStateReturn['setMessages'];
    setShowChat: UseChatStateReturn['setShowChat'];
}

export const useChatListeners = ({ setMessages, setShowChat }: UseChatListenersProps) => {
    const handleReceiveMessage = useCallback((data: ReceiveMessagePayload) => {
        setMessages(prev => [...prev, { ...data, isSelf: false }]);
        setShowChat(true);
    }, [setMessages, setShowChat]);

    useSocketEvent<ReceiveMessagePayload>(SocketEvents.RECEIVE_MESSAGE, handleReceiveMessage);
};
