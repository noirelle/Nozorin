import { useRef } from 'react';
import { MediaStreamManager } from '../../../../lib/mediaStream';

const getIceServers = (): RTCIceServer[] => {
    const servers: RTCIceServer[] = [];

    // 1. Prioritize dedicated Xirsys infrastructure (STUN + TURN)
    const xirsysUsername = process.env.NEXT_PUBLIC_XIRSYS_USERNAME;
    const xirsysCredential = process.env.NEXT_PUBLIC_XIRSYS_CREDENTIAL;

    if (xirsysUsername && xirsysCredential) {
        // Xirsys STUN
        servers.push({
            urls: "stun:hk-turn1.xirsys.com"
        });

        // Xirsys TURN (Separated by transport for better compatibility)
        servers.push({
            username: xirsysUsername,
            credential: xirsysCredential,
            urls: [
                "turn:hk-turn1.xirsys.com:80?transport=udp",
                "turn:hk-turn1.xirsys.com:3478?transport=udp",
                "turn:hk-turn1.xirsys.com:80?transport=tcp",
                "turn:hk-turn1.xirsys.com:3478?transport=tcp"
            ]
        });

        // Xirsys TURNS (Secure)
        servers.push({
            username: xirsysUsername,
            credential: xirsysCredential,
            urls: [
                "turns:hk-turn1.xirsys.com:443?transport=tcp",
                "turns:hk-turn1.xirsys.com:5349?transport=tcp"
            ]
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
