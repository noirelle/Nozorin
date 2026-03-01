import { MutableRefObject, RefObject } from 'react';
import { useWebRTCState } from './useWebRTCState';
import { useWebRTCActions } from './useWebRTCActions';
import { useWebRTCListeners } from './useWebRTCListeners';
import { MediaStreamManager } from '../../../../lib/mediaStream';

interface UseWebRTCProps {
    is_media_ready: boolean;
    mediaManager: MutableRefObject<MediaStreamManager | null>;
    remoteAudioRef: RefObject<HTMLAudioElement | null>;
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
    onSignalQuality?: (quality: 'good' | 'fair' | 'poor' | 'reconnecting') => void;
}

export const useWebRTC = ({
    is_media_ready,
    mediaManager,
    remoteAudioRef,
    onConnectionStateChange,
    onSignalQuality,
}: UseWebRTCProps) => {
    const { peerConnectionRef, ICE_CONFIG, pendingOfferRef, pendingAnswerRef, pendingIceCandidatesRef } = useWebRTCState();
    const actions = useWebRTCActions({
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
    });

    useWebRTCListeners({
        handleOffer: actions.handleOffer,
        handleAnswer: actions.handleAnswer,
        handleIceCandidate: actions.handleIceCandidate,
        onSignalQuality,
        peerConnectionRef,
    });

    return {
        peerConnectionRef,
        createPeerConnection: actions.createPeerConnection,
        closePeerConnection: actions.closePeerConnection,
        createOffer: actions.createOffer,
        handleOffer: actions.handleOffer,
        handleAnswer: actions.handleAnswer,
        handleIceCandidate: actions.handleIceCandidate,
    };
};
