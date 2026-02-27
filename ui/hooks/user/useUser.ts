'use client';

import { useUserState } from './useUserState';
import { useUserActions } from './useUserActions';
import { useUserEffects } from './useUserEffects';

export const useUser = () => {
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
    });

    return {
        user: state.user,
        token: state.token,
        isChecked: state.isChecked,
        isChecking: state.isChecking,
        isRegistering: state.isRegistering,
        location: state.location,
        setLocation: state.setLocation,
        clearToken: state.logout,
        refreshUser: actions.refreshUser,
        ensureToken: actions.ensureToken,
    };
};
