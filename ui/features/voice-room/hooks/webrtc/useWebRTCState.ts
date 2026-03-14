import { useRef, useState, useMemo } from 'react';
import { MediaStreamManager } from '../../../../lib/mediaStream';

export interface IceDebugData {
    localCandidates: RTCIceCandidate[];
    remoteCandidates: RTCIceCandidate[];
    iceConnectionState: RTCIceConnectionState;
    iceGatheringState: RTCIceGatheringState;
    connectionState: RTCPeerConnectionState;
    signalingState: RTCSignalingState;
    isConfigured: boolean;
    iceCandidateError?: string;
    selectedCandidatePair?: {
        local: RTCIceCandidate;
        remote: RTCIceCandidate;
    };
}


export const useWebRTCState = () => {
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    // Queues for WebRTC signals received before local media is ready
    const pendingOfferRef = useRef<{ sdp: RTCSessionDescriptionInit; callerId: string } | null>(null);
    const pendingAnswerRef = useRef<RTCSessionDescriptionInit | null>(null);
    const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

    const [iceDebugData, setIceDebugData] = useState<IceDebugData>({
        localCandidates: [],
        remoteCandidates: [],
        iceConnectionState: 'new',
        iceGatheringState: 'new',
        connectionState: 'new',
        signalingState: 'stable',
        isConfigured: false
    });


    const ICE_CONFIG: RTCConfiguration = useMemo(() => {
        const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
        const turnPassword = process.env.NEXT_PUBLIC_TURN_PASSWORD;

        const servers: RTCIceServer[] = [
            {
                urls: [
                    "stun:18.136.194.236:3478",
                    "turn:18.136.194.236:3478?transport=udp",
                    "turn:18.136.194.236:3478?transport=tcp"
                ],
                username: turnUsername,
                credential: turnPassword,
            }
        ];

        return {
            iceServers: servers,
            iceCandidatePoolSize: 10,
        };
    }, []);

    return {
        peerConnectionRef,
        ICE_CONFIG,
        pendingOfferRef,
        pendingAnswerRef,
        pendingIceCandidatesRef,
        iceDebugData,
        setIceDebugData
    };
};

export type UseWebRTCStateReturn = ReturnType<typeof useWebRTCState>;


