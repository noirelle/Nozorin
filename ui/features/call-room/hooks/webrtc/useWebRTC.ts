import { useWebRTCState } from './useWebRTCState';
import { useWebRTCActions } from './useWebRTCActions';
import { useWebRTCListeners } from './useWebRTCListeners';
import { MediaStreamManager } from '../../../../lib/mediaStream';

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
    const { peerConnectionRef, ICE_CONFIG } = useWebRTCState();
    const actions = useWebRTCActions({
        peerConnectionRef,
        ICE_CONFIG,
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
