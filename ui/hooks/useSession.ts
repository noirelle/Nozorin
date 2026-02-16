import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const LOCATION_KEY = 'nz_location';

export const useSession = () => {
    const [sessionId, setSessionId] = useState<string | null>(null);

    const getSessionId = useCallback(() => {
        if (typeof window === 'undefined') return null;

        let sid = '';
        try {
            const stored = localStorage.getItem(LOCATION_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.sessionId) sid = parsed.sessionId;
            }
        } catch (e) {
            // Ignore error
        }

        if (!sid) {
            sid = uuidv4();
        }

        return sid;
    }, []);

    useEffect(() => {
        setSessionId(getSessionId());
    }, [getSessionId]);

    return {
        sessionId,
        getSessionId
    };
};
