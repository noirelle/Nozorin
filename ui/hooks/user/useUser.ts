'use client';

import { useUserState } from './useUserState';
import { useUserActions } from './useUserActions';
import { useUserEffects } from './useUserEffects';

export const useUser = (options?: { skipCheck?: boolean }) => {
    const { skipCheck = false } = options || {};
    const state = useUserState();
    const actions = useUserActions({
        token: state.token,
        user: state.user,
        login: state.login,
        logout: state.logout,
        setToken: state.setToken,
        setChecked: state.setChecked,
    });

    useUserEffects({
        isChecked: state.isChecked,
        token: state.token,
        setIsChecking: state.setIsChecking,
        setChecked: state.setChecked,
        fetchMe: actions.fetchMe,
        skipCheck,
    });

    return {
        user: state.user,
        token: state.token,
        isChecking: state.isChecking,
        isRegistering: state.isRegistering,
        location: state.location,
        setLocation: state.setLocation,
        clearToken: state.logout,
        refreshUser: actions.refreshUser,
        ensureToken: actions.ensureToken,
    };
};
