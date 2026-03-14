'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { MediaStreamManager } from '@/lib/mediaStream';

interface MediaContextType {
    isMuted: boolean;
    isMediaReady: boolean;
    permissionDenied: boolean;
    hasPromptedForPermission: boolean;
    initMediaManager: () => Promise<boolean>;
    cleanupMedia: () => void;
    toggleMute: () => void;
    getMediaManager: () => MediaStreamManager | null;
    setPermissionDenied: (denied: boolean) => void;
    setHasPromptedForPermission: (prompted: boolean) => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export const MediaProvider = ({ children }: { children: React.ReactNode }) => {
    const [isMuted, setIsMuted] = useState(false);
    const isMutedRef = useRef(isMuted);
    const [isMediaReady, setIsMediaReady] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [hasPromptedForPermission, setHasPromptedForPermission] = useState(false);

    const mediaManagerRef = useRef<MediaStreamManager | null>(null);

    // CRITICAL: Keep hardware state in sync with UI state whenever media becomes ready
    // or the toggle is flipped. This serves as a "source of truth" synchronization.
    useEffect(() => {
        isMutedRef.current = isMuted;
        if (isMediaReady && mediaManagerRef.current) {
            mediaManagerRef.current.setAudioEnabled(!isMuted);
        }
    }, [isMuted, isMediaReady]);

    const cleanupMedia = useCallback(() => {
        mediaManagerRef.current?.cleanup();
        mediaManagerRef.current = null;
        setIsMediaReady(false);
    }, []);

    const initMediaManager = useCallback(async (): Promise<boolean> => {
        const existingStream = mediaManagerRef.current?.getStream();
        const isHealthy = existingStream && existingStream.active && existingStream.getAudioTracks().some(t => t.readyState === 'live');

        if (isHealthy) {
            // Even if healthy, ensure the mute state matches the current UI state
            mediaManagerRef.current?.setAudioEnabled(!isMutedRef.current);
            return true;
        }

        if (mediaManagerRef.current) {
            cleanupMedia();
        }

        const manager = new MediaStreamManager();
        mediaManagerRef.current = manager;
        setHasPromptedForPermission(true);

        try {
            await manager.init();

            // CRITICAL: If cleanupMedia was called while waiting for permission,
            // mediaManagerRef.current will be null.
            if (mediaManagerRef.current !== manager) {
                manager.cleanup();
                return false;
            }

            const stream = manager.getStream();
            if (!stream || stream.getAudioTracks().length === 0) {
                throw new Error('Missing audio tracks');
            }

            const handleTrackEnded = () => {
                if (mediaManagerRef.current === manager) {
                    cleanupMedia();
                    setPermissionDenied(true);
                }
            };

            stream.getAudioTracks().forEach(track => {
                track.onended = handleTrackEnded;
            });

            // Ensure our global mute state syncs with the fresh stream
            manager.setAudioEnabled(!isMutedRef.current);

            setIsMediaReady(true);
            setPermissionDenied(false);
            return true;
        } catch (err) {
            console.error('[MediaContext] Failed to initialize media:', err);
            if (mediaManagerRef.current === manager) {
                setPermissionDenied(true);
                mediaManagerRef.current = null;
            }
            return false;
        }
    }, [cleanupMedia]);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    const getMediaManager = useCallback(() => mediaManagerRef.current, []);

    return (
        <MediaContext.Provider value={{
            isMuted,
            isMediaReady,
            permissionDenied,
            hasPromptedForPermission,
            initMediaManager,
            cleanupMedia,
            toggleMute,
            getMediaManager,
            setPermissionDenied,
            setHasPromptedForPermission
        }}>
            {children}
        </MediaContext.Provider>
    );
};

export const useMedia = () => {
    const context = useContext(MediaContext);
    if (context === undefined) {
        throw new Error('useMedia must be used within a MediaProvider');
    }
    return context;
};
