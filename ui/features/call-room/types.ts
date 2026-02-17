import { CallRoomState } from './hooks/useCallRoom';
import { Message } from './hooks/useChat';
import { RefObject } from 'react';
import { MatchStatus } from './hooks/useMatching';

export interface RoomLayoutProps {
    callRoomState: CallRoomState;
    partnerIsMuted: boolean;

    showChat: boolean;
    messages: Message[];
    inputText: string;
    matchmakingStatus: MatchStatus;
    queuePosition: number | null;

    remoteAudioRef: RefObject<HTMLAudioElement | null>;
    messagesEndRef: RefObject<HTMLDivElement | null>;

    onStop: () => void;
    onNext: () => void;
    onToggleMute: () => void;

    onSendMessage: (text: string) => void;
    setShowChat: (show: boolean) => void;
    setInputText: (text: string) => void;
    onNavigateToHistory?: () => void;
    onNavigateToFriends?: () => void;
    onAddFriend?: (targetId: string) => void;
    friends?: any[];

    // Mobile specific
    mobileLayout?: 'overlay' | 'split';
    setMobileLayout?: (layout: 'overlay' | 'split') => void;

    // Desktop specific
    filtersOpen?: boolean;
    setFiltersOpen?: (open: boolean) => void;

    // Country Filter
    selectedCountry: string;
    onSelectCountry: (code: string) => void;

    // Reconnect state
    isReconnecting?: boolean;
    reconnectCountdown?: number | null;
}
