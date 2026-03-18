'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { UseUserStateReturn } from './useUserState';
import { useUserActions } from './useUserActions';
import { useSocketEvent, SocketEvents } from '../../lib/socket';
import { useRef } from 'react';

interface UseUserEffectsProps {
    isChecked: UseUserStateReturn['isChecked'];
    token: UseUserStateReturn['token'];
    setIsChecking: UseUserStateReturn['setIsChecking'];
    setChecked: UseUserStateReturn['setChecked'];
    fetchMe: ReturnType<typeof useUserActions>['fetchMe'];
    skipCheck?: boolean;
}

export const useUserEffects = ({
    isChecked,
    token,
    setIsChecking,
    setChecked,
    fetchMe,
    skipCheck,
}: UseUserEffectsProps) => {
    useEffect(() => {
        let mounted = true;

        if (skipCheck) {
            if (mounted) setIsChecking(false);
            return;
        }

        if (isChecked) {
            if (mounted) setIsChecking(false);
            return;
        }

        const check = async () => {
            if (mounted) setIsChecking(true);

            const oldToken = localStorage.getItem('nz_token');
            const currentToken = token || oldToken;

            if (currentToken) {
                await fetchMe(currentToken);
            } else {
                setChecked(true);
            }

            if (mounted) setIsChecking(false);
        };

        check();
        return () => { mounted = false; };
    }, [isChecked, token, fetchMe, setIsChecking, setChecked]);

    // Handle real-time profile updates from Admin or System
    const updateUser = useAuthStore(s => s.updateUser);
    const handleProfileUpdate = useRef((profile: any) => updateUser(profile));
    useEffect(() => { handleProfileUpdate.current = (profile: any) => updateUser(profile); }, [updateUser]);

    useSocketEvent<{ profile: any }>(
        SocketEvents.PROFILE_UPDATED,
        useRef((data: { profile: any }) => handleProfileUpdate.current(data.profile)).current
    );
};
