/**
 * MediaStreamManager - Manages local media stream (video/audio)
 * Handles enabling/disabling tracks and cleanup
 */
export class MediaStreamManager {
    private stream: MediaStream | null = null;

    /**
     * Initialize media stream with user media.
     * Includes proactive checks for existing tracks and device availability.
     */
    async init(): Promise<MediaStream | null> {
        try {
            // 1. Enumerate devices to verify microphone presence and status
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasMic = devices.some(device => device.kind === 'audioinput');
            
            if (!hasMic) {
                console.error('[MediaStreamManager] No audio output devices (microphones) found.');
                throw new Error('NO_MIC_FOUND');
            }

            // 2. Clean up any existing state before requesting a new stream
            // This ensures a "clean slate" and avoids 'Already in use' errors on some platforms
            if (this.stream) {
                this.cleanup();
            }

            // 3. Request new stream
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
            });
            return this.stream;
        } catch (error: any) {
            console.error('[MediaStreamManager] Error accessing media devices:', error);
            
            // Map common WebRTC errors to descriptive ones for the UI
            if (error.name === 'NotAllowedError') {
                throw new Error('PERMISSION_DENIED');
            } else if (error.name === 'NotFoundError' || error.message === 'NO_MIC_FOUND') {
                throw new Error('DEVICE_NOT_FOUND');
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                // This usually happens when another application/tab is using the mic and won't share it
                throw new Error('DEVICE_IN_USE');
            }
            
            throw error;
        }
    }

    /**
     * Get the current media stream
     */
    getStream(): MediaStream | null {
        return this.stream;
    }

    /**
     * Attach stream to a video element
     * Although this is audio-only, we might still attach to an audio element or dummy video element for WebRTC
     */
    attachToElement(element: HTMLVideoElement | HTMLAudioElement | null) {
        if (!element) return;
        // logic remains similar, srcObject works for audio too
        if (this.stream) {
            element.srcObject = this.stream;
        }
    }

    /**
     * Enable or disable audio track
     */
    setAudioEnabled(enabled: boolean) {
        if (!this.stream) return;
        this.stream.getAudioTracks().forEach((track) => {
            track.enabled = enabled;
        });
    }

    /**
     * Check if audio is enabled
     */
    isAudioEnabled(): boolean {
        if (!this.stream) return false;
        const audioTracks = this.stream.getAudioTracks();
        return audioTracks.length > 0 && audioTracks[0].enabled;
    }

    /**
     * Clean up all tracks and references
     */
    cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach((track) => {
                // Setting enabled to false before stop() tells Chrome to instantly
                // drop the hardware recording indicator UI
                track.enabled = false;
                track.stop();
            });
            this.stream = null;
        }
    }
}
