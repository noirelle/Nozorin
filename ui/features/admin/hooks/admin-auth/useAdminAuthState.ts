'use client';

import { useState } from 'react';

export const useAdminAuthState = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    return {
        isLoading,
        setIsLoading,
        error,
        setError,
    };
};

export type UseAdminAuthStateReturn = ReturnType<typeof useAdminAuthState>;
