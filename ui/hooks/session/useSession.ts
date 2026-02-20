'use client';

import { useEffect } from 'react';
import { useSessionState } from './useSessionState';
import { useSessionActions } from './useSessionActions';

export const useSession = () => {
    const { sessionId, setSessionId } = useSessionState();
    const { getSessionId } = useSessionActions();

    useEffect(() => {
        setSessionId(getSessionId());
    }, [getSessionId, setSessionId]);

    return {
        sessionId,
        getSessionId,
    };
};
