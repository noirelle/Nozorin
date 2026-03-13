'use client';

import { useCallback } from 'react';
import { useRoomActions } from '@/hooks';

interface UseVoiceRoomActionsProps {
    actions: ReturnType<typeof useRoomActions>;
    clearReconnectState: () => void;
}

export const useVoiceRoomActions = ({
    actions,
    clearReconnectState,
}: UseVoiceRoomActionsProps) => {
    const handleNext = useCallback(() => {
        clearReconnectState();
        actions.handleNext();
    }, [clearReconnectState, actions]);

    const handleStop = useCallback(() => {
        clearReconnectState();
        actions.handleStop();
    }, [clearReconnectState, actions]);

    const handleUserStop = useCallback(() => {
        clearReconnectState();
        actions.handleUserStop();
    }, [clearReconnectState, actions]);

    return {
        handleNext,
        handleStop,
        handleUserStop,
    };
};
