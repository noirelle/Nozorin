'use client';

import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const LOCATION_KEY = 'nz_location';

export const useSessionActions = () => {
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
            // Note: We don't save back to localStorage here because 
            // the full location object structure is managed elsewhere (useUser/useGuestLogin).
            // But if we generated a new ID, we return it.
        }

        return sid;
    }, []);

    return { getSessionId };
};
