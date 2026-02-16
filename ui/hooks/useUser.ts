'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore, AuthState } from '../stores/useAuthStore';
import { api } from '../lib/api';
import { UserProfile } from '../types/user';

// Module-level promise to deduplicate requests across multiple hook instances
let globalFetchPromise: Promise<string | null> | null = null;

export const useUser = () => {
    const { user, token, setToken, login, logout, location, setLocation, isChecked, setChecked } = useAuthStore((state: AuthState) => state);
    const [isChecking, setIsChecking] = useState(!isChecked);
    const [isRegistering, setIsRegistering] = useState(false);

    const fetchMe = useCallback(async (currentToken: string) => {
        // If a request is already in progress, return the existing promise
        if (globalFetchPromise) return globalFetchPromise;

        globalFetchPromise = (async () => {
            try {
                const { error: apiError, data: userData } = await api.get<UserProfile>('/api/me', {
                    headers: { 'Authorization': `Bearer ${currentToken}` },
                    credentials: 'include'
                });

                // Mark checked regardless of outcome to stop redundant calls
                setChecked(true);

                if (!apiError && userData) {
                    login(currentToken, userData as UserProfile);
                    return currentToken;
                } else {
                    logout();
                    return null;
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                setChecked(true);
                return null;
            } finally {
                globalFetchPromise = null;
            }
        })();

        return globalFetchPromise;
    }, [login, logout, setChecked]);

    useEffect(() => {
        let mounted = true;

        if (isChecked) {
            if (mounted) setIsChecking(false);
            return;
        }

        const check = async () => {
            if (mounted) setIsChecking(true);

            // Re-check state from store directly to catch parallel hook updates
            if (useAuthStore.getState().isChecked) {
                if (mounted) setIsChecking(false);
                return;
            }

            const oldToken = localStorage.getItem('nz_token');
            const currentToken = token || oldToken;

            if (currentToken) {
                await fetchMe(currentToken);
            } else {
                setChecked(true);
            }

            if (mounted) setIsChecking(false);
        };

        check();
        return () => { mounted = false; };
    }, [isChecked, token, fetchMe, setChecked]);

    const ensureToken = async () => {
        if (token) return token;
        const oldToken = localStorage.getItem('nz_token');
        if (oldToken) return oldToken;
        return null;
    };

    return {
        user,
        token,
        isChecking,
        isRegistering,
        refreshUser: () => {
            const currentToken = token || localStorage.getItem('nz_token');
            if (currentToken) return fetchMe(currentToken);
            return Promise.resolve(null);
        },
        clearToken: logout,
        ensureToken,
        location,
        setLocation
    };
};
