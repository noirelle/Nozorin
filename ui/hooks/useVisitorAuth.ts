'use client';

import { useEffect, useState } from 'react';

const VISITOR_TOKEN_KEY = 'nozorin_visitor_token';

export const useVisitorAuth = () => {
    const [visitorToken, setVisitorToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if token already exists in localStorage
        const existingToken = localStorage.getItem(VISITOR_TOKEN_KEY);

        if (existingToken) {
            setVisitorToken(existingToken);
            setIsLoading(false);
        } else {
            // Generate a new visitor token from the API
            generateVisitorToken();
        }
    }, []);

    const generateVisitorToken = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/visitor', {
                method: 'POST',
            });

            if (response.ok) {
                const data = await response.json();
                const token = data.token;

                localStorage.setItem(VISITOR_TOKEN_KEY, token);
                setVisitorToken(token);
                console.log('[Auth] New visitor token generated');
                return token;
            } else {
                console.error('Failed to generate visitor token');
            }
        } catch (error) {
            console.error('Error generating visitor token:', error);
        } finally {
            setIsLoading(false);
        }
        return null;
    };

    const ensureToken = async () => {
        if (visitorToken) return visitorToken;
        const existingToken = localStorage.getItem(VISITOR_TOKEN_KEY);
        if (existingToken) {
            setVisitorToken(existingToken);
            return existingToken;
        }
        return await generateVisitorToken();
    };

    const clearToken = () => {
        localStorage.removeItem(VISITOR_TOKEN_KEY);
        setVisitorToken(null);
    };

    return {
        visitorToken,
        isLoading,
        clearToken,
        ensureToken,
        regenerateToken: generateVisitorToken,
    };
};
