'use client';

import { useGuestLoginState } from './useGuestLoginState';
import { useGuestLoginActions } from './useGuestLoginActions'; // and type UserGuestInput

export const useGuestLogin = () => {
    const state = useGuestLoginState();
    const actions = useGuestLoginActions({
        setIsRegistering: state.setIsRegistering,
        setError: state.setError,
    });

    return {
        registerGuest: actions.registerGuest,
        isRegistering: state.isRegistering,
        error: state.error,
    };
};
