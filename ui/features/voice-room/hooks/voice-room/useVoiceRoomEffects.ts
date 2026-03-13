'use client';

import { useEffect } from 'react';
import { isInAppBrowser } from '@/utils/browser';

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

        if (isRestricted && !hasMediaSupport) {
            setPermissionDenied(true);
        }

        // Native Permission Check
        if (!navigator.permissions) return;
        
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
                // If it fails, we don't necessarily set it to denied, as some browsers don't support querying 'microphone'
            });
    }, [setPermissionDenied]);
};
