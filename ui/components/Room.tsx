
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { socket as getSocket } from '../lib/socket';
import ChatBox from './ChatBox';

const CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

interface RoomProps {
    mode: 'chat' | 'video';
    onLeave: () => void;
}

interface MatchFoundPayload {
    role: 'offerer' | 'answerer';
    partnerId: string;
    partnerCountry: string;
    partnerCountryCode: string; // ISO Code
    mode: 'chat' | 'video';
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

interface Message {
    senderId: string;
    isSelf: boolean;
    message: string;
    timestamp: string;
}

export default function Room({ mode, onLeave }: RoomProps) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [partnerCountry, setPartnerCountry] = useState<string>('');
    const [partnerCountryCode, setPartnerCountryCode] = useState<string>('');
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState('Click "Start" to find a partner.');
    const [messages, setMessages] = useState<Message[]>([]);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    const socket = getSocket();

    // Initialize local stream only for video mode
    useEffect(() => {
        const initLocalStream = async () => {
            if (mode === 'video') {
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
            }
        };

        if (mode === 'video') {
            initLocalStream();
        }

        // Socket connect
        socket?.connect();

        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            // Do not disconnect socket here if we want to return to lobby without losing socket session?
            // Actually usually we disconnect or leave room.
            socket?.disconnect();
        };
    }, [mode]);

    // Update local video ref when stream changes
    useEffect(() => {
        if (localVideoRef.current && localStream && mode === 'video') {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, mode]);


    const createPeerConnection = useCallback((targetId: string) => {
        if (!localStream) return; // Video mode checks

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
                socket?.emit('ice-candidate', { target: targetId, candidate: event.candidate });
            }
        };

        // Connection state changes
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
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
        setPartnerCountryCode('');
        setPartnerId(null);
        setMessages([]); // Clear chat
        setStatusMessage('Looking for someone...');

        // Close existing connection if any
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }

        socket.emit('find-match', { mode });
    };

    const endCall = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (partnerId) {
            socket?.emit('end-call', { target: partnerId });
        }

        setIsConnected(false);
        setIsSearching(false);
        setStatusMessage('Call ended.');
        setPartnerId(null);
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
    };

    const handleNext = () => {
        endCall();
        findMatch();
    };

    const handleSendMessage = (text: string) => {
        if (!partnerId || !socket) return;
        const msg: Message = {
            senderId: socket.id || 'me',
            isSelf: true,
            message: text,
            timestamp: new Date().toISOString() // Local time
        };
        setMessages(prev => [...prev, msg]);
        socket.emit('send-message', { target: partnerId, message: text });
    };

    useEffect(() => {
        if (!socket) return;

        const onMatchFound = async ({ role, partnerId, partnerCountry, partnerCountryCode, mode: matchMode }: MatchFoundPayload) => {
            setIsSearching(false);
            setIsConnected(true); // For chat, this is immediate
            setPartnerCountry(partnerCountry);
            setPartnerCountryCode(partnerCountryCode);
            setPartnerId(partnerId);
            setStatusMessage('Connected!');

            if (matchMode === 'video') {
                const pc = createPeerConnection(partnerId);
                if (!pc) return;

                if (role === 'offerer') {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit('offer', { target: partnerId, sdp: offer });
                }
            }
        };

        const onOffer = async ({ sdp, callerId }: OfferPayload) => {
            if (mode !== 'video') return; // Ignore if not in video mode

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
            if (mode !== 'video') return;
            const pc = peerConnectionRef.current;
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            }
        };

        const onIceCandidate = async ({ candidate }: IceCandidatePayload) => {
            if (mode !== 'video') return;
            const pc = peerConnectionRef.current;
            if (pc) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
        };

        const onReceiveMessage = ({ senderId, message, timestamp }: { senderId: string, message: string, timestamp: string }) => {
            setMessages(prev => [...prev, {
                senderId,
                isSelf: false,
                message,
                timestamp
            }]);
        };

        const onCallEnded = () => {
            endCall();
            setStatusMessage('Partner left. Finding new match...');
            setTimeout(() => {
                findMatch();
            }, 2000); // 2 second delay to read the message
        };

        socket.on('match-found', onMatchFound);
        socket.on('offer', onOffer);
        socket.on('answer', onAnswer);
        socket.on('ice-candidate', onIceCandidate);
        socket.on('receive-message', onReceiveMessage);
        socket.on('call-ended', onCallEnded);

        return () => {
            socket.off('match-found', onMatchFound);
            socket.off('offer', onOffer);
            socket.off('answer', onAnswer);
            socket.off('ice-candidate', onIceCandidate);
            socket.off('receive-message', onReceiveMessage);
            socket.off('call-ended', onCallEnded);
        };
    }, [createPeerConnection, localStream, socket, mode]);

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white">

            {/* Header / Controls */}
            <div className="flex-none p-4 bg-gray-800 flex justify-between items-center shadow-md z-20">
                <h1 className="text-xl font-bold">
                    {mode === 'chat' ? '💬 Chat' : '📹 Video'} Mode
                </h1>
                <div className="flex gap-4">
                    {!isSearching && !isConnected ? (
                        <button
                            onClick={findMatch}
                            disabled={mode === 'video' && !localStream}
                            className={`px-6 py-2 rounded-full font-bold transition shadow-lg ${(mode === 'chat' || localStream)
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'bg-gray-600 cursor-not-allowed opacity-50'
                                }`}
                        >
                            Start
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-full font-bold transition"
                        >
                            Next Partner
                        </button>
                    )}
                    <button
                        onClick={onLeave}
                        className="px-4 py-2 bg-gray-700 hover:bg-red-600 rounded-lg font-semibold transition"
                    >
                        Exit
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

                {/* Video Area (Only in Video Mode) */}
                {mode === 'video' && (
                    <div className="flex-1 bg-black relative flex items-center justify-center p-4">
                        {/* Remote Video */}
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-contain max-h-[80vh] rounded-lg bg-gray-900"
                        />

                        {/* Status Overlay */}
                        {(!isConnected && !isSearching) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 pointer-events-none">
                                <p className="text-xl font-semibold">{statusMessage}</p>
                            </div>
                        )}
                        {isSearching && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 pointer-events-none">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4 mx-auto"></div>
                                    <p className="text-xl font-semibold">{statusMessage}</p>
                                </div>
                            </div>
                        )}

                        {/* Partner Info */}
                        {isConnected && partnerCountry && (
                            <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded text-sm pointer-events-none flex items-center gap-2">
                                <span className="text-gray-300">Partner from:</span>
                                {partnerCountryCode && (
                                    <img
                                        src={`https://flagcdn.com/w40/${partnerCountryCode.toLowerCase()}.png`}
                                        alt={partnerCountry}
                                        className="w-6 h-auto inline-block rounded-sm"
                                    />
                                )}
                                <span className="font-bold text-green-400">{partnerCountry}</span>
                            </div>
                        )}

                        {/* Local Video (PiP) */}
                        <div className="absolute bottom-4 right-4 w-32 md:w-48 aspect-video bg-gray-800 rounded border-2 border-white overflow-hidden shadow-lg z-20">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover transform scale-x-[-1]"
                            />
                        </div>
                    </div>
                )}

                {/* Chat Area (Always Visible or Full Width in Chat Mode) */}
                <div className={`${mode === 'video' ? 'w-full md:w-1/3 border-l border-gray-700' : 'w-full max-w-4xl mx-auto'} flex flex-col bg-gray-800`}>
                    {/* Chat Status for Chat Mode */}
                    {mode === 'chat' && (
                        <div className="p-4 bg-gray-800 border-b border-gray-700 text-center">
                            <div className="flex items-center justify-center gap-2 font-semibold">
                                {isSearching ? (
                                    <span className="text-yellow-400">🔎 Looking for a stranger...</span>
                                ) : isConnected ? (
                                    <span className="text-green-400 flex items-center gap-2">
                                        Connected with stranger from
                                        {partnerCountryCode && (
                                            <img
                                                src={`https://flagcdn.com/w40/${partnerCountryCode.toLowerCase()}.png`}
                                                alt={partnerCountry}
                                                className="w-5 h-auto rounded-sm"
                                            />
                                        )}
                                        {partnerCountry}
                                    </span>
                                ) : (
                                    <span className="text-yellow-400">{statusMessage}</span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 p-2 md:p-4 overflow-hidden h-full">
                        <ChatBox
                            messages={messages}
                            onSendMessage={handleSendMessage}
                            isConnected={isConnected}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
