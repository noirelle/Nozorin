/**
 * MediaStreamManager - Manages local media stream (video/audio)
 * Handles enabling/disabling tracks and cleanup
 */
export class MediaStreamManager {
    private stream: MediaStream | null = null;
    private videoRef: HTMLVideoElement | null = null;

    /**
     * Initialize media stream with user media
     */
    async init(): Promise<MediaStream | null> {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: true,
            });
            return this.stream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            return null;
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
     */
    attachToVideo(videoElement: HTMLVideoElement | null) {
        if (!videoElement) return;
        this.videoRef = videoElement;
        if (this.stream && videoElement) {
            videoElement.srcObject = this.stream;
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
     * Enable or disable video track
     */
    setVideoEnabled(enabled: boolean) {
        if (!this.stream) return;
        this.stream.getVideoTracks().forEach((track) => {
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
     * Check if video is enabled
     */
    isVideoEnabled(): boolean {
        if (!this.stream) return false;
        const videoTracks = this.stream.getVideoTracks();
        return videoTracks.length > 0 && videoTracks[0].enabled;
    }

    /**
     * Clean up all tracks and references
     */
    cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
            this.stream = null;
        }
        if (this.videoRef) {
            this.videoRef.srcObject = null;
            this.videoRef = null;
        }
    }
}
