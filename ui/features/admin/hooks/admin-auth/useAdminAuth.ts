'use client';

import { useAdminStore } from '@/stores/useAdminStore';
import { useAdminAuthState } from './useAdminAuthState';
import { useAdminAuthActions } from './useAdminAuthActions';
import { useAdminAuthEffects } from './useAdminAuthEffects';

export const useAdminAuth = () => {
    const { isAdminAuthenticated, isAdminChecked } = useAdminStore();

    // 1. State
    const state = useAdminAuthState();

    // 2. Actions
    const actions = useAdminAuthActions({
        setIsLoading: state.setIsLoading,
        setError: state.setError,
    });

    // 3. Effects
    useAdminAuthEffects({
        refresh: actions.refresh,
    });

    return {
        // Methods
        login: actions.login,
        logout: actions.logout,
        refresh: actions.refresh,

        // Transitional State
        isLoading: state.isLoading,
        error: state.error,

        // Store State (re-exported for convenience)
        isAdminAuthenticated,
        isAdminChecked,
    };
};
