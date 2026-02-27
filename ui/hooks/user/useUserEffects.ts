'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { UseUserStateReturn } from './useUserState';
import { useUserActions } from './useUserActions';

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
            if (mounted) {
                setIsChecking(false);
                setChecked(true);
            }
            return;
        }

        if (isChecked) {
            if (mounted) setIsChecking(false);
            return;
        }

        const check = async () => {
            if (mounted) setIsChecking(true);

            if (useAuthStore.getState().isChecked) {
                if (mounted) setIsChecking(false);
                return;
            }

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
    }, [isChecked, token, fetchMe, setIsChecking, setChecked, skipCheck]);
};
