'use client';

import { useEffect, useRef } from 'react';
import { useAdminStore } from '@/stores/useAdminStore';

interface UseAdminAuthEffectsProps {
    refresh: () => Promise<boolean>;
}

export const useAdminAuthEffects = ({ refresh }: UseAdminAuthEffectsProps) => {
    const {
        adminToken,
        isAdminAuthenticated,
        isAdminChecked,
        setAdminChecked
    } = useAdminStore();

    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
    const initialCheckRef = useRef(false);

    // 1. Initial session restoration
    useEffect(() => {
        if (!isAdminChecked && !initialCheckRef.current) {
            initialCheckRef.current = true;
            refresh().finally(() => {
                setAdminChecked(true);
            });
        }
    }, [isAdminChecked, refresh, setAdminChecked]);

    // 2. Automatic token refresh logic
    useEffect(() => {
        if (isAdminAuthenticated && adminToken) {
            // Refresh every 14 minutes (token expires in 15m)
            const REFRESH_INTERVAL = 14 * 60 * 1000;

            if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);

            refreshTimerRef.current = setInterval(() => {
                refresh();
            }, REFRESH_INTERVAL);
        } else {
            if (refreshTimerRef.current) {
                clearInterval(refreshTimerRef.current);
                refreshTimerRef.current = null;
            }
        }

        return () => {
            if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
        };
    }, [isAdminAuthenticated, adminToken, refresh]);
};
