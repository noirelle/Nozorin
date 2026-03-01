'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RightSidebar } from './RightSidebar';
import { VoiceGameRoom } from './VoiceGameRoom';
import { ArrowLeft } from 'lucide-react';

import { useHistory, useUser, useDirectCall, useFriends, useSession } from '@/hooks';
import { useSocketEvent, SocketEvents, connectSocket, updateSocketAuth, isSocketIdentified } from '@/lib/socket';
import { getSocketClient } from '@/lib/socket/core/socketClient';
import { IncomingCallOverlay } from '@/features/direct-call/components/IncomingCallOverlay';
import { OutgoingCallOverlay } from '@/features/direct-call/components/OutgoingCallOverlay';
import { WelcomeScreen } from '@/features/auth/components/WelcomeScreen';
import { FriendRequestNotification } from '@/features/friends/components/FriendRequestNotification';

interface DesktopVoiceLayoutProps { }

export const DesktopVoiceLayout = () => {
    const router = useRouter();
    const [isConnected, setIsConnected] = useState(false);
    const [directMatchData, setDirectMatchData] = useState<any>(null);
    const [friendRequestNotif, setFriendRequestNotif] = useState<any>(null);

    // History hooks
    const { token, ensureToken, user, isChecking, isChecked, refreshUser } = useUser();

    // Session hook
    const {
        isVerifyingSession,
        initialReconnecting,
        initialCallData,
        verifyActiveCallSession
    } = useSession();

    const hasVerifiedRef = useRef(false);
    useEffect(() => {
        if (isChecked && token && !hasVerifiedRef.current) {
            hasVerifiedRef.current = true;
            verifyActiveCallSession();
        }
    }, [isChecked, token, verifyActiveCallSession]);

    const {
        history,
        stats,
        isLoading,
        error,
        fetchHistory,
        clearHistory
    } = useHistory(token, user?.id, async () => null);

    // check for pending match data from landing page
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const pending = sessionStorage.getItem('pendingMatch');
            if (pending) {
                try {
                    const data = JSON.parse(pending);
                    console.log('[DesktopVoiceLayout] Found pending match data, initializing room...');
                    setDirectMatchData(data);
                    // Clear it so we don't re-use it on refresh unless desired
                    sessionStorage.removeItem('pendingMatch');
                } catch (e) {
                    console.error('[DesktopVoiceLayout] Failed to parse pending match data', e);
                }
            }
        }
    }, []);

    // Direct Call hook
    const {
        incomingCall,
        isCalling,
        error: callError,
        initiateCall,
        acceptCall: performAcceptCall,
        declineCall: performDeclineCall,
        cancelCall,
        clearCallState
    } = useDirectCall();

    // Friend System hook
    const {
        friends,
        pendingRequests,
        sentRequests,
        sendRequest,
        acceptRequest,
        declineRequest,
        removeFriend,
        isLoading: isLoadingFriendsData,
        fetchFriends,
        fetchPendingRequests,
        fetchSentRequests
    } = useFriends();

    useEffect(() => {
        if (token && user?.id) {
            fetchHistory();
            fetchFriends();
            fetchPendingRequests();
            fetchSentRequests();
        }
    }, [token, user?.id, fetchHistory, fetchFriends, fetchPendingRequests, fetchSentRequests]);

    const handleAddFriend = useCallback(async (targetId: string) => {
        const result = await sendRequest(targetId);
        if (result.success) {
            console.log('Friend request sent!');
        } else {
            console.error(`Failed to send request: ${result.error}`);
        }
    }, [sendRequest]);

    // Handle successful match-found for direct calls
    const handleMatchFound = useCallback((data: any) => {
        clearCallState();
        console.log('[DesktopVoiceLayout] Match found via direct call, ensuring room readiness...');
        setDirectMatchData(data);
    }, [clearCallState]);

    const handleIdentifySuccess = useCallback(() => {
        console.log('[DesktopVoiceLayout] Identification successful');
    }, []);

    const handleFriendRequestReceived = useCallback((data: any) => {
        console.log('[DesktopVoiceLayout] Friend request received:', data);
        setFriendRequestNotif({
            ...data.profile,
            country: data.profile.country
        });
        // No longer checking isFriendsOpen, always refresh if a request comes in
        fetchPendingRequests();
        fetchSentRequests();
    }, [fetchPendingRequests, fetchSentRequests]);

    const handleFriendRequestAccepted = useCallback((data: any) => {
        console.log('[DesktopVoiceLayout] Friend request accepted:', data);
        setFriendRequestNotif({ ...data.friend, isAcceptance: true });
        fetchFriends();
        fetchPendingRequests();
        fetchSentRequests();
    }, [fetchFriends, fetchPendingRequests, fetchSentRequests]);

    const handleFriendRemoved = useCallback((data: any) => {
        console.log('[DesktopVoiceLayout] Friend removed:', data);
        fetchFriends();
    }, [fetchFriends]);

    useSocketEvent(SocketEvents.MATCH_FOUND, handleMatchFound);
    useSocketEvent(SocketEvents.IDENTIFY_SUCCESS, handleIdentifySuccess);
    useSocketEvent(SocketEvents.FRIEND_REQUEST_RECEIVED, handleFriendRequestReceived);
    useSocketEvent(SocketEvents.FRIEND_REQUEST_ACCEPTED, handleFriendRequestAccepted);
    useSocketEvent(SocketEvents.FRIEND_REMOVED, handleFriendRemoved);

    // Refresh history on session events
    useSocketEvent(SocketEvents.CALL_ENDED, fetchHistory);
    useSocketEvent(SocketEvents.MATCH_FOUND, fetchHistory);
    useSocketEvent(SocketEvents.SESSION_END, fetchHistory);
    useSocketEvent(SocketEvents.MATCH_CANCELLED, fetchHistory);

    const identifySocket = useCallback(() => {
        if (!token) return;
        const s = getSocketClient(token);
        if (s) {
            console.log('[DesktopVoiceLayout] Identifying socket...', s.id);
            s.emit(SocketEvents.USER_IDENTIFY, { token });
        }
    }, [token]);

    // Connect socket with token and identify
    useEffect(() => {
        if (!token) return;
        updateSocketAuth(token);
        const s = getSocketClient(token);
        if (s && !s.connected) {
            connectSocket();
        }

        const handleAuthError = async (err: any) => {
            const isAuthError = !err || Object.keys(err).length === 0 ||
                err?.message === 'Authentication error: Invalid token' ||
                err?.message === 'jwt expired' ||
                err?.message === 'Invalid or expired token';

            if (isAuthError) {
                const newToken = await refreshUser();
                if (newToken) {
                    updateSocketAuth(newToken);
                    if (s?.connected) s?.emit(SocketEvents.UPDATE_TOKEN, { token: newToken });
                    else connectSocket();
                } else {
                    s?.disconnect();
                }
            }
        };

        const handleTokenUpdated = (data: { success: boolean }) => {
            if (data.success) console.log('[DesktopVoiceLayout] Socket token updated successfully');
        };

        if (s?.connected && token && !isSocketIdentified()) identifySocket();

        const onFocus = () => { if (s?.connected && token && !isSocketIdentified()) identifySocket(); };
        const onStorageChange = (e: StorageEvent) => {
            if (e.key === 'nz_token') window.location.reload();
        };

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

    useEffect(() => {
        ensureToken();
    }, [ensureToken]);

    const handleLeave = () => {
        setIsConnected(false);
        setDirectMatchData(null);
        const s = getSocketClient();
        if (s) s.disconnect();

        router.push('/app');
    };

    if (isChecking || isVerifyingSession) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#fdfbfc]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-500/20 border-t-pink-500"></div>
            </div>
        );
    }

    if (!user) {
        return <WelcomeScreen onSuccess={refreshUser} />;
    }

    const isWebRTCAvailable = true; // Placeholder for WebRTC availability check

    return (
        <>
            {/* Main Feed Container */}
            <main className="flex-1 ml-[72px] flex justify-center">
                <div className="w-full max-w-[935px] flex">
                    {/* Content Column */}
                    <div className="flex-1 max-w-[630px] pt-8 px-8">
                        <div className="flex flex-col h-full">
                            <div className="mb-8 flex items-center gap-4">
                                <button
                                    onClick={handleLeave}
                                    className="p-2 hover:bg-pink-50 text-zinc-900 rounded-full transition-colors"
                                >
                                    <ArrowLeft className="w-6 h-6" />
                                </button>
                            </div>
                            <VoiceGameRoom
                                onLeave={handleLeave}
                                onNavigateToHistory={() => { }}
                                onNavigateToFriends={() => { }}
                                initialMatchData={directMatchData}
                                onConnectionChange={setIsConnected}
                                onAddFriend={handleAddFriend}
                                friends={friends}
                                pendingRequests={pendingRequests}
                                sentRequests={sentRequests}
                                initialReconnecting={initialReconnecting}
                                initialCallData={initialCallData}
                            />
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <RightSidebar
                        variant="voice"
                        history={history}
                        friends={friends}
                        pendingRequests={pendingRequests}
                        sentRequests={sentRequests}
                        onAcceptRequest={acceptRequest}
                        onDeclineRequest={declineRequest}
                        onAddFriend={handleAddFriend}
                        onCall={(targetId) => {
                            if (!isWebRTCAvailable) {
                                alert('Direct calling is not available yet.');
                                return;
                            }
                            initiateCall(targetId, 'voice');
                        }}
                        onRemoveFriend={removeFriend}
                    />
                </div>
            </main>

            {/* Floating Elements */}


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

            {friendRequestNotif && (
                <FriendRequestNotification
                    profile={friendRequestNotif}
                    isAcceptance={friendRequestNotif.isAcceptance}
                    onView={() => {
                        setFriendRequestNotif(null);
                        fetchFriends();
                        fetchPendingRequests();
                        fetchSentRequests();
                    }}
                    onClose={() => setFriendRequestNotif(null)}
                />
            )}
        </>
    );
};
