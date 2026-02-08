
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { socket as getSocket } from '../lib/socket';
import ChatBox from './ChatBox';
import { LogoIcon, ArrowRightIcon } from './icons';

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
    callerId: string;
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
    const [messages, setMessages] = useState<Message[]>([]);

    // Controls State
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);

    // Chat visibility state
    const [showChat, setShowChat] = useState(false);
    // Effects
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [inputText, setInputText] = useState("");
    const [mobileLayout, setMobileLayout] = useState<'overlay' | 'split'>('overlay');

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    const socket = getSocket();

    // Initialize local stream
    useEffect(() => {
        const initLocalStream = async () => {
            if (mode === 'video') {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'user' }, // Front camera on mobile
                        audio: true
                    });
                    setLocalStream(stream);
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }
                } catch (err) {
                    console.error('Error accessing media devices:', err);
                }
            } else {
                if (localStream) {
                    localStream.getTracks().forEach(track => track.stop());
                    setLocalStream(null);
                }
            }
        };

        if (mode === 'video') initLocalStream();

        socket?.connect();

        return () => {
            // Cleanup handled by effect dependency logic mostly
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, socket]);

    // Update local video ref
    useEffect(() => {
        if (localVideoRef.current && localStream && mode === 'video') {
            localVideoRef.current.srcObject = localStream;
            // Update muted/camera logic on stream tracks
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !isCameraOff;
            });
        }
    }, [localStream, mode, isMuted, isCameraOff]);


    const endCall = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (partnerId) {
            socket?.emit('end-call', { target: partnerId });
        }

        setIsConnected(false);
        setIsSearching(false);
        setPartnerId(null);
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
    }, [partnerId, socket]);

    const createPeerConnection = useCallback((targetId: string) => {
        if (!localStream) return;

        const pc = new RTCPeerConnection(CONFIG);
        peerConnectionRef.current = pc;

        localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
        });

        pc.ontrack = (event) => {
            const stream = event.streams[0];
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
            }
            // Manually sync other video elements if present
            document.querySelectorAll('video#mobile-remote-video, video#desktop-remote-video').forEach(v => {
                (v as HTMLVideoElement).srcObject = stream;
            });
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket?.emit('ice-candidate', { target: targetId, candidate: event.candidate });
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                endCall();
            }
        };

        return pc;
    }, [localStream, socket, endCall]);

    const findMatch = useCallback(() => {
        if (!socket) return;
        setIsSearching(true);
        setIsConnected(false);
        setPartnerCountry('');
        setPartnerCountryCode('');
        setPartnerId(null);
        setMessages([]);

        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }

        socket.emit('find-match', { mode });
    }, [socket, mode]);

    const handleNext = useCallback(() => {
        endCall();
        findMatch();
    }, [endCall, findMatch]);

    const handleSendMessage = (text: string) => {
        if (!partnerId || !socket) return;
        const msg: Message = {
            senderId: socket.id || 'me',
            isSelf: true,
            message: text,
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, msg]);
        socket.emit('send-message', { target: partnerId, message: text });
    };

    // Socket Listeners
    useEffect(() => {
        if (!socket) return;

        const onMatchFound = async ({ role, partnerId, partnerCountry, partnerCountryCode, mode: matchMode }: MatchFoundPayload) => {
            setIsSearching(false);
            setIsConnected(true);
            setPartnerCountry(partnerCountry || 'Unknown');
            setPartnerCountryCode(partnerCountryCode);
            setPartnerId(partnerId);

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
            if (mode !== 'video') return;
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
            setShowChat(true); // Auto-open chat on receive?
        };

        const onCallEnded = () => {
            endCall();
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
    }, [createPeerConnection, localStream, socket, mode, endCall]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onLeave();
            } else if (e.key === 'ArrowRight') {
                handleNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onLeave, handleNext]);

    // Scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Sync Local Video Streams (Duplicate elements handling)
    useEffect(() => {
        document.querySelectorAll('video#mobile-local-video, video#desktop-local-video').forEach(v => {
            if ((v as HTMLVideoElement).srcObject !== localStream) {
                (v as HTMLVideoElement).srcObject = localStream;
            }
        });
    }, [localStream]);

    // Prevent body scroll on mobile
    useEffect(() => {
        // Save original styles
        const originalStyle = {
            overflow: document.body.style.overflow,
            position: document.body.style.position,
            width: document.body.style.width,
            height: document.body.style.height
        };

        // Prevent scroll
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';

        // Cleanup
        return () => {
            document.body.style.overflow = originalStyle.overflow;
            document.body.style.position = originalStyle.position;
            document.body.style.width = originalStyle.width;
            document.body.style.height = originalStyle.height;
        };
    }, []);

    return (
        <div className="flex flex-col h-[100dvh] bg-[#111] text-foreground font-sans overflow-hidden select-none relative touch-none">

            {/* ========================= MOBILE VIEW (lg:hidden) ========================= */}
            <div className="lg:hidden w-full h-full fixed inset-0 font-sans touch-none">
                <div className={`fixed left-0 right-0 top-0 z-0 bg-black transition-all duration-300 ${mobileLayout === 'split' ? 'h-[50%] bottom-auto border-b border-white/10' : 'h-full bottom-0'}`}>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 z-10 pointer-events-none"></div>
                    <video
                        id="mobile-remote-video"
                        className={`w-full h-full object-cover ${isConnected ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                        autoPlay playsInline
                    />
                    {!isConnected && (
                        <div className="absolute inset-0 flex items-center justify-center z-0">
                            <div className="flex flex-col items-center gap-3 opacity-50">
                                <div className="w-16 h-16 rounded-full bg-zinc-800 animate-pulse"></div>
                                <div className="w-24 h-4 bg-zinc-800 rounded animate-pulse"></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="fixed top-0 left-0 right-0 z-30 px-4 py-3 flex items-start justify-between touch-none">

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/5 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                            <span className="text-sm font-bold text-white/90 shadow-black drop-shadow-md">{partnerCountryCode || '?'}</span>
                        </div>

                        <div className="flex flex-col justify-center shadow-black drop-shadow-md">
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white text-[15px] leading-tight filter drop-shadow-md">
                                    {partnerCountry || 'Nozorin User'}
                                </span>
                                <svg className="w-3.5 h-3.5 text-green-400 fill-current drop-shadow-sm" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
                            </div>

                            {partnerCountry && (
                                <div className="flex items-center gap-1.5 text-white/90 text-[11px] font-medium leading-tight drop-shadow-md">
                                    {partnerCountryCode && (
                                        <img
                                            src={`https://flagcdn.com/w20/${partnerCountryCode.toLowerCase()}.png`}
                                            className="w-3.5 rounded-[2px] shadow-sm"
                                            alt={partnerCountry}
                                        />
                                    )}
                                    <span className="opacity-90">{partnerCountry}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">

                        <button className="w-9 h-9 flex items-center justify-center rounded-full bg-black/10 backdrop-blur-md text-white/90 hover:bg-black/30 transition-all shadow-sm">
                            <svg className="w-5 h-5 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </button>
                        <button onClick={onLeave} className="w-9 h-9 flex items-center justify-center rounded-full bg-black/10 backdrop-blur-md text-white/90 hover:bg-white/10 transition-all shadow-sm">
                            <svg className="w-6 h-6 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                <div className={`fixed z-10 transition-all duration-300 overflow-hidden bg-black touch-none
                    ${mobileLayout === 'split'
                        ? 'top-[50%] left-0 right-0 bottom-0 w-full rounded-none border-t border-white/10'
                        : 'top-16 right-4 w-[80px] aspect-[3/4] rounded-lg shadow-lg border border-white/10 backdrop-blur-sm bg-black/50'}`}>
                    <video
                        id="mobile-local-video"
                        className={`w-full h-full object-cover transform scale-x-[-1] ${isCameraOff ? 'hidden' : 'block'}`}
                        autoPlay playsInline muted
                    />
                    {isCameraOff && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        </div>
                    )}
                </div>

                {(!isConnected && !isSearching) && (
                    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-10 px-6">
                        <div className="text-center p-6 bg-black/10 backdrop-blur-md rounded-3xl shadow-xl">
                            <h2 className="text-2xl font-bold mb-2 text-white font-display drop-shadow-md">Start Matching</h2>
                            <p className="text-white/90 text-sm drop-shadow-md">Tap <span className="text-[#FF8ba7] font-bold">Next</span> to meet someone new</p>
                        </div>
                    </div>
                )}
                {isSearching && (
                    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 border-4 border-white/20 border-t-[#FF8ba7] rounded-full animate-spin drop-shadow-md"></div>
                            <p className="font-bold text-white drop-shadow-md animate-pulse">Searching...</p>
                        </div>
                    </div>
                )}

                <div className="fixed bottom-0 left-0 right-0 z-30 flex flex-col justify-end pointer-events-none pb-safe-area">

                    <div className={`fixed bottom-0 left-0 right-0 transition-all duration-300 pointer-events-none z-0 ${showChat ? 'h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent' : 'h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent'}`} />

                    {showChat && (
                        <div
                            className="fixed inset-0 z-10 pointer-events-auto bg-transparent"
                            onClick={() => setShowChat(false)}
                        />
                    )}

                    <div className={`relative z-20 w-full px-4 py-2 flex flex-col justify-end transition-all duration-300 pointer-events-auto ${showChat ? 'max-h-[40vh] mb-0' : 'max-h-[35vh] min-h-[50px] mb-0'}`}>
                        <div className="overflow-y-auto scrollbar-hide flex flex-col gap-2 pb-2 mask-image-gradient overscroll-contain touch-pan-y">
                            {/* Guidelines Placeholder */}
                            {messages.length === 0 && (
                                <div className="text-center py-4 animate-in fade-in zoom-in duration-500">
                                    <p className="text-white/80 text-xs font-medium bg-black/20 backdrop-blur-md inline-block px-3 py-1.5 rounded-full shadow-sm">
                                        Azar cares about your safety. Check out our <span className="text-[#FF8ba7] underline cursor-pointer hover:text-white transition-colors">Community Guidelines</span> and have fun!
                                    </p>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.isSelf ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                                    <div className={`px-4 py-2 rounded-2xl text-[15px] font-medium backdrop-blur-md shadow-sm max-w-[85%] break-words leading-relaxed drop-shadow-sm ${msg.isSelf
                                        ? 'bg-[#FF8ba7]/90 text-white rounded-tr-sm'
                                        : 'bg-black/40 text-white rounded-tl-sm'}`}>
                                        {msg.message}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    <div className="relative z-30 pointer-events-auto">
                        {showChat ? (
                            <form
                                className="bg-transparent p-4 pb-6 flex items-end gap-2 animate-in slide-in-from-bottom-4 duration-300 ease-out"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (inputText.trim()) {
                                        handleSendMessage(inputText);
                                        setInputText("");
                                    }
                                }}
                            >
                                <input
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-black/40 text-white placeholder-white/70 rounded-full px-5 py-3 focus:outline-none focus:bg-black/60 border-none text-[16px] transition-all backdrop-blur-xl shadow-lg"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!inputText.trim()}
                                    className="p-3 rounded-full bg-[#FF8ba7]/90 hover:bg-[#FF8ba7] text-white disabled:opacity-0 disabled:scale-75 transition-all active:scale-90 shadow-lg backdrop-blur-md"
                                >
                                    <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                                </button>
                            </form>
                        ) : (
                            <div className="px-6 pb-6 pt-4 flex items-center justify-between animate-in fade-in duration-300 w-full max-w-md mx-auto">

                                <button
                                    onClick={() => setShowChat(true)}
                                    className="p-2.5 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-all active:scale-95 relative"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 drop-shadow-md">
                                        <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
                                    </svg>
                                    {messages.length > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black animate-pulse"></span>}
                                </button>

                                <button
                                    onClick={() => setMobileLayout(prev => prev === 'overlay' ? 'split' : 'overlay')}
                                    className="p-2.5 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 drop-shadow-md">
                                        <path fillRule="evenodd" d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z" clipRule="evenodd" />
                                    </svg>
                                </button>


                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className={`p-2.5 rounded-full transition-all active:scale-95 ${isMuted ? 'text-red-500 bg-white/10' : 'text-white/90 hover:text-white hover:bg-white/10'}`}
                                >
                                    {isMuted ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 drop-shadow-md">
                                            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                                            <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 drop-shadow-md">
                                            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                                            <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                                        </svg>
                                    )}
                                </button>

                                <button
                                    onClick={() => setIsCameraOff(!isCameraOff)}
                                    className={`p-2.5 rounded-full transition-all active:scale-95 ${isCameraOff ? 'text-red-500 bg-white/10' : 'text-white/90 hover:text-white hover:bg-white/10'}`}
                                >
                                    {isCameraOff ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 drop-shadow-md">
                                            <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM20.57 16.476l-2.091-2.091c.148-.282.261-.573.336-.871.21-.828.32-1.702.321-2.601a.75.75 0 00-.063-.3.75.75 0 00-.687-.452h-.01L15.65 8.24l2.455-2.455c.61-.161 1.258.043 1.61.503l3.856 5.027a.75.75 0 01.002.902l-3.003 4.26zM7.222 7.828l1.637 1.637.733-.733a6.75 6.75 0 019.345 7.02l.745.746a8.257 8.257 0 00-11.532-6.643l-.928-2.027z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 drop-shadow-md">
                                            <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
                                        </svg>
                                    )}
                                </button>

                                <div className="w-px h-8 bg-white/10 mx-1"></div>

                                <button
                                    onClick={handleNext}
                                    className="flex items-center gap-1.5 pl-2 pr-1 text-white hover:text-white/80 active:scale-95 transition-all group"
                                >
                                    <span className="font-bold text-[17px] tracking-wide drop-shadow-md">Next</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform drop-shadow-md">
                                        <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>


            <div className="hidden lg:flex flex-col w-full h-full p-4 gap-4">

                <div className="flex h-16 items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <LogoIcon className="w-8 h-8 text-[#FF8ba7]" />
                        <span className="text-2xl font-display font-bold tracking-tight text-white">nozorin</span>
                    </div>
                </div>

                <div className="flex-1 flex gap-4 min-h-0">

                    <div className="flex-1 bg-[#1a1a1a] rounded-3xl overflow-hidden relative border border-white/5 shadow-2xl">
                        <video
                            id="desktop-local-video"
                            className={`w-full h-full object-cover transform scale-x-[-1] ${isCameraOff ? 'hidden' : 'block'}`}
                            autoPlay playsInline muted
                        />
                        {isCameraOff && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="p-6 bg-black/50 rounded-full backdrop-blur-md">
                                    <svg className="w-12 h-12 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                </div>
                            </div>
                        )}

                        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                            <button onClick={() => setFiltersOpen(!filtersOpen)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                            </button>
                            <button onClick={() => setIsMuted(!isMuted)} className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center text-white transition-all border border-white/10 ${isMuted ? 'bg-red-500/80' : 'bg-black/40 hover:bg-white/20'}`}>
                                {isMuted ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
                            </button>
                            <button onClick={() => setIsCameraOff(!isCameraOff)} className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center text-white transition-all border border-white/10 ${isCameraOff ? 'bg-red-500/80' : 'bg-black/40 hover:bg-white/20'}`}>
                                {isCameraOff ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 bg-[#1a1a1a] rounded-3xl overflow-hidden relative border border-white/5 shadow-2xl group/remote">
                        <video
                            id="desktop-remote-video"
                            className={`w-full h-full object-cover transition-opacity duration-500 ${isConnected ? 'opacity-100' : 'opacity-0'}`}
                            autoPlay playsInline
                        />

                        {(!isConnected) && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-10">
                                {isSearching ? (
                                    <div className="relative">
                                        <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-blue-400 to-green-400 animate-pulse blur-xl opacity-20 absolute inset-0 m-auto"></div>
                                        <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-[#3b82f6] to-[#10b981] flex items-center justify-center shadow-2xl relative z-10 animate-float text-6xl">
                                            <span role="img" aria-label="Globe">🌍</span>
                                        </div>
                                        <p className="font-display font-bold text-2xl mt-8 text-center text-white/90">Finding your next match...</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="text-6xl mb-6 grayscale opacity-30">
                                            <span role="img" aria-label="Wave">👋</span>
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Ready to meet?</h3>
                                        <p className="text-gray-400">Click arrow or press &rarr; to start</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {isConnected && (
                            <div className="absolute top-4 left-4 flex items-center gap-3 z-20">
                                <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center text-sm font-bold">
                                    {partnerCountryCode || '?'}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-white shadow-black drop-shadow-md text-sm">{partnerCountry || 'Stranger'}</span>
                                    {partnerCountry && (
                                        <div className="flex items-center gap-1 text-[10px] text-white/80 font-medium bg-black/30 px-1.5 py-0.5 rounded">
                                            <span>{partnerCountry}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className={`absolute bottom-4 right-4 z-20 w-80 max-w-[90%] max-h-[60%] flex flex-col transition-all duration-300 ${showChat ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                            <div className="bg-black/30 backdrop-blur-md rounded-2xl overflow-hidden border border-white/5 shadow-2xl flex flex-col h-full ring-1 ring-white/5">
                                <div className="flex-1 overflow-hidden">
                                    <ChatBox messages={messages} onSendMessage={handleSendMessage} isConnected={isConnected} minimal={true} showScrollbar={true} />
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-4 right-4 z-10">
                            {!showChat && isConnected && (
                                <button onClick={() => setShowChat(true)} className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/10 shadow-lg transition-all">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                    {messages.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-black"></span>}
                                </button>
                            )}
                        </div>

                        {showChat && (
                            <button onClick={() => setShowChat(false)} className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-md">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>
                </div>

                <div className="h-24 shrink-0 flex items-center justify-between px-12 bg-black/40 rounded-t-3xl border-t border-white/5">

                    <button onClick={onLeave} className="group flex items-center gap-4 text-white hover:text-red-400 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center font-mono text-sm font-bold group-hover:border-red-500/50 group-hover:bg-red-500/10 transition-all">
                            esc
                        </div>
                        <span className="font-bold text-lg hidden sm:block">End Video Chat</span>
                    </button>

                    {!isConnected && !isSearching && <span className="text-gray-500 font-medium">Safe & Secure • 100% Free</span>}

                    <button onClick={handleNext} className="group flex items-center gap-4 text-white hover:text-[#FF8ba7] transition-colors">
                        <span className="font-bold text-lg hidden sm:block">Next Video Chat</span>
                        <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center group-hover:border-[#FF8ba7]/50 group-hover:bg-[#FF8ba7]/10 transition-all">
                            <ArrowRightIcon className="w-5 h-5" />
                        </div>
                    </button>
                </div>
            </div>

        </div>
    );
}


