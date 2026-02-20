import { useCallback, useRef, useEffect } from 'react';
import { MediaStreamManager } from '../../../lib/mediaStream';
import { useSocketEvent } from '../../../lib/socket';
import { SocketEvents } from '../../../lib/socket';
import {
    emitOffer,
    emitAnswer,
    emitIceCandidate,
} from '../../../lib/socket/matching/matching.actions';
import {
    OfferReceivedPayload,
    AnswerReceivedPayload,
    IceCandidateReceivedPayload,
} from '../../../lib/socket/matching/matching.types';

const CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

interface UseWebRTCProps {
    mediaManager: MediaStreamManager | null;
    remoteAudioRef: React.RefObject<HTMLAudioElement | null>;
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
    onSignalQuality?: (quality: 'good' | 'fair' | 'poor' | 'reconnecting') => void;
}

export const useWebRTC = ({
    mediaManager,
    remoteAudioRef,
    onConnectionStateChange,
    onSignalQuality,
}: UseWebRTCProps) => {
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    const createPeerConnection = useCallback(
        (targetId: string) => {
            const stream = mediaManager?.getStream();
            if (!stream) return null;

            const pc = new RTCPeerConnection(CONFIG);
            peerConnectionRef.current = pc;

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.ontrack = (event) => {
                const remoteStream = event.streams[0];
                if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
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
        },
        [mediaManager, remoteAudioRef, onConnectionStateChange, onSignalQuality]
    );

    const closePeerConnection = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    }, [remoteAudioRef]);

    const createOffer = useCallback(async (partnerId: string) => {
        const pc = createPeerConnection(partnerId);
        if (!pc) return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        emitOffer(partnerId, offer);
    }, [createPeerConnection]);

    const handleOffer = useCallback(async (sdp: RTCSessionDescriptionInit, callerId: string) => {
        if (!peerConnectionRef.current) createPeerConnection(callerId);
        const pc = peerConnectionRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        emitAnswer(callerId, answer);
    }, [createPeerConnection]);

    const handleAnswer = useCallback(async (sdp: RTCSessionDescriptionInit) => {
        const pc = peerConnectionRef.current;
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    }, []);

    const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
        const pc = peerConnectionRef.current;
        if (pc) {
            try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
            catch (e) { console.error('Error adding received ice candidate', e); }
        }
    }, []);

    // Stats monitoring
    useEffect(() => {
        const interval = setInterval(async () => {
            const pc = peerConnectionRef.current;
            if (!pc || pc.connectionState !== 'connected') return;
            try {
                const stats = await pc.getStats();
                let rtt = 0;
                stats.forEach(report => {
                    if (report.type === 'candidate-pair' && report.state === 'succeeded' && report.currentRoundTripTime) {
                        rtt = report.currentRoundTripTime * 1000;
                    }
                });
                if (rtt > 300) onSignalQuality?.('poor');
                else if (rtt > 150) onSignalQuality?.('fair');
                else onSignalQuality?.('good');
            } catch (e) { console.error('Stats error:', e); }
        }, 2000);
        return () => clearInterval(interval);
    }, [onSignalQuality]);

    // Signaling listeners
    const onOfferReceived = useCallback((data: OfferReceivedPayload) => {
        handleOffer(data.sdp, data.callerId);
    }, [handleOffer]);

    const onAnswerReceived = useCallback((data: AnswerReceivedPayload) => {
        handleAnswer(data.sdp);
    }, [handleAnswer]);

    const onIceCandidateReceived = useCallback((data: IceCandidateReceivedPayload) => {
        handleIceCandidate(data.candidate);
    }, [handleIceCandidate]);

    useSocketEvent<OfferReceivedPayload>(SocketEvents.OFFER, onOfferReceived);
    useSocketEvent<AnswerReceivedPayload>(SocketEvents.ANSWER, onAnswerReceived);
    useSocketEvent<IceCandidateReceivedPayload>(SocketEvents.ICE_CANDIDATE, onIceCandidateReceived);

    return {
        peerConnectionRef,
        createPeerConnection,
        closePeerConnection,
        createOffer,
        handleOffer,
        handleAnswer,
        handleIceCandidate,
    };
};
