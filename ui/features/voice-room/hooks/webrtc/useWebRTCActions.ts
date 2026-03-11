import { useCallback, useEffect, useRef, MutableRefObject, RefObject } from 'react';
import { MediaStreamManager } from '../../../../lib/mediaStream';
import {
    emitOffer,
    emitAnswer,
    emitIceCandidate,
} from '../../../../lib/socket/matching/matching.actions';
import { UseWebRTCStateReturn } from './useWebRTCState';

interface UseWebRTCActionsProps extends UseWebRTCStateReturn {
    is_media_ready: boolean;
    role?: 'offerer' | 'answerer' | null;
    mediaManager: MutableRefObject<MediaStreamManager | null>;
    remoteAudioRef: RefObject<HTMLAudioElement | null>;
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
    onSignalQuality?: (quality: 'good' | 'fair' | 'poor' | 'reconnecting') => void;
}

export const useWebRTCActions = ({
    is_media_ready,
    role,
    peerConnectionRef,
    ICE_CONFIG,
    pendingOfferRef,
    pendingAnswerRef,
    pendingIceCandidatesRef,
    mediaManager,
    remoteAudioRef,
    onConnectionStateChange,
    onSignalQuality,
}: UseWebRTCActionsProps) => {
    const createOfferRef = useRef<((partnerId: string, options?: RTCOfferOptions) => Promise<void>) | null>(null);
    const lastIceRestartRef = useRef<number>(0);

    const createPeerConnection = useCallback((targetId: string) => {
        const stream = mediaManager.current?.getStream();
        if (!stream) {
            console.error('[WebRTC] createPeerConnection: no local stream available — mic may not be ready');
            return null;
        }

        const pc = new RTCPeerConnection(ICE_CONFIG);
        peerConnectionRef.current = pc;

        const tracks = stream.getTracks();
        tracks.forEach(track => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
            const remoteStream = event.streams[0];
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = remoteStream;
                // Force play to overcome iOS/Safari strict auto-play blocks on dynamic connection
                remoteAudioRef.current.play()
                    .catch(e => console.warn('[WebRTC] Autoplay blocked or failed to play incoming stream:', e));
            } else {
                console.warn('[WebRTC] ontrack fired but remoteAudioRef is null — audio element not mounted yet');
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                emitIceCandidate(targetId, event.candidate);
            }
        };

        pc.onicegatheringstatechange = () => {
        };

        pc.oniceconnectionstatechange = () => {
        };

        pc.onconnectionstatechange = () => {
            const state = pc.connectionState;
            if (state === 'disconnected') {
                onSignalQuality?.('reconnecting');
                // Polite Peer mechanism: only the offerer triggers ICE restarts to prevent glaring.
                if (role === 'offerer') {
                    const partnerId = targetId;
                    const now = Date.now();
                    // Throttle ICE restarts to once every 5 seconds max
                    if (partnerId && (now - lastIceRestartRef.current) > 5000) {
                        lastIceRestartRef.current = now;
                        createOfferRef.current?.(partnerId, { iceRestart: true });
                    }
                }
            }
            else if (state === 'connected') onSignalQuality?.('good');
            if (state === 'failed' || state === 'closed') onConnectionStateChange?.(state);
            if (state === 'disconnected') onConnectionStateChange?.(state);
        };

        return pc;
    }, [mediaManager, remoteAudioRef, onConnectionStateChange, onSignalQuality, peerConnectionRef, ICE_CONFIG, role]);

    const processQueuedIceCandidates = useCallback(async (pc: RTCPeerConnection) => {
        const queued = pendingIceCandidatesRef.current.length;
        if (!pc.remoteDescription || queued === 0) {
            return;
        }
        const candidates = [...pendingIceCandidatesRef.current];
        pendingIceCandidatesRef.current = [];
        for (const candidate of candidates) {
            try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
            catch (e) { console.error('[WebRTC] Error adding queued ICE candidate:', e); }
        }
    }, [pendingIceCandidatesRef]);

    const closePeerConnection = useCallback(() => {
        if (peerConnectionRef.current) {
            // Actively stop sender tracks on the RTCPeerConnection to force immediate hardware release
            peerConnectionRef.current.getSenders().forEach(sender => {
                if (sender.track) {
                    sender.track.stop();
                }
            });
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    }, [peerConnectionRef, remoteAudioRef]);

    const createOffer = useCallback(async (partnerId: string, options?: RTCOfferOptions) => {
        const pc = peerConnectionRef.current || createPeerConnection(partnerId);
        if (!pc) {
            console.error('[WebRTC] createOffer: peer connection could not be created — aborting');
            return;
        }
        const offer = await pc.createOffer(options);
        await pc.setLocalDescription(offer);
        emitOffer(partnerId, offer);
    }, [createPeerConnection, peerConnectionRef]);

    useEffect(() => {
        createOfferRef.current = createOffer;
    }, [createOffer]);

    const handleOffer = useCallback(async (sdp: RTCSessionDescriptionInit, callerId: string) => {
        if (!is_media_ready) {
            pendingOfferRef.current = { sdp, callerId };
            return;
        }

        if (!peerConnectionRef.current) {
            createPeerConnection(callerId);
        }
        const pc = peerConnectionRef.current;
        if (!pc) {
            console.error('[WebRTC] handleOffer: peer connection is null after createPeerConnection — aborting');
            return;
        }

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            await processQueuedIceCandidates(pc);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            emitAnswer(callerId, answer);
        } catch (e) {
            console.error('[WebRTC] Error handling offer:', e);
        }
    }, [createPeerConnection, peerConnectionRef, is_media_ready, pendingOfferRef, processQueuedIceCandidates]);

    const handleAnswer = useCallback(async (sdp: RTCSessionDescriptionInit) => {
        if (!is_media_ready) {
            pendingAnswerRef.current = sdp;
            return;
        }

        const pc = peerConnectionRef.current;
        if (!pc) {
            console.error('[WebRTC] handleAnswer: no peer connection exists — cannot apply answer');
            return;
        }
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            await processQueuedIceCandidates(pc);
        } catch (e) {
            console.error('[WebRTC] Error handling answer:', e);
        }
    }, [peerConnectionRef, is_media_ready, pendingAnswerRef, processQueuedIceCandidates]);

    const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
        const pc = peerConnectionRef.current;
        const hasRemoteDesc = !!pc?.remoteDescription;
        if (!is_media_ready || !hasRemoteDesc) {
            pendingIceCandidatesRef.current.push(candidate);
            return;
        }

        if (pc) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error('[WebRTC] Error adding received ice candidate:', e);
            }
        }
    }, [peerConnectionRef, is_media_ready, pendingIceCandidatesRef]);

    useEffect(() => {
        if (!is_media_ready) return;

        const processQueues = async () => {
            // 1. Process Offer
            if (pendingOfferRef.current) {
                const { sdp, callerId } = pendingOfferRef.current;
                pendingOfferRef.current = null;
                await handleOffer(sdp, callerId);
            }

            // 2. Process Answer
            if (pendingAnswerRef.current) {
                const sdp = pendingAnswerRef.current;
                pendingAnswerRef.current = null;
                await handleAnswer(sdp);
            }

            // 3. Process ICE Candidates
            if (pendingIceCandidatesRef.current.length > 0) {
                const candidates = [...pendingIceCandidatesRef.current];
                pendingIceCandidatesRef.current = [];
                for (const candidate of candidates) {
                    await handleIceCandidate(candidate);
                }
            }
        };

        processQueues();
    }, [is_media_ready, handleOffer, handleAnswer, handleIceCandidate, pendingOfferRef, pendingAnswerRef, pendingIceCandidatesRef]);

    return {
        createPeerConnection,
        closePeerConnection,
        createOffer,
        handleOffer,
        handleAnswer,
        handleIceCandidate,
    };
};
