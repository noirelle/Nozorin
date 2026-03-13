'use client';

import { useEffect } from 'react';

interface UseVoiceRoomEffectsProps {
    setPermissionDenied: (denied: boolean) => void;
}

export const useVoiceRoomEffects = ({
    setPermissionDenied,
}: UseVoiceRoomEffectsProps) => {
    // Native Permission Check
    useEffect(() => {
        if (!navigator.permissions) return;
        navigator.permissions.query({ name: 'microphone' as PermissionName })
            .then((permissionStatus) => {
                setPermissionDenied(permissionStatus.state === 'denied');
                permissionStatus.onchange = () => {
                    setPermissionDenied(permissionStatus.state === 'denied');
                };
            })
            .catch(err => console.warn('[useVoiceRoom] Failed to query native mic permission:', err));
    }, [setPermissionDenied]);
};
