import { useState, useCallback, useEffect, useRef } from 'react';
import { admin } from '@/lib/api';
import { useAdminStore } from '@/stores/useAdminStore';

export const useAdminAuth = () => {
    const { 
        adminToken, 
        setAdminToken, 
        adminLogout, 
        isAdminAuthenticated,
        isAdminChecked,
        setAdminChecked
    } = useAdminStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
    const initialCheckRef = useRef(false);

    const login = useCallback(async (password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await admin.login(password);
            if (result.error) {
                setError(result.error);
                return false;
            }
            if (result.data?.token) {
                setAdminToken(result.data.token);
                return true;
            }
            return false;
        } catch (err) {
            setError('Login failed. Please try again.');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [setAdminToken]);

    const refresh = useCallback(async () => {
        try {
            const result = await admin.refresh();
            if (result.data?.token) {
                setAdminToken(result.data.token);
                console.log('[ADMIN] Token refreshed automatically');
                return true;
            } else {
                // If refresh fails, log out
                adminLogout();
                return false;
            }
        } catch (err) {
            adminLogout();
            return false;
        }
    }, [setAdminToken, adminLogout]);

    const logout = useCallback(async () => {
        await admin.logout();
        adminLogout();
    }, [adminLogout]);

    // Initial session restoration
    useEffect(() => {
        if (!isAdminChecked && !initialCheckRef.current) {
            initialCheckRef.current = true;
            refresh().finally(() => {
                setAdminChecked(true);
            });
        }
    }, [isAdminChecked, refresh, setAdminChecked]);

    // Automatic token refresh logic
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

    return {
        login,
        logout,
        refresh,
        isLoading,
        error,
        isAdminAuthenticated,
        isAdminChecked
    };
};
