'use client';

import { useEffect, useRef } from 'react';

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
    const hasStartedRef = useRef(false);
    const lastUserIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (isChecking) return;

        if (!token || !user) {
            setIsVerifyingSession(false);
            hasStartedRef.current = false;
            lastUserIdRef.current = null;
            return;
        }

        // Allow re-trigger if user identity actually changes (e.g. login/logout)
        if (lastUserIdRef.current !== user.id) {
            hasStartedRef.current = false;
            lastUserIdRef.current = user.id;
        }

        if (hasStartedRef.current) return;

        hasStartedRef.current = true;
        verifyActiveCallSession();
    }, [token, isChecking, user, verifyActiveCallSession, setIsVerifyingSession]);
};
