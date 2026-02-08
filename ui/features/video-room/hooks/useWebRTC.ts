import { useCallback, useRef, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { MediaStreamManager } from '../../../lib/mediaStream';

const CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

interface UseWebRTCProps {
    socket: Socket | null;
    mediaManager: MediaStreamManager | null;
    remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
}

export const useWebRTC = ({
    socket,
    mediaManager,
    remoteVideoRef,
    onConnectionStateChange,
}: UseWebRTCProps) => {
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    const createPeerConnection = useCallback(
        (targetId: string) => {
            const stream = mediaManager?.getStream();
            if (!stream) return null;

            const pc = new RTCPeerConnection(CONFIG);
            peerConnectionRef.current = pc;

            // Add local tracks to peer connection
            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });

            // Handle incoming remote track
            pc.ontrack = (event) => {
                const remoteStream = event.streams[0];
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                }
                // Sync with other video elements if present (for responsive layouts)
                document
                    .querySelectorAll('video#mobile-remote-video, video#desktop-remote-video')
                    .forEach((v) => {
                        (v as HTMLVideoElement).srcObject = remoteStream;
                    });
            };

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket?.emit('ice-candidate', {
                        target: targetId,
                        candidate: event.candidate,
                    });
                }
            };

            // Handle connection state changes
            pc.onconnectionstatechange = () => {
                if (
                    pc.connectionState === 'disconnected' ||
                    pc.connectionState === 'failed'
                ) {
                    onConnectionStateChange?.(pc.connectionState);
                }
            };

            return pc;
        },
        [socket, mediaManager, remoteVideoRef, onConnectionStateChange]
    );

    const closePeerConnection = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
    }, [remoteVideoRef]);

    const createOffer = useCallback(
        async (partnerId: string) => {
            const pc = createPeerConnection(partnerId);
            if (!pc) return;

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket?.emit('offer', { target: partnerId, sdp: offer });
        },
        [socket, createPeerConnection]
    );

    const handleOffer = useCallback(
        async (sdp: RTCSessionDescriptionInit, callerId: string) => {
            if (!peerConnectionRef.current) {
                createPeerConnection(callerId);
            }
            const pc = peerConnectionRef.current;
            if (!pc) return;

            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket?.emit('answer', { target: callerId, sdp: answer });
        },
        [socket, createPeerConnection]
    );

    const handleAnswer = useCallback(async (sdp: RTCSessionDescriptionInit) => {
        const pc = peerConnectionRef.current;
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        }
    }, []);

    const handleIceCandidate = useCallback(
        async (candidate: RTCIceCandidateInit) => {
            const pc = peerConnectionRef.current;
            if (pc) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error('Error adding received ice candidate', e);
                }
            }
        },
        []
    );

    // Set up signaling listeners
    useEffect(() => {
        if (!socket) return;

        const onOffer = (data: { sdp: RTCSessionDescriptionInit; callerId: string }) => {
            handleOffer(data.sdp, data.callerId);
        };

        const onAnswer = (data: { sdp: RTCSessionDescriptionInit }) => {
            handleAnswer(data.sdp);
        };

        const onIceCandidate = (data: { candidate: RTCIceCandidateInit }) => {
            handleIceCandidate(data.candidate);
        };

        socket.on('offer', onOffer);
        socket.on('answer', onAnswer);
        socket.on('ice-candidate', onIceCandidate);

        return () => {
            socket.off('offer', onOffer);
            socket.off('answer', onAnswer);
            socket.off('ice-candidate', onIceCandidate);
        };
    }, [socket, handleOffer, handleAnswer, handleIceCandidate]);

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
