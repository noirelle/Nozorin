import { useState, useRef, useCallback } from 'react';
import { MediaStreamManager } from '../../../lib/mediaStream';

export interface VideoRoomState {
    isSearching: boolean;
    isConnected: boolean;
    partnerCountry: string;
    partnerCountryCode: string;
    partnerId: string | null;
    isMuted: boolean;
    isCameraOff: boolean;
    isMediaReady: boolean;
}

export const useVideoRoom = (mode: 'chat' | 'video') => {
    const [state, setState] = useState<VideoRoomState>({
        isSearching: false,
        isConnected: false,
        partnerCountry: '',
        partnerCountryCode: '',
        partnerId: null,
        isMuted: false,
        isCameraOff: false,
        isMediaReady: false,
    });

    const mediaManager = useRef<MediaStreamManager | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    // Initialize media manager
    const initMediaManager = useCallback(async () => {
        if (mode === 'video' && !mediaManager.current) {
            const manager = new MediaStreamManager();
            mediaManager.current = manager;
            await manager.init();

            // Check if component is still mounted/same manager is active (StrictMode/Race condition fix)
            if (mediaManager.current === manager) {
                setState((prev) => ({ ...prev, isMediaReady: true }));
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

    // Toggle camera
    const toggleCamera = useCallback(() => {
        setState((prev) => {
            const newCameraOff = !prev.isCameraOff;
            mediaManager.current?.setVideoEnabled(!newCameraOff);
            return { ...prev, isCameraOff: newCameraOff };
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

    const resetState = useCallback(() => {
        setState((prev) => ({
            isSearching: false,
            isConnected: false,
            partnerCountry: '',
            partnerCountryCode: '',
            partnerId: null,
            isMuted: prev.isMuted,
            isCameraOff: prev.isCameraOff,
            isMediaReady: prev.isMediaReady,
        }));
    }, []);

    return {
        state,
        mediaManager,
        peerConnectionRef,
        initMediaManager,
        cleanupMedia,
        toggleMute,
        toggleCamera,
        setSearching,
        setConnected,
        setPartner,
        resetState,
    };
};
