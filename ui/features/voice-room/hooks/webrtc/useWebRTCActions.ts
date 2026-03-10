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
        if (!stream) {
            console.error('[WebRTC] createPeerConnection: no local stream available — mic may not be ready');
            return null;
        }

        console.log('[WebRTC] Creating RTCPeerConnection for target:', targetId);
        const pc = new RTCPeerConnection(ICE_CONFIG);
        peerConnectionRef.current = pc;

        const tracks = stream.getTracks();
        console.log(`[WebRTC] Adding ${tracks.length} local track(s) to peer connection:`, tracks.map(t => `${t.kind}(${t.label})`));
        tracks.forEach(track => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
            console.log('[WebRTC] ✅ Remote track received:', event.track.kind, '| streams:', event.streams.length);
            const remoteStream = event.streams[0];
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = remoteStream;
                // Force play to overcome iOS/Safari strict auto-play blocks on dynamic connection
                remoteAudioRef.current.play()
                    .then(() => console.log('[WebRTC] Remote audio element playing successfully'))
                    .catch(e => console.warn('[WebRTC] Autoplay blocked or failed to play incoming stream:', e));
            } else {
                console.warn('[WebRTC] ontrack fired but remoteAudioRef is null — audio element not mounted yet');
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('[WebRTC] Local ICE candidate generated, emitting to', targetId, '| type:', event.candidate.type);
                emitIceCandidate(targetId, event.candidate);
            } else {
                console.log('[WebRTC] ICE gathering complete (null candidate)');
            }
        };

        pc.onicegatheringstatechange = () => {
            console.log('[WebRTC] ICE gathering state:', pc.iceGatheringState);
        };

        pc.oniceconnectionstatechange = () => {
            console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);
        };

        pc.onconnectionstatechange = () => {
            const state = pc.connectionState;
            console.log('[WebRTC] 🔗 Connection state changed:', state);
            if (state === 'disconnected') onSignalQuality?.('reconnecting');
            else if (state === 'connected') onSignalQuality?.('good');
            if (state === 'failed' || state === 'closed') onConnectionStateChange?.(state);
            if (state === 'disconnected') onConnectionStateChange?.(state);
        };

        return pc;
    }, [mediaManager, remoteAudioRef, onConnectionStateChange, onSignalQuality, peerConnectionRef, ICE_CONFIG]);

    const processQueuedIceCandidates = useCallback(async (pc: RTCPeerConnection) => {
        const queued = pendingIceCandidatesRef.current.length;
        if (!pc.remoteDescription || queued === 0) {
            console.log(`[WebRTC] processQueuedIceCandidates: skipping (remoteDescription=${!!pc.remoteDescription}, queued=${queued})`);
            return;
        }
        console.log(`[WebRTC] Draining ${queued} queued ICE candidate(s) now that remoteDescription is set`);
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

    const createOffer = useCallback(async (partnerId: string) => {
        console.log('[WebRTC] 📤 createOffer: initiating for partner', partnerId);
        const pc = createPeerConnection(partnerId);
        if (!pc) {
            console.error('[WebRTC] createOffer: peer connection could not be created — aborting');
            return;
        }
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log('[WebRTC] Offer created and set as local description, emitting to', partnerId);
        emitOffer(partnerId, offer);
    }, [createPeerConnection]);

    const handleOffer = useCallback(async (sdp: RTCSessionDescriptionInit, callerId: string) => {
        console.log('[WebRTC] 📥 handleOffer: received from', callerId, '| is_media_ready:', is_media_ready);
        if (!is_media_ready) {
            console.log('[WebRTC] Media not ready — queuing offer from', callerId);
            pendingOfferRef.current = { sdp, callerId };
            return;
        }

        if (!peerConnectionRef.current) {
            console.log('[WebRTC] No existing peer connection, creating one for', callerId);
            createPeerConnection(callerId);
        }
        const pc = peerConnectionRef.current;
        if (!pc) {
            console.error('[WebRTC] handleOffer: peer connection is null after createPeerConnection — aborting');
            return;
        }

        try {
            console.log('[WebRTC] Setting remote description from offer...');
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            console.log('[WebRTC] Remote description set ✅ — processing queued ICE candidates...');
            await processQueuedIceCandidates(pc);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            console.log('[WebRTC] 📤 Answer created and set as local description, emitting to', callerId);
            emitAnswer(callerId, answer);
        } catch (e) {
            console.error('[WebRTC] Error handling offer:', e);
        }
    }, [createPeerConnection, peerConnectionRef, is_media_ready, pendingOfferRef, processQueuedIceCandidates]);

    const handleAnswer = useCallback(async (sdp: RTCSessionDescriptionInit) => {
        console.log('[WebRTC] 📥 handleAnswer: received | is_media_ready:', is_media_ready);
        if (!is_media_ready) {
            console.log('[WebRTC] Media not ready — queuing answer');
            pendingAnswerRef.current = sdp;
            return;
        }

        const pc = peerConnectionRef.current;
        if (!pc) {
            console.error('[WebRTC] handleAnswer: no peer connection exists — cannot apply answer');
            return;
        }
        try {
            console.log('[WebRTC] Setting remote description from answer...');
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            console.log('[WebRTC] Remote description (answer) set ✅ — processing queued ICE candidates...');
            await processQueuedIceCandidates(pc);
        } catch (e) {
            console.error('[WebRTC] Error handling answer:', e);
        }
    }, [peerConnectionRef, is_media_ready, pendingAnswerRef, processQueuedIceCandidates]);

    const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
        const pc = peerConnectionRef.current;
        const hasRemoteDesc = !!pc?.remoteDescription;
        if (!is_media_ready || !hasRemoteDesc) {
            console.log(`[WebRTC] ICE candidate queued (media_ready=${is_media_ready}, hasRemoteDesc=${hasRemoteDesc}, total_queued=${pendingIceCandidatesRef.current.length + 1})`);
            pendingIceCandidatesRef.current.push(candidate);
            return;
        }

        if (pc) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('[WebRTC] ICE candidate applied immediately ✅');
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
