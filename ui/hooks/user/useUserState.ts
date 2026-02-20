'use client';

import { useState } from 'react';
import { useAuthStore, AuthState } from '../../stores/useAuthStore';

export const useUserState = () => {
    const authState = useAuthStore((state: AuthState) => state);
    const [isChecking, setIsChecking] = useState(!authState.isChecked);
    const [isRegistering, setIsRegistering] = useState(false);

    return {
        ...authState,
        isChecking,
        isRegistering,
        setIsChecking,
        setIsRegistering,
    };
};

export type UseUserStateReturn = ReturnType<typeof useUserState>;
