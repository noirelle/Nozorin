import { useCallback, MutableRefObject, RefObject } from 'react';
import { MediaStreamManager } from '../../../../lib/mediaStream';
import {
    emitOffer,
    emitAnswer,
    emitIceCandidate,
} from '../../../../lib/socket/matching/matching.actions';
import { UseWebRTCStateReturn } from './useWebRTCState';

interface UseWebRTCActionsProps extends UseWebRTCStateReturn {
    mediaManager: MutableRefObject<MediaStreamManager | null>;
    remoteAudioRef: RefObject<HTMLAudioElement | null>;
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
    onSignalQuality?: (quality: 'good' | 'fair' | 'poor' | 'reconnecting') => void;
}

export const useWebRTCActions = ({
    peerConnectionRef,
    ICE_CONFIG,
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
    }, [mediaManager, remoteAudioRef, onConnectionStateChange, onSignalQuality, peerConnectionRef, ICE_CONFIG]);

    const closePeerConnection = useCallback(() => {
        if (peerConnectionRef.current) {
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
        if (!peerConnectionRef.current) createPeerConnection(callerId);
        const pc = peerConnectionRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        emitAnswer(callerId, answer);
    }, [createPeerConnection, peerConnectionRef]);

    const handleAnswer = useCallback(async (sdp: RTCSessionDescriptionInit) => {
        const pc = peerConnectionRef.current;
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    }, [peerConnectionRef]);

    const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
        const pc = peerConnectionRef.current;
        if (pc) {
            try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
            catch (e) { console.error('Error adding received ice candidate', e); }
        }
    }, [peerConnectionRef]);

    return {
        createPeerConnection,
        closePeerConnection,
        createOffer,
        handleOffer,
        handleAnswer,
        handleIceCandidate,
    };
};
