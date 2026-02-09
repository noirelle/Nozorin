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
        try {
            // For now, we'll generate the token on the backend
            // In a future iteration, this could call /api/visitor
            // But since we're using Socket.IO only, we'll use the JWT utils directly

            // Import jwt and uuid on client side is not ideal
            // Let's use a simple client-side UUID for now and have the server validate
            // Actually, let's emit a socket event to get the token

            // For simplicity, we'll use a pseudo-token (UUID) and the server will track sessions
            // In production, you'd want to call a proper API endpoint
            const response = await fetch('/api/visitor', {
                method: 'POST',
            });

            if (response.ok) {
                const data = await response.json();
                const token = data.token;

                localStorage.setItem(VISITOR_TOKEN_KEY, token);
                setVisitorToken(token);
            } else {
                console.error('Failed to generate visitor token');
            }
        } catch (error) {
            console.error('Error generating visitor token:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const clearToken = () => {
        localStorage.removeItem(VISITOR_TOKEN_KEY);
        setVisitorToken(null);
    };

    return {
        visitorToken,
        isLoading,
        clearToken,
        regenerateToken: generateVisitorToken,
    };
};
