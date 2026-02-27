'use client';

import { useEffect } from 'react';

interface UseSessionEffectsProps {
    token: string | null;
    isChecking: boolean;
    user: any;
    verifyActiveCallSession: () => Promise<void>;
    setIsVerifyingSession: (verifying: boolean) => void;
}

export const useSessionEffects = ({
    token,
    isChecking,
    user,
    verifyActiveCallSession,
    setIsVerifyingSession,
}: UseSessionEffectsProps) => {
    useEffect(() => {
        if (isChecking) return;

        if (!token || !user) {
            setIsVerifyingSession(false);
            return;
        }

        verifyActiveCallSession();
    }, [token, isChecking, user, verifyActiveCallSession, setIsVerifyingSession]);
};
