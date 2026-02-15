import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuthStore, AuthState } from '../../../stores/useAuthStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UserGuestInput {
    username: string;
    gender: string;
    agreed: boolean;
}

interface UseGuestLoginReturn {
    registerGuest: (data: UserGuestInput) => Promise<boolean>;
    isRegistering: boolean;
    error: string | null;
}

// Module-level promise to deduplicate simultaneous guest registration requests
let globalRegisterPromise: Promise<boolean> | null = null;

export const useGuestLogin = (): UseGuestLoginReturn => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const login = useAuthStore((state: AuthState) => state.login);
    const setLocation = useAuthStore((state: AuthState) => state.setLocation);

    const registerGuest = useCallback(async (data: UserGuestInput) => {
        if (globalRegisterPromise) return globalRegisterPromise;

        globalRegisterPromise = (async () => {
            setIsRegistering(true);
            setError(null);
            try {
                let sessionId = '';
                try {
                    const existingLocation = localStorage.getItem('nz_location');
                    if (existingLocation) {
                        const parsed = JSON.parse(existingLocation);
                        if (parsed.sessionId) sessionId = parsed.sessionId;
                    }
                } catch (e) {
                    console.error('Error parsing location data', e);
                }

                if (!sessionId) sessionId = uuidv4();

                const res = await fetch(`${API_URL}/api/guest`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...data, sessionId }),
                });

                if (res.ok) {
                    const { user: newUser } = await res.json();

                    // Second step: Get token using chatIdentityId
                    const tokenRes = await fetch(`${API_URL}/api/token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chatIdentityId: newUser.id }),
                        credentials: 'include'
                    });

                    if (tokenRes.ok) {
                        const { token: newToken } = await tokenRes.json();
                        login(newToken, newUser);

                        // Save footprint/location data
                        const locationData = {
                            location: {
                                country: newUser.country,
                                city: newUser.city,
                                region: newUser.region,
                                lat: newUser.lat,
                                lon: newUser.lon,
                                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                                detectionMethod: 'timezone',
                                detectedAt: new Date().toISOString()
                            },
                            sessionId,
                            timestamp: Date.now()
                        };
                        setLocation(locationData);
                        return true;
                    } else {
                        const errorText = await tokenRes.text();
                        console.error(`Token retrieval failed: ${tokenRes.status}`, errorText);
                        setError(`Failed to retrieve authentication token: ${tokenRes.status}`);
                        return false;
                    }
                } else {
                    const errorText = await res.text();
                    console.error(`Register guest failed: ${res.status} ${res.statusText}`, errorText);
                    setError('Failed to register. Please try again.');
                    return false;
                }
            } catch (error) {
                console.error('Error registering guest:', error);
                setError('An error occurred. Please try again.');
                return false;
            } finally {
                setIsRegistering(false);
                globalRegisterPromise = null;
            }
        })();

        return globalRegisterPromise;
    }, [login, setLocation]);

    return {
        registerGuest,
        isRegistering,
        error
    };
};
