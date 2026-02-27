import { useState } from 'react';

export const useSessionState = () => {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isVerifyingSession, setIsVerifyingSession] = useState(false);
    const [initialReconnecting, setInitialReconnecting] = useState(false);
    const [initialCallData, setInitialCallData] = useState<any>(null);

    return {
        sessionId,
        setSessionId,
        isVerifyingSession,
        setIsVerifyingSession,
        initialReconnecting,
        setInitialReconnecting,
        initialCallData,
        setInitialCallData,
    };
};
