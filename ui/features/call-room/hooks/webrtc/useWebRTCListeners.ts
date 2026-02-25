import { useCallback, useEffect } from 'react';
import { useSocketEvent, SocketEvents } from '../../../../lib/socket';
import {
    OfferReceivedPayload,
    AnswerReceivedPayload,
    IceCandidateReceivedPayload,
} from '../../../../lib/socket/matching/matching.types';

interface UseWebRTCListenersProps {
    handleOffer: (sdp: RTCSessionDescriptionInit, callerId: string) => void;
    handleAnswer: (sdp: RTCSessionDescriptionInit) => void;
    handleIceCandidate: (candidate: RTCIceCandidateInit) => void;
    onSignalQuality?: (quality: 'good' | 'fair' | 'poor' | 'reconnecting') => void;
    peerConnectionRef: React.MutableRefObject<RTCPeerConnection | null>;
}

export const useWebRTCListeners = ({
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    onSignalQuality,
    peerConnectionRef,
}: UseWebRTCListenersProps) => {
    const onOfferReceived = useCallback((data: OfferReceivedPayload) => {
        handleOffer(data.sdp, data.caller_id);
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

    // RTT-based signal quality monitoring
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
    }, [onSignalQuality, peerConnectionRef]);
};
