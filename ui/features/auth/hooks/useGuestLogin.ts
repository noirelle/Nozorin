import { useState, useCallback } from 'react';
import { useAuthStore, AuthState } from '../../../stores/useAuthStore';
import { useSession } from '../../../hooks/useSession';
import { api } from '../../../lib/api';
import {
    GuestRegistrationRequest,
    GuestRegistrationResponse,
    AnonymousLoginResponse
} from '../../../types/api';

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

const getDeviceId = (): string => {
    if (typeof window === 'undefined') return '';
    let deviceId = localStorage.getItem('nz_device_id');
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('nz_device_id', deviceId);
    }
    return deviceId;
};

export const useGuestLogin = (): UseGuestLoginReturn => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const login = useAuthStore((state: AuthState) => state.login);
    const setLocation = useAuthStore((state: AuthState) => state.setLocation);
    const { getSessionId } = useSession();

    const registerGuest = useCallback(async (data: UserGuestInput) => {
        if (globalRegisterPromise) return globalRegisterPromise;

        globalRegisterPromise = (async () => {
            setIsRegistering(true);
            setError(null);
            try {
                const sessionId = getSessionId();

                if (!sessionId) {
                    setError('Session initialization failed. Please try again.');
                    return false;
                }

                // Step 1: Register Guest
                const deviceId = getDeviceId();
                const { error: guestError, data: guestData } = await api.post<GuestRegistrationResponse, GuestRegistrationRequest>('/api/auth/guest', {
                    ...data,
                    sessionId,
                    deviceId
                });

                if (guestError || !guestData) {
                    setError(guestError || 'Failed to register. Please try again.');
                    return false;
                }

                const { user: newUser } = guestData;

                // Step 2: Get Token (Anonymous Identity)
                const { error: authError, data: authData } = await api.post<AnonymousLoginResponse>('/api/auth/anonymous', {
                    chatIdentityId: newUser.id
                });

                if (authError || !authData) {
                    setError(authError || 'Failed to retrieve auth token.');
                    return false;
                }

                const { token: newToken } = authData;

                // Update auth store
                login(newToken, newUser);

                // Save location/footprint data
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
            } catch (err) {
                console.error('Error in guest login flow:', err);
                setError('An error occurred. Please try again.');
                return false;
            } finally {
                setIsRegistering(false);
                globalRegisterPromise = null;
            }
        })();

        return globalRegisterPromise;
    }, [login, setLocation, getSessionId]);

    return {
        registerGuest,
        isRegistering,
        error
    };
};
