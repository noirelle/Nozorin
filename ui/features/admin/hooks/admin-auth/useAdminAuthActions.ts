'use client';

import { useCallback } from 'react';
import { admin } from '@/lib/api';
import { UseAdminAuthStateReturn } from '../types';
import { useAdminStore } from '@/stores/useAdminStore';

interface UseAdminAuthActionsProps {
    setIsLoading: UseAdminAuthStateReturn['setIsLoading'];
    setError: UseAdminAuthStateReturn['setError'];
}

export const useAdminAuthActions = ({ setIsLoading, setError }: UseAdminAuthActionsProps) => {
    const { setAdminToken, adminLogout } = useAdminStore();

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
    }, [setAdminToken, setIsLoading, setError]);

    const refresh = useCallback(async () => {
        try {
            const result = await admin.refresh();
            if (result.data?.token) {
                setAdminToken(result.data.token);
                console.log('[ADMIN] Token refreshed automatically');
                return true;
            } else {
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

    return {
        login,
        refresh,
        logout,
    };
};
