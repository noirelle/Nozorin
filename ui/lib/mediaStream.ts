/**
 * MediaStreamManager - Manages local media stream (video/audio)
 * Handles enabling/disabling tracks and cleanup
 */
export class MediaStreamManager {
    private stream: MediaStream | null = null;

    /**
     * Initialize media stream with user media
     */
    async init(): Promise<MediaStream | null> {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: true,
            });
            return this.stream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            throw error; // Rethrow so caller can handle UI
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
            this.stream.getTracks().forEach((track) => track.stop());
            this.stream = null;
        }
    }
}
