'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useHistory, useUser, useDirectCall, useFriends, useSession } from '@/hooks';
import { useUI } from '@/contexts/UIContext';
import { useSocketEvent, SocketEvents, connectSocket, updateSocketAuth, isSocketIdentified } from '@/lib/socket';
import { getSocketClient } from '@/lib/socket/core/socketClient';
import { useVoiceRoom } from '@/features/voice-room/hooks/voice-room/useVoiceRoom';

import { DesktopVoiceLayout } from '@/features/voice-room/components/DesktopVoiceLayout';
import { MobileVoiceLayout } from '@/features/voice-room/components/MobileVoiceLayout';
import { IncomingCallOverlay } from '@/features/direct-call/components/IncomingCallOverlay';
import { OutgoingCallOverlay } from '@/features/direct-call/components/OutgoingCallOverlay';
import { Notification } from '@/components/Notification';
import { DebugICEConsole } from '@/features/voice-room/components/DebugICEConsole';


export const VoiceGameRoom = () => {
    const router = useRouter();
    const [isConnected, setIsConnected] = useState(false);
    const [directMatchData, setDirectMatchData] = useState<any>(null);
    const [notification, setNotification] = useState<any>(null);
    const { isMobile } = useUI();
    const [searchTimer, setSearchTimer] = useState(0);



    const { token, ensureToken, user, isChecking, isChecked, refreshUser } = useUser();
    const { isVerifyingSession, initialReconnecting, initialCallData, verifyActiveCallSession } = useSession();

    // 1. History first, as other hooks and socket listeners depend on it
    const { history, fetchHistory } = useHistory(token, user?.id, async () => null);

    // 2. Voice Room Hook provides the media manager needed by direct calls
    const voiceRoomData = useVoiceRoom({
        onConnectionChange: setIsConnected,
        initialMatchData: directMatchData,
        initialReconnecting,
        initialCallData
    });

    // 3. Direct Call Hook can now safely use the media manager
    const { incomingCall, isCalling, error: callError, initiateCall, acceptCall: performAcceptCall, declineCall: performDeclineCall, cancelCall, clearCallState } = useDirectCall(voiceRoomData.initMediaManager);

    const { friends, pendingRequests, sentRequests, sendRequest, acceptRequest, declineRequest, cancelRequest, removeFriend, fetchFriends, fetchPendingRequests, fetchSentRequests } = useFriends({
        onFriendOnline: (friend) => {
            setNotification({ ...friend, type: 'online' });
        }
    });

    useEffect(() => {
        ensureToken();
    }, [ensureToken]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const pending = sessionStorage.getItem('pendingMatch');
            if (pending) {
                try {
                    const data = JSON.parse(pending);
                    setDirectMatchData(data);
                    sessionStorage.removeItem('pendingMatch');
                } catch (_e) {
                }
            }
        }
    }, []);

    const hasInitialized = useRef(false);

    const initializeAppData = useCallback(async () => {
        if (!token || !user?.id || hasInitialized.current) return;

        try {
            await Promise.all([
                fetchHistory(),
                fetchFriends(),
                fetchPendingRequests(),
                fetchSentRequests()
            ]);
            hasInitialized.current = true;
        } catch (_error) {
        }
    }, [token, user?.id, fetchHistory, fetchFriends, fetchPendingRequests, fetchSentRequests]);

    useEffect(() => {
        if (token && user?.id && !hasInitialized.current) {
            initializeAppData();
        }
    }, [token, user?.id, initializeAppData]);

    const handleAddFriend = useCallback(async (targetId: string, profile?: any) => {
        const result = await sendRequest(targetId);
        if (result.success) {
            setNotification({ ...(profile || { id: targetId, username: 'User' }), type: 'sent', isActor: true });
        } else {
        }
    }, [sendRequest]);

    const handleAcceptRequest = useCallback(async (requestId: string) => {
        const result = await acceptRequest(requestId);
        if (result.success) {
            const req = pendingRequests.find(r => r.id === requestId);
            if (req) setNotification({ ...req.user, type: 'accepted', isActor: true });
        }
    }, [acceptRequest, pendingRequests]);

    const handleCancelRequest = useCallback(async (requestId: string) => {
        const result = await cancelRequest(requestId);
        if (result.success) {
            const req = sentRequests.find(r => r.id === requestId);
            if (req) setNotification({ ...req.user, type: 'cancelled', isActor: true });
        }
    }, [cancelRequest, sentRequests]);

    const handleRemoveFriend = useCallback(async (friendId: string) => {
        const result = await removeFriend(friendId);
        if (result.success) {
            const friend = friends.find(f => f.id === friendId);
            if (friend) setNotification({ ...friend, type: 'removed', isActor: true });
        }
    }, [removeFriend, friends]);

    const handleMatchFound = useCallback((data: any) => {
        clearCallState();
        if (data.is_direct_call) {
            setDirectMatchData(data);
        } else {
            setDirectMatchData(null);
        }
    }, [clearCallState]);

    const handleIdentifySuccess = useCallback(() => {
    }, []);

    const handleFriendRequestReceived = useCallback((data: any) => {
        setNotification({ ...data.profile, country: data.profile.country, type: 'received' });
        fetchPendingRequests(); // Already silent as it doesn't set isLoading
        fetchSentRequests();    // Already silent as it doesn't set isLoading
    }, [fetchPendingRequests, fetchSentRequests]);

    const handleFriendRequestAccepted = useCallback((data: any) => {
        setNotification({ ...data.friend, type: 'accepted' });
        fetchFriends(true);
        fetchPendingRequests();
        fetchSentRequests();
    }, [fetchFriends, fetchPendingRequests, fetchSentRequests]);

    const handleFriendRemoved = useCallback(() => { fetchFriends(true); }, [fetchFriends]);

    useSocketEvent(SocketEvents.MATCH_FOUND, handleMatchFound);
    useSocketEvent(SocketEvents.IDENTIFY_SUCCESS, handleIdentifySuccess);
    useSocketEvent(SocketEvents.FRIEND_REQUEST_RECEIVED, handleFriendRequestReceived);
    useSocketEvent(SocketEvents.FRIEND_REQUEST_ACCEPTED, handleFriendRequestAccepted);
    useSocketEvent(SocketEvents.FRIEND_REMOVED, handleFriendRemoved);
    useSocketEvent(SocketEvents.CALL_ENDED, () => fetchHistory(true));
    useSocketEvent(SocketEvents.MATCH_FOUND, () => fetchHistory(true));
    useSocketEvent(SocketEvents.SESSION_END, () => fetchHistory(true));
    useSocketEvent(SocketEvents.MATCH_CANCELLED, () => fetchHistory(true));

    const identifySocket = useCallback(() => {
        if (!token) return;
        const s = getSocketClient(token);
        if (s) {
            s.emit(SocketEvents.USER_IDENTIFY, { token });
        }
    }, [token]);

    useEffect(() => {
        if (!token) return;
        
        // updateSocketAuth(token) sets the token in the socket.auth object 
        // and handles re-identification if already connected.
        updateSocketAuth(token);
        
        const s = getSocketClient(token);
        if (s && !s.connected) connectSocket();

        const handleAuthError = async (err: any) => {
            const isAuthError = !err || Object.keys(err).length === 0 || err?.message === 'Authentication error: Invalid token' || err?.message === 'jwt expired' || err?.message === 'Invalid or expired token';
            if (isAuthError) {
                const newToken = await refreshUser();
                if (newToken) {
                    updateSocketAuth(newToken);
                } else {
                    s?.disconnect();
                }
            }
        };

        const handleTokenUpdated = () => {
        };

        // If s is connected but not identified, we need to identify
        if (s?.connected && token && !isSocketIdentified()) {
            identifySocket();
        }

        const onFocus = () => { 
            if (s?.connected && token && !isSocketIdentified()) {
                identifySocket(); 
            }
        };
        const onStorageChange = (e: StorageEvent) => { if (e.key === 'nz_token') window.location.reload(); };

        s?.on('connect', identifySocket);
        s?.on(SocketEvents.AUTH_ERROR, handleAuthError);
        s?.on(SocketEvents.TOKEN_UPDATED, handleTokenUpdated);
        window.addEventListener('focus', onFocus);
        window.addEventListener('storage', onStorageChange);

        return () => {
            s?.off('connect', identifySocket);
            s?.off(SocketEvents.AUTH_ERROR, handleAuthError);
            s?.off(SocketEvents.TOKEN_UPDATED, handleTokenUpdated);
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('storage', onStorageChange);
        };
    }, [token, refreshUser, identifySocket]);


    const handleLeave = () => {
        setIsConnected(false);
        setDirectMatchData(null);
        const s = getSocketClient();
        if (s) s.disconnect();
        router.push('/app');
    };

    const handleCloseNotif = useCallback(() => {
        setNotification(null);
    }, []);

    // Centralized Search Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        const isSearching = voiceRoomData.callRoomState.is_searching;
        const isConnected = voiceRoomData.callRoomState.is_connected;

        if (isSearching && !isConnected) {
            interval = setInterval(() => {
                setSearchTimer((prev) => prev + 1);
            }, 1000);
        } else {
            setSearchTimer(0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [voiceRoomData.callRoomState.is_searching, voiceRoomData.callRoomState.is_connected]);


    const layoutProps = {
        onLeave: handleLeave,
        history,
        friends,
        pendingRequests,
        sentRequests,
        onAcceptRequest: handleAcceptRequest,
        onDeclineRequest: declineRequest,
        onCancelRequest: handleCancelRequest,
        onAddFriend: handleAddFriend,
        onRemoveFriend: handleRemoveFriend,
        onCall: (targetId: string) => {
            if (!isWebRTCAvailable) { alert('Direct calling is not available yet.'); return; }
            initiateCall(targetId, 'voice');
        },
        voiceRoomData,
        directMatchData,
        setIsConnected,
        initialReconnecting,
        initialCallData,
        isConnected,
        searchTimer
    };

    const isWebRTCAvailable = true;

    return (
        <>
            <audio ref={voiceRoomData.remoteAudioRef} autoPlay />

            {isMobile ? (
                <MobileVoiceLayout {...layoutProps} />
            ) : (
                <DesktopVoiceLayout {...layoutProps} />
            )}

            {incomingCall && (
                <IncomingCallOverlay
                    from_username={incomingCall.from_username}
                    from_avatar={incomingCall.from_avatar}
                    from_country_name={incomingCall.from_country_name}
                    from_country={incomingCall.from_country}
                    mode={incomingCall.mode}
                    onAccept={performAcceptCall}
                    onDecline={performDeclineCall}
                    error={callError}
                />
            )}

            {isCalling && (
                <OutgoingCallOverlay
                    onCancel={cancelCall}
                    error={callError}
                />
            )}

            {notification && (
                <Notification
                    profile={notification}
                    type={notification.type}
                    isActor={notification.isActor}
                    onClose={handleCloseNotif}
                />
            )}

            {voiceRoomData.iceDebugData && process.env.NEXT_PUBLIC_ENABLE_ICE_DEBUG === 'true' && (
                <DebugICEConsole data={voiceRoomData.iceDebugData} />
            )}

        </>
    );
};

