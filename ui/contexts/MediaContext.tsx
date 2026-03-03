'use client';

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
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
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export const MediaProvider = ({ children }: { children: React.ReactNode }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isMediaReady, setIsMediaReady] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [hasPromptedForPermission, setHasPromptedForPermission] = useState(false);

    const mediaManagerRef = useRef<MediaStreamManager | null>(null);

    const cleanupMedia = useCallback(() => {
        mediaManagerRef.current?.cleanup();
        mediaManagerRef.current = null;
        setIsMediaReady(false);
    }, []);

    const initMediaManager = useCallback(async (): Promise<boolean> => {
        const existingStream = mediaManagerRef.current?.getStream();
        const isHealthy = existingStream && existingStream.active && existingStream.getAudioTracks().some(t => t.readyState === 'live');

        if (isHealthy) return true;

        if (mediaManagerRef.current) {
            console.log('[MediaContext] Existing media stream unhealthy, re-initializing...');
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
                console.log('[MediaContext] Initialization finished, but stream was already cleaned up. Shutting down immediately.');
                manager.cleanup();
                return false;
            }

            const stream = manager.getStream();
            if (!stream || stream.getAudioTracks().length === 0) {
                throw new Error('Missing audio tracks');
            }

            const handleTrackEnded = () => {
                if (mediaManagerRef.current === manager) {
                    console.log('[MediaContext] Track ended unexpectedly');
                    cleanupMedia();
                    setPermissionDenied(true);
                }
            };

            stream.getAudioTracks().forEach(track => {
                track.onended = handleTrackEnded;
            });

            // Ensure our global mute state syncs with the fresh stream
            manager.setAudioEnabled(!isMuted);

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
    }, [cleanupMedia, isMuted]);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const newMuted = !prev;
            mediaManagerRef.current?.setAudioEnabled(!newMuted);
            return newMuted;
        });
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
            getMediaManager
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
