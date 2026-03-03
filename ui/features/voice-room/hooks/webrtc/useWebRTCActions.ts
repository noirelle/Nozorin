import { useCallback, useEffect, MutableRefObject, RefObject } from 'react';
import { MediaStreamManager } from '../../../../lib/mediaStream';
import {
    emitOffer,
    emitAnswer,
    emitIceCandidate,
} from '../../../../lib/socket/matching/matching.actions';
import { UseWebRTCStateReturn } from './useWebRTCState';

interface UseWebRTCActionsProps extends UseWebRTCStateReturn {
    is_media_ready: boolean;
    mediaManager: MutableRefObject<MediaStreamManager | null>;
    remoteAudioRef: RefObject<HTMLAudioElement | null>;
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
    onSignalQuality?: (quality: 'good' | 'fair' | 'poor' | 'reconnecting') => void;
}

export const useWebRTCActions = ({
    is_media_ready,
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
    const createPeerConnection = useCallback((targetId: string) => {
        const stream = mediaManager.current?.getStream();
        if (!stream) return null;

        const pc = new RTCPeerConnection(ICE_CONFIG);
        peerConnectionRef.current = pc;

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
            const remoteStream = event.streams[0];
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = remoteStream;
                // Force play to overcome iOS/Safari strict auto-play blocks on dynamic connection
                remoteAudioRef.current.play().catch(e => {
                    console.warn('[WebRTC] Autoplay blocked or failed to play incoming stream:', e);
                });
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) emitIceCandidate(targetId, event.candidate);
        };

        pc.onconnectionstatechange = () => {
            const state = pc.connectionState;
            if (state === 'disconnected') onSignalQuality?.('reconnecting');
            else if (state === 'connected') onSignalQuality?.('good');
            if (state === 'failed' || state === 'closed') onConnectionStateChange?.(state);
            if (state === 'disconnected') onConnectionStateChange?.(state);
        };

        return pc;
    }, [mediaManager, remoteAudioRef, onConnectionStateChange, onSignalQuality, peerConnectionRef, ICE_CONFIG]);

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

    const createOffer = useCallback(async (partnerId: string) => {
        const pc = createPeerConnection(partnerId);
        if (!pc) return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        emitOffer(partnerId, offer);
    }, [createPeerConnection]);

    const handleOffer = useCallback(async (sdp: RTCSessionDescriptionInit, callerId: string) => {
        if (!is_media_ready) {
            console.log('[WebRTC] Media not ready, queuing offer from', callerId);
            pendingOfferRef.current = { sdp, callerId };
            return;
        }

        if (!peerConnectionRef.current) createPeerConnection(callerId);
        const pc = peerConnectionRef.current;
        if (!pc) return;

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            emitAnswer(callerId, answer);
        } catch (e) {
            console.error('[WebRTC] Error handling offer:', e);
        }
    }, [createPeerConnection, peerConnectionRef, is_media_ready, pendingOfferRef]);

    const handleAnswer = useCallback(async (sdp: RTCSessionDescriptionInit) => {
        if (!is_media_ready) {
            console.log('[WebRTC] Media not ready, queuing answer');
            pendingAnswerRef.current = sdp;
            return;
        }

        const pc = peerConnectionRef.current;
        if (pc) {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            } catch (e) {
                console.error('[WebRTC] Error handling answer:', e);
            }
        }
    }, [peerConnectionRef, is_media_ready, pendingAnswerRef]);

    const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
        if (!is_media_ready) {
            pendingIceCandidatesRef.current.push(candidate);
            return;
        }

        const pc = peerConnectionRef.current;
        if (pc) {
            try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
            catch (e) { console.error('Error adding received ice candidate', e); }
        }
    }, [peerConnectionRef, is_media_ready, pendingIceCandidatesRef]);

    useEffect(() => {
        if (!is_media_ready) return;

        const processQueues = async () => {
            // 1. Process Offer
            if (pendingOfferRef.current) {
                console.log('[WebRTC] Processing queued offer:', pendingOfferRef.current);
                const { sdp, callerId } = pendingOfferRef.current;
                pendingOfferRef.current = null;
                await handleOffer(sdp, callerId);
            }

            // 2. Process Answer
            if (pendingAnswerRef.current) {
                console.log('[WebRTC] Processing queued answer:', pendingAnswerRef.current);
                const sdp = pendingAnswerRef.current;
                pendingAnswerRef.current = null;
                await handleAnswer(sdp);
            }

            // 3. Process ICE Candidates
            if (pendingIceCandidatesRef.current.length > 0) {
                console.log(`[WebRTC] Processing ${pendingIceCandidatesRef.current.length} queued ICE candidates`);
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
