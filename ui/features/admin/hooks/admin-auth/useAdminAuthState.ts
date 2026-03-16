'use client';

import { useState } from 'react';
import { UseAdminAuthStateReturn } from '../types';

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
