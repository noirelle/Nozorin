import { useRef } from 'react';
import { MediaStreamManager } from '../../../../lib/mediaStream';

const getIceServers = (): RTCIceServer[] => {
    // Xirsys ICE Servers provided by user
    const xirsysServer: RTCIceServer = {
        username: "Iovecib04n-XO9StnUtxVLqeERalcS_jXxmC7lBwcac7rwisC1T5az1gnCZbaal5AAAAAGm0EY54dGxu",
        urls: [
            "stun:hk-turn1.xirsys.com",
            "turn:hk-turn1.xirsys.com:80?transport=udp",
            "turn:hk-turn1.xirsys.com:3478?transport=udp",
            "turn:hk-turn1.xirsys.com:80?transport=tcp",
            "turn:hk-turn1.xirsys.com:3478?transport=tcp",
            "turns:hk-turn1.xirsys.com:443?transport=tcp",
            "turns:hk-turn1.xirsys.com:5349?transport=tcp"
        ],
        credential: "dc353b52-1ee0-11f1-bcad-fa4b4a5e72d9"
    };

    const servers: RTCIceServer[] = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        xirsysServer
    ];

    // Optional environment overrides
    const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
    const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
    const turnPassword = process.env.NEXT_PUBLIC_TURN_PASSWORD;

    if (turnUrl) {
        servers.push({
            urls: turnUrl,
            username: turnUsername,
            credential: turnPassword,
        });
    }

    return servers;
};

const ICE_CONFIG: RTCConfiguration = {
    iceServers: getIceServers(),
    iceCandidatePoolSize: 10,
};

export const useWebRTCState = () => {
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    // Queues for WebRTC signals received before local media is ready
    const pendingOfferRef = useRef<{ sdp: RTCSessionDescriptionInit; callerId: string } | null>(null);
    const pendingAnswerRef = useRef<RTCSessionDescriptionInit | null>(null);
    const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

    return {
        peerConnectionRef,
        ICE_CONFIG,
        pendingOfferRef,
        pendingAnswerRef,
        pendingIceCandidatesRef
    };
};

export type UseWebRTCStateReturn = ReturnType<typeof useWebRTCState>;
