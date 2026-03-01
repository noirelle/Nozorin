import { useChatState } from './useChatState';
import { useChatActions } from './useChatActions';
import { useChatListeners } from './useChatListeners';

export type { Message } from './useChatState';

export const useChat = (partnerId: string | null) => {
    const state = useChatState();
    const actions = useChatActions({ partnerId, setMessages: state.setMessages, setShowChat: state.setShowChat });
    useChatListeners({ setMessages: state.setMessages, setShowChat: state.setShowChat });

    return {
        messages: state.messages,
        showChat: state.showChat,
        setShowChat: state.setShowChat,
        messagesEndRef: state.messagesEndRef,
        sendMessage: actions.sendMessage,
        clearMessages: actions.clearMessages,
    };
};
