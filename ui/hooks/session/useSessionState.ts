'use client';

import { useState } from 'react';

export const useSessionState = () => {
    const [sessionId, setSessionId] = useState<string | null>(null);

    return {
        sessionId,
        setSessionId,
    };
};
