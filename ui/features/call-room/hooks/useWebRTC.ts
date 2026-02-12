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
    remoteAudioRef: React.RefObject<HTMLAudioElement | null>;
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
    onSignalQuality?: (quality: 'good' | 'fair' | 'poor' | 'reconnecting') => void;
}

export const useWebRTC = ({
    socket,
    mediaManager,
    remoteAudioRef,
    onConnectionStateChange,
    onSignalQuality,
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
                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = remoteStream;
                }
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
                const state = pc.connectionState;
                if (state === 'disconnected') {
                    onSignalQuality?.('reconnecting');
                } else if (state === 'connected') {
                    onSignalQuality?.('good');
                }

                if (state === 'failed' || state === 'closed') {
                    onConnectionStateChange?.(state);
                }
                // For disconnected, we notify signal quality but let parent decide if it wants to close immediately
                // However, original code did:
                // if (state === 'disconnected' || state === 'failed') onConnectionStateChange?.(state);
                // We preserve this for now, but Room.tsx should be updated to not stop on 'disconnected' immediately.
                if (state === 'disconnected') {
                    onConnectionStateChange?.(state);
                }
            };

            return pc;
        },
        [socket, mediaManager, remoteAudioRef, onConnectionStateChange, onSignalQuality]
    );

    const closePeerConnection = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
        }
    }, [remoteAudioRef]);

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

    // Stats Monitoring
    useEffect(() => {
        const interval = setInterval(async () => {
            const pc = peerConnectionRef.current;
            if (!pc || pc.connectionState !== 'connected') return;

            try {
                const stats = await pc.getStats();
                let rtt = 0;

                stats.forEach((report) => {
                    if (report.type === 'candidate-pair' && report.state === 'succeeded' && report.currentRoundTripTime) {
                        rtt = report.currentRoundTripTime * 1000;
                    }
                });

                if (rtt > 300) {
                    onSignalQuality?.('poor');
                } else if (rtt > 150) {
                    onSignalQuality?.('fair');
                } else {
                    onSignalQuality?.('good');
                }
            } catch (e) {
                console.error('Stats error:', e);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [onSignalQuality]);

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
