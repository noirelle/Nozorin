'use client';

import { useEffect } from 'react';
import { isInAppBrowser, isFacebookApp } from '@/utils/browser';

interface UseVoiceRoomEffectsProps {
    setPermissionDenied: (denied: boolean) => void;
}

export const useVoiceRoomEffects = ({
    setPermissionDenied,
}: UseVoiceRoomEffectsProps) => {
    // Proactive Capability Check
    useEffect(() => {
        const isRestricted = isInAppBrowser();
        const hasMediaSupport = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

        // If we are in Facebook/Instagram in-app browser, we proactively assume restriction
        // especially on iOS where navigator.permissions is often missing or query fails.
        if (isRestricted && (!hasMediaSupport || isFacebookApp())) {
            setPermissionDenied(true);
        }

        // Native Permission Check
        if (navigator.permissions && typeof navigator.permissions.query === 'function') {
            navigator.permissions.query({ name: 'microphone' as PermissionName })
                .then((permissionStatus) => {
                    if (permissionStatus.state === 'denied') {
                        setPermissionDenied(true);
                    }
                    permissionStatus.onchange = () => {
                        setPermissionDenied(permissionStatus.state === 'denied');
                    };
                })
                .catch(err => {
                    // Try/catch for cases where 'microphone' is not a valid PermissionName in that environment
                });
        }
    }, [setPermissionDenied]);
};
