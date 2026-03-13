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
        const servers: RTCIceServer[] = [];

        // 1. Prioritize dedicated Xirsys infrastructure (STUN + TURN)
        const xirsysUsername = process.env.NEXT_PUBLIC_XIRSYS_USERNAME;
        const xirsysCredential = process.env.NEXT_PUBLIC_XIRSYS_CREDENTIAL;


        if (xirsysUsername && xirsysCredential) {
            // 1. Xirsys TURNS (Secure TCP - Port 443 is best for bypassing firewalls)
            servers.push({
                username: xirsysUsername,
                credential: xirsysCredential,
                urls: [
                    "turns:hk-turn1.xirsys.com:443?transport=tcp",
                    "turns:hk-turn1.xirsys.com:5349?transport=tcp"
                ]
            });

            // 2. Xirsys TURN TCP (Port 80/3478)
            servers.push({
                username: xirsysUsername,
                credential: xirsysCredential,
                urls: [
                    "turn:hk-turn1.xirsys.com:80?transport=tcp",
                    "turn:hk-turn1.xirsys.com:3478?transport=tcp"
                ]
            });

            // 3. Xirsys TURN UDP (Legacy/Standard)
            servers.push({
                username: xirsysUsername,
                credential: xirsysCredential,
                urls: [
                    "turn:hk-turn1.xirsys.com:3478?transport=udp",
                    "turn:hk-turn1.xirsys.com:80?transport=udp"
                ]
            });

            // 4. Xirsys STUN
            servers.push({
                urls: "stun:hk-turn1.xirsys.com"
            });
        }


        // 2. Google STUN Fallbacks (Lower priority)
        servers.push(
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        );

        // 3. Optional environment overrides (Top priority if provided)
        const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
        const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
        const turnPassword = process.env.NEXT_PUBLIC_TURN_PASSWORD;

        if (turnUrl) {
            servers.unshift({
                urls: turnUrl,
                username: turnUsername,
                credential: turnPassword,
            });
        }


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


