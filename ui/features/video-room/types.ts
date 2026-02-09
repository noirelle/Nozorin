import { VideoRoomState } from './hooks/useVideoRoom';
import { Message } from '../chat/hooks/useChat';
import { RefObject } from 'react';

export interface RoomLayoutProps {
    videoRoomState: VideoRoomState;
    partnerIsMuted: boolean;
    partnerIsCameraOff: boolean;
    showChat: boolean;
    messages: Message[];
    inputText: string;

    localVideoRef: RefObject<HTMLVideoElement | null>;
    remoteVideoRef: RefObject<HTMLVideoElement | null>;
    messagesEndRef: RefObject<HTMLDivElement | null>;

    onStop: () => void;
    onNext: () => void;
    onToggleMute: () => void;
    onToggleCamera: () => void;
    onSendMessage: (text: string) => void;
    setShowChat: (show: boolean) => void;
    setInputText: (text: string) => void;
    onNavigateToChat?: () => void;
    onNavigateToHistory?: () => void;

    // Mobile specific
    mobileLayout?: 'overlay' | 'split';
    setMobileLayout?: (layout: 'overlay' | 'split') => void;

    // Desktop specific
    filtersOpen?: boolean;
    setFiltersOpen?: (open: boolean) => void;

    // Country Filter
    selectedCountry: string;
    onSelectCountry: (code: string) => void;
}
