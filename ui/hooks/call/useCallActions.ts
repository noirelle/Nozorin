'use client';

import { useCallback } from 'react';
import { call } from '@/lib/api/index';

export interface UseCallActionsProps {
    setError?: (error: string | null) => void;
    setIsLoading?: (loading: boolean) => void;
}

export const useCallActions = ({ setError, setIsLoading }: UseCallActionsProps = {}) => {
    const requestCall = useCallback(async (targetUserId: string, mode: 'voice' | 'video' = 'voice') => {
        setIsLoading?.(true);
        setError?.(null);

        const response = await call.request({ target_user_id: targetUserId, mode });

        setIsLoading?.(false);

        if (response.error) {
            setError?.(response.error);
            return false;
        }

        return true;
    }, [setError, setIsLoading]);

    const respondToCall = useCallback(async (targetUserId: string, accepted: boolean, mode: 'voice' | 'video' = 'voice') => {
        setIsLoading?.(true);
        setError?.(null);

        const response = await call.respond({ target_user_id: targetUserId, accepted, mode });

        setIsLoading?.(false);

        if (response.error) {
            setError?.(response.error);
            return false;
        }

        return true;
    }, [setError, setIsLoading]);

    return {
        requestCall,
        respondToCall
    };
};
