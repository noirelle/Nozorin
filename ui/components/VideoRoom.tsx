'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { socket as getSocket } from '../lib/socket';

const CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

interface MatchFoundPayload {
    role: 'offerer' | 'answerer';
    partnerId: string;
    partnerCountry: string;
}

interface OfferPayload {
    sdp: RTCSessionDescriptionInit;
    callerId: string;
}

interface AnswerPayload {
    sdp: RTCSessionDescriptionInit;
}

interface IceCandidatePayload {
    candidate: RTCIceCandidateInit;
}

export default function VideoRoom() {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [partnerCountry, setPartnerCountry] = useState<string>('');
    const [statusMessage, setStatusMessage] = useState('Click "Start" to find a partner.');

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    const socket = getSocket();

    // Initialize local stream
    useEffect(() => {
        const initLocalStream = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error('Error accessing media devices:', err);
                setStatusMessage('Error: Could not access camera/microphone');
            }
        };
        initLocalStream();

        // Socket connect
        socket?.connect();

        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            socket?.disconnect();
        };
    }, []);

    // Update local video ref when stream changes
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);


    const createPeerConnection = useCallback((partnerId: string) => {
        if (!localStream) return;

        const pc = new RTCPeerConnection(CONFIG);
        peerConnectionRef.current = pc;

        // Add local tracks
        localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
        });

        // Handle remote stream
        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket?.emit('ice-candidate', { target: partnerId, candidate: event.candidate });
            }
        };

        // Connection state changes
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'connected') {
                setIsConnected(true);
                setStatusMessage('');
            } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                endCall();
                setStatusMessage('Partner disconnected. Searching for new match...');
                findMatch(); // Auto-reconnect
            }
        };

        return pc;
    }, [localStream, socket]);

    const findMatch = () => {
        if (!socket) return;
        setIsSearching(true);
        setIsConnected(false);
        setPartnerCountry('');
        setStatusMessage('Looking for someone...');

        // Close existing connection if any
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        socket.emit('find-match');
    };

    const endCall = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        setIsConnected(false);
        setIsSearching(false);
        setStatusMessage('Call ended.');
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
    };

    useEffect(() => {
        if (!socket) return;

        const onMatchFound = async ({ role, partnerId, partnerCountry }: MatchFoundPayload) => {
            setIsSearching(false);
            setPartnerCountry(partnerCountry);
            setStatusMessage('Connecting...');

            const pc = createPeerConnection(partnerId);
            if (!pc) return;

            if (role === 'offerer') {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('offer', { target: partnerId, sdp: offer });
            }
        };

        const onOffer = async ({ sdp, callerId }: OfferPayload) => {
            if (!peerConnectionRef.current) {
                createPeerConnection(callerId);
            }
            const pc = peerConnectionRef.current!;
            if (!pc) return;

            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', { target: callerId, sdp: answer });
        };

        const onAnswer = async ({ sdp }: AnswerPayload) => {
            const pc = peerConnectionRef.current;
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            }
        };

        const onIceCandidate = async ({ candidate }: IceCandidatePayload) => {
            const pc = peerConnectionRef.current;
            if (pc) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
        };

        const onCallEnded = () => {
            endCall();
            setStatusMessage('Partner left. finding new match...');
            findMatch();
        };

        socket.on('match-found', onMatchFound);
        socket.on('offer', onOffer);
        socket.on('answer', onAnswer);
        socket.on('ice-candidate', onIceCandidate);
        socket.on('call-ended', onCallEnded);

        return () => {
            socket.off('match-found', onMatchFound);
            socket.off('offer', onOffer);
            socket.off('answer', onAnswer);
            socket.off('ice-candidate', onIceCandidate);
            socket.off('call-ended', onCallEnded);
        };
    }, [createPeerConnection, localStream, socket]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <h1 className="text-3xl font-bold mb-6">Omegle Clone (Minimal)</h1>

            <div className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden aspect-video shadow-2xl">
                {/* Remote Video */}
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />

                {/* Status Overlay */}
                {(!isConnected && !isSearching) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                        <p className="text-xl font-semibold">{statusMessage}</p>
                    </div>
                )}
                {isSearching && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                        <p className="ml-4 text-xl font-semibold">{statusMessage}</p>
                    </div>
                )}

                {/* Partner Info */}
                {isConnected && partnerCountry && (
                    <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded text-sm">
                        Partner from: <span className="font-bold text-green-400">{partnerCountry}</span>
                    </div>
                )}

                {/* Local Video (PiP) */}
                <div className="absolute bottom-4 right-4 w-48 aspect-video bg-gray-800 rounded border-2 border-white overflow-hidden shadow-lg">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                    />
                </div>
            </div>

            <div className="mt-8 flex gap-4">
                {!isSearching && !isConnected ? (
                    <button
                        onClick={findMatch}
                        disabled={!localStream}
                        className={`px-8 py-3 rounded-full font-bold text-lg transition shadow-lg ${localStream
                                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                                : 'bg-gray-600 cursor-not-allowed opacity-50'
                            }`}
                    >
                        {localStream ? 'Find Match' : 'Loading Camera...'}
                    </button>
                ) : (
                    <button
                        onClick={endCall}
                        className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-full font-bold text-lg transition shadow-lg shadow-red-500/30"
                    >
                        Stop / Next
                    </button>
                )}
            </div>

            <div className="mt-4 text-gray-400 text-sm">
                <p>Ensure backend is running on localhost:3001</p>
            </div>
        </div>
    );
}
