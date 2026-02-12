import { useState, useRef, useCallback } from 'react';
import { MediaStreamManager } from '../../../lib/mediaStream';

export interface CallRoomState {
    isSearching: boolean;
    isConnected: boolean;
    partnerCountry: string;
    partnerCountryCode: string;
    partnerId: string | null;
    isMuted: boolean;
    isMediaReady: boolean;
    permissionDenied: boolean;
    partnerSignalStrength: 'good' | 'fair' | 'poor' | 'reconnecting';
}

export const useCallRoom = (mode: 'voice') => {
    const [state, setState] = useState<CallRoomState>({
        isSearching: false,
        isConnected: false,
        partnerCountry: '',
        partnerCountryCode: '',
        partnerId: null,
        isMuted: false,
        isMediaReady: false,
        permissionDenied: false,
        partnerSignalStrength: 'good',
    });

    const mediaManager = useRef<MediaStreamManager | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    // Initialize media manager
    const initMediaManager = useCallback(async () => {
        if (!mediaManager.current) {
            const manager = new MediaStreamManager();
            mediaManager.current = manager;

            try {
                await manager.init();

                // Validate tracks exist
                const stream = manager.getStream();
                if (!stream || stream.getAudioTracks().length === 0) {
                    throw new Error("Missing audio tracks");
                }

                // Monitor for external track stopping (e.g. permission revocation, device unplugged)
                const handleTrackEnded = () => {
                    if (mediaManager.current === manager) {
                        console.log("Track ended unexpectedly");
                        cleanupMedia();
                        setState((prev) => ({ ...prev, permissionDenied: true, isMediaReady: false }));
                    }
                };


                stream.getAudioTracks().forEach(track => {
                    track.onended = handleTrackEnded;
                });

                // Check if component is still mounted/same manager is active (StrictMode/Race condition fix)
                if (mediaManager.current === manager) {
                    // Respect initial state
                    // manager.setVideoEnabled(false); // No video
                    setState((prev) => ({ ...prev, isMediaReady: true, permissionDenied: false }));
                }
            } catch (err) {
                console.error("Failed to initialize media:", err);
                if (mediaManager.current === manager) {
                    setState((prev) => ({ ...prev, permissionDenied: true }));
                    // Reset manager so we can try again
                    mediaManager.current = null;
                }
            }
        }
    }, [mode]);

    // Clean up media resources
    const cleanupMedia = useCallback(() => {
        mediaManager.current?.cleanup();
        mediaManager.current = null;
        setState((prev) => ({ ...prev, isMediaReady: false }));
    }, []);

    // Toggle mute
    const toggleMute = useCallback(() => {
        setState((prev) => {
            const newMuted = !prev.isMuted;
            mediaManager.current?.setAudioEnabled(!newMuted);
            return { ...prev, isMuted: newMuted };
        });
    }, []);



    // Update connection state
    const setSearching = useCallback((searching: boolean) => {
        setState((prev) => ({ ...prev, isSearching: searching }));
    }, []);

    const setConnected = useCallback((connected: boolean) => {
        setState((prev) => ({ ...prev, isConnected: connected }));
    }, []);

    const setPartner = useCallback((
        partnerId: string | null,
        country?: string,
        countryCode?: string
    ) => {
        setState((prev) => ({
            ...prev,
            partnerId,
            partnerCountry: country || '',
            partnerCountryCode: countryCode || '',
        }));
    }, []);

    const setPartnerSignalStrength = useCallback((strength: 'good' | 'fair' | 'poor' | 'reconnecting') => {
        setState((prev) => ({ ...prev, partnerSignalStrength: strength }));
    }, []);

    const resetState = useCallback(() => {
        setState((prev) => ({
            isSearching: false,
            isConnected: false,
            partnerCountry: '',
            partnerCountryCode: '',
            partnerId: null,
            isMuted: prev.isMuted,
            isMediaReady: prev.isMediaReady,
            permissionDenied: prev.permissionDenied,
            partnerSignalStrength: 'good',
        }));
    }, []);

    return {
        state,
        mediaManager,
        peerConnectionRef,
        initMediaManager,
        cleanupMedia,
        toggleMute,
        setSearching,
        setConnected,
        setPartner,
        setPartnerSignalStrength,
        resetState,
    };
};
