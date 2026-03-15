import { useCallback, useEffect, useRef, MutableRefObject, RefObject, Dispatch, SetStateAction } from 'react';
import { MediaStreamManager } from '../../../../lib/mediaStream';
import {
    emitOffer,
    emitAnswer,
    emitIceCandidate,
} from '../../../../lib/socket/matching/matching.actions';
import { UseWebRTCStateReturn, IceDebugData } from './useWebRTCState';

interface UseWebRTCActionsProps extends UseWebRTCStateReturn {
    is_media_ready: boolean;
    role?: 'offerer' | 'answerer' | null;
    mediaManager: MutableRefObject<MediaStreamManager | null>;
    remoteAudioRef: RefObject<HTMLAudioElement | null>;
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
    onSignalQuality?: (quality: 'good' | 'fair' | 'poor' | 'reconnecting') => void;
    setIceDebugData: Dispatch<SetStateAction<IceDebugData>>;
}

export const useWebRTCActions = ({
    is_media_ready,
    role,
    peerConnectionRef,
    ICE_CONFIG,
    pendingOfferRef,
    pendingCreateOfferRef,
    pendingAnswerRef,
    pendingIceCandidatesRef,
    mediaManager,
    remoteAudioRef,
    onConnectionStateChange,
    onSignalQuality,
    iceDebugData,
    setIceDebugData,
}: UseWebRTCActionsProps) => {


    const createOfferRef = useRef<((partnerId: string, options?: RTCOfferOptions) => Promise<void>) | null>(null);
    const lastIceRestartRef = useRef<number>(0);

    const createPeerConnection = useCallback((targetId: string) => {
        const stream = mediaManager.current?.getStream();
        if (!stream) {
            return null;
        }

        const pc = new RTCPeerConnection(ICE_CONFIG);
        peerConnectionRef.current = pc;

        // Debugging: track state changes
        setIceDebugData(prev => ({ ...prev, isConfigured: true }));
        const updateDebugState = () => {
            setIceDebugData(prev => ({
                ...prev,
                iceConnectionState: pc.iceConnectionState,
                iceGatheringState: pc.iceGatheringState,
                connectionState: pc.connectionState,
                signalingState: pc.signalingState,
            }));
        };

        pc.oniceconnectionstatechange = updateDebugState;
        pc.onicegatheringstatechange = updateDebugState;
        pc.onicecandidateerror = (event: any) => {
            setIceDebugData(prev => ({
                ...prev,
                iceCandidateError: `${event.errorCode}: ${event.errorText} (${event.url})`
            }));
        };
        pc.onconnectionstatechange = () => {

            updateDebugState();
            const state = pc.connectionState;

            if (state === 'disconnected') {
                onSignalQuality?.('reconnecting');
                if (role === 'offerer') {
                    const now = Date.now();
                    if ((now - lastIceRestartRef.current) > 5000) {
                        lastIceRestartRef.current = now;
                        createOfferRef.current?.(targetId, { iceRestart: true });
                    }
                }
            }
            else if (state === 'connected') {
                onSignalQuality?.('good');
            }
            else if (state === 'failed') {
            }

            // Always notify about state changes so the UI can coordinate transitions
            onConnectionStateChange?.(state);
        };
        pc.onsignalingstatechange = updateDebugState;

        const tracks = stream.getTracks();
        const isAudioEnabled = mediaManager.current?.isAudioEnabled() ?? true;

        tracks.forEach(track => {
            if (track.kind === 'audio') {
                track.enabled = isAudioEnabled;
            }
            pc.addTrack(track, stream);
        });

        pc.ontrack = (event) => {
            const remoteStream = event.streams[0];

            if (remoteAudioRef.current) {
                // Ensure the stream is attached
                if (remoteAudioRef.current.srcObject !== remoteStream) {
                    remoteAudioRef.current.srcObject = remoteStream;
                }

                // Attempt to play. 
                // We DON'T catch and mute here for audio-only, because a muted stream 
                // is useless for a voice chat and just confuses the user.
                remoteAudioRef.current.play().catch(_e => {
                });
            } else {
                const checkRef = setInterval(() => {
                    if (remoteAudioRef.current) {
                        remoteAudioRef.current.srcObject = remoteStream;
                        remoteAudioRef.current.play().catch(() => { });
                        clearInterval(checkRef);
                    }
                }, 200);
                setTimeout(() => clearInterval(checkRef), 3000);
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                setIceDebugData(prev => ({
                    ...prev,
                    localCandidates: [...prev.localCandidates, event.candidate!]
                }));
                emitIceCandidate(targetId, event.candidate);
            }
        };

        return pc;
    }, [mediaManager, remoteAudioRef, onConnectionStateChange, onSignalQuality, peerConnectionRef, ICE_CONFIG, role, setIceDebugData]);


    const processQueuedIceCandidates = useCallback(async (pc: RTCPeerConnection) => {
        const queued = pendingIceCandidatesRef.current.length;
        if (!pc.remoteDescription || queued === 0) {
            return;
        }
        const candidates = [...pendingIceCandidatesRef.current];
        pendingIceCandidatesRef.current = [];
        for (const candidate of candidates) {
            try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
            catch (_e) { }
        }
    }, [pendingIceCandidatesRef]);

    const closePeerConnection = useCallback(() => {
        if (peerConnectionRef.current) {
            // CRITICAL: We DO NOT stop sender tracks here. 
            // sender.track.stop() kills the microphone hardware, meaning the user 
            // loses audio for ALL subsequent sessions until a page refresh.
            // cleanupMedia() should be used when the hardware needs to be released.
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    }, [peerConnectionRef, remoteAudioRef]);

    const createOffer = useCallback(async (partnerId: string, options?: RTCOfferOptions) => {
        if (!is_media_ready) {
            pendingCreateOfferRef.current = { partnerId, options };
            return;
        }

        const pc = peerConnectionRef.current || createPeerConnection(partnerId);
        if (!pc) {
            return;
        }
        const offer = await pc.createOffer(options);
        await pc.setLocalDescription(offer);
        emitOffer(partnerId, offer);
    }, [createPeerConnection, peerConnectionRef, is_media_ready, pendingCreateOfferRef]);

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
            return;
        }

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            await processQueuedIceCandidates(pc);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            emitAnswer(callerId, answer);
        } catch (_e) {
        }
    }, [createPeerConnection, peerConnectionRef, is_media_ready, pendingOfferRef, processQueuedIceCandidates]);

    const handleAnswer = useCallback(async (sdp: RTCSessionDescriptionInit) => {
        if (!is_media_ready) {
            pendingAnswerRef.current = sdp;
            return;
        }

        const pc = peerConnectionRef.current;
        if (!pc) {
            return;
        }
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            await processQueuedIceCandidates(pc);
        } catch (_e) {
        }
    }, [peerConnectionRef, is_media_ready, pendingAnswerRef, processQueuedIceCandidates]);

    const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
        const pc = peerConnectionRef.current;

        // Candidates MUST NOT be added before remote description is set
        if (!pc || !pc.remoteDescription || pc.signalingState === 'closed') {
            pendingIceCandidatesRef.current.push(candidate);
            return;
        }

        try {
            const iceCandidate = new RTCIceCandidate(candidate);
            setIceDebugData(prev => ({
                ...prev,
                remoteCandidates: [...prev.remoteCandidates, iceCandidate]
            }));
            await pc.addIceCandidate(iceCandidate);
        } catch (_e) {
        }
    }, [peerConnectionRef, pendingIceCandidatesRef, setIceDebugData]);


    useEffect(() => {
        if (!is_media_ready) return;

        const processQueues = async () => {
            // Processing should be sequential to avoid race conditions

            // 1. Process Pending Outgoing Offer
            if (pendingCreateOfferRef.current) {
                const { partnerId, options } = pendingCreateOfferRef.current;
                pendingCreateOfferRef.current = null;
                await createOffer(partnerId, options);
            }

            // 2. Process Incoming Offer
            if (pendingOfferRef.current) {
                const { sdp, callerId } = pendingOfferRef.current;
                pendingOfferRef.current = null;
                await handleOffer(sdp, callerId);
            }

            // 3. Process Answer
            if (pendingAnswerRef.current) {
                const sdp = pendingAnswerRef.current;
                pendingAnswerRef.current = null;
                await handleAnswer(sdp);
            }

            // 4. Process ICE Candidates
            const pc = peerConnectionRef.current;
            if (pc && pc.remoteDescription && pendingIceCandidatesRef.current.length > 0) {
                await processQueuedIceCandidates(pc);
            }
        };

        processQueues();
    }, [is_media_ready, createOffer, handleOffer, handleAnswer, processQueuedIceCandidates, pendingCreateOfferRef, pendingOfferRef, pendingAnswerRef, pendingIceCandidatesRef, peerConnectionRef]);

    return {
        createPeerConnection,
        closePeerConnection,
        createOffer,
        handleOffer,
        handleAnswer,
        handleIceCandidate,
    };
};
