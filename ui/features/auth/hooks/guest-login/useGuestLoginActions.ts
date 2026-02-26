'use client';

import { useCallback } from 'react';
import { useAuthStore, AuthState } from '../../../../stores/useAuthStore';
import { useSession } from '@/hooks';
import { api } from '../../../../lib/api';
import {
    GuestRegistrationRequest,
    GuestRegistrationResponse,
    AnonymousLoginResponse
} from '../../../../types/api';
import { getBrowserFingerprint } from '../../../../utils/fingerprint';
import { UseGuestLoginStateReturn } from './useGuestLoginState';

interface UserGuestInput {
    username: string;
    gender: string;
    agreed: boolean;
}

// Module-level promise for deduplication
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

interface UseGuestLoginActionsProps {
    setIsRegistering: UseGuestLoginStateReturn['setIsRegistering'];
    setError: UseGuestLoginStateReturn['setError'];
}

export const useGuestLoginActions = ({ setIsRegistering, setError }: UseGuestLoginActionsProps) => {
    const login = useAuthStore((state: AuthState) => state.login);
    const setLocation = useAuthStore((state: AuthState) => state.setLocation);
    // Use the shimmed useSession (or relative usage)
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

                const deviceId = getDeviceId();
                const fingerprint = getBrowserFingerprint();

                const { error: guestError, data: guestData } = await api.post<GuestRegistrationResponse, GuestRegistrationRequest>('/api/auth/guest', {
                    ...data,
                    session_id: sessionId as string,
                    device_id: deviceId,
                    footprint: fingerprint
                });

                if (guestError || !guestData) {
                    setError(guestError || 'Failed to register. Please try again.');
                    return false;
                }

                const { user: newUser } = guestData;

                const { error: authError, data: authData } = await api.post<AnonymousLoginResponse>('/api/auth/anonymous', {
                    chatIdentityId: newUser.id
                });

                if (authError || !authData) {
                    setError(authError || 'Failed to retrieve auth token.');
                    return false;
                }

                login(authData.token, newUser);

                const locationData = {
                    location: {
                        country_name: newUser.country_name,
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        detectionMethod: 'timezone',
                        detectedAt: new Date().toISOString()
                    },
                    sessionId: sessionId as string,
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
    }, [login, setLocation, getSessionId, setIsRegistering, setError]);

    return { registerGuest };
};

export type { UserGuestInput };
