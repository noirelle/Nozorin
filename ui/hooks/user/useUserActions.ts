'use client';

import { useCallback } from 'react';
import { api } from '../../lib/api';
import { UserProfile } from '../../types/user';
import { UseUserStateReturn } from './useUserState';

// Singleton promise to deduplicate concurrent /api/me requests across multiple hook instances
let globalFetchPromise: Promise<string | null> | null = null;

interface UseUserActionsProps {
    token: UseUserStateReturn['token'];
    user: UseUserStateReturn['user'];
    login: UseUserStateReturn['login'];
    logout: UseUserStateReturn['logout'];
    setToken: UseUserStateReturn['setToken'];
    setChecked: UseUserStateReturn['setChecked'];
}

export const useUserActions = ({ token, user, login, logout, setToken, setChecked }: UseUserActionsProps) => {
    const fetchMe = useCallback(async (currentToken: string) => {
        if (globalFetchPromise) return globalFetchPromise;

        globalFetchPromise = (async () => {
            try {
                const { error: apiError, data: userData } = await api.get<UserProfile>('/api/me', {
                    headers: { 'Authorization': `Bearer ${currentToken}` },
                    credentials: 'include',
                });
                setChecked(true);
                if (!apiError && userData) {
                    // Pull the absolute latest token from the store, in case it was refreshed during the request
                    const finalToken = (typeof window !== 'undefined' ? localStorage.getItem('nz_token') : null) || currentToken;
                    login(finalToken, userData as UserProfile);
                    return finalToken;
                } else {
                    logout();
                    return null;
                }
            } catch (error) {
                console.error('[useUser] Error fetching user:', error);
                setChecked(true);
                return null;
            } finally {
                globalFetchPromise = null;
            }
        })();

        return globalFetchPromise;
    }, [login, logout, setChecked]);

    const refreshUser = useCallback(async () => {
        try {
            const res = await api.post<{ token: string }>('/api/auth/refresh', {});
            if (res.data?.token) {
                if (user) login(res.data.token, user);
                else setToken(res.data.token);
                return res.data.token;
            }
        } catch (e) {
            console.error('[useUser] Failed to refresh token:', e);
        }
        return null;
    }, [user, login, setToken]);

    const ensureToken = useCallback(async () => {
        if (token) return token;
        return localStorage.getItem('nz_token');
    }, [token]);

    return { fetchMe, refreshUser, ensureToken };
};
