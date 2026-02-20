'use client';

import { useState } from 'react';

export const useGuestLoginState = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState<string | null>(null);

    return {
        isRegistering,
        error,
        setIsRegistering,
        setError,
    };
};

export type UseGuestLoginStateReturn = ReturnType<typeof useGuestLoginState>;
