import { useRef } from 'react';
import { MediaStreamManager } from '../../../../lib/mediaStream';

const ICE_CONFIG: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export const useWebRTCState = () => {
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    return { peerConnectionRef, ICE_CONFIG };
};

export type UseWebRTCStateReturn = ReturnType<typeof useWebRTCState>;
