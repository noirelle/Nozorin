'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Room from '@/features/call-room/components/Room';
import { HistoryDrawer } from '@/features/call-room/components/HistoryDrawer';
import { FriendsDrawer } from '@/features/call-room/components/FriendsDrawer';
import { useHistory, useUser, useDirectCall, useFriends } from '@/hooks';
import { useSocketEvent, SocketEvents, connectSocket, updateSocketAuth, isSocketIdentified } from '@/lib/socket';
import { getSocketClient } from '@/lib/socket/core/socketClient';
import { IncomingCallOverlay } from '@/features/direct-call/components/IncomingCallOverlay';
import { OutgoingCallOverlay } from '@/features/direct-call/components/OutgoingCallOverlay';
import { WelcomeScreen } from '@/features/auth/components/WelcomeScreen';

export default function AppPage() {
    const router = useRouter();
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isFriendsOpen, setIsFriendsOpen] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [directMatchData, setDirectMatchData] = useState<any>(null);

    const handleCloseHistory = useCallback(() => {
        setIsHistoryOpen(false);
    }, []);

    // History hooks
    const { token, ensureToken, user, isChecking, refreshUser } = useUser();

    const {
        history,
        stats,
        isLoading,
        error,
        fetchHistory,
        fetchStats,
        clearHistory
    } = useHistory(token, user?.id, async () => null);

    // check for pending match data from landing page
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const pending = sessionStorage.getItem('pendingMatch');
            if (pending) {
                try {
                    const data = JSON.parse(pending);
                    console.log('[App] Found pending match data, initializing room...');
                    setDirectMatchData(data);
                    // Clear it so we don't re-use it on refresh unless desired
                    sessionStorage.removeItem('pendingMatch');
                } catch (e) {
                    console.error('[App] Failed to parse pending match data', e);
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
    } = useDirectCall(handleCloseHistory);

    // Friend System hook
    const {
        friends,
        pendingRequests,
        sendRequest,
        acceptRequest,
        declineRequest,
        removeFriend,
        isLoading: isLoadingFriendsData
    } = useFriends(token);

    const handleAddFriend = useCallback(async (targetId: string) => {
        const result = await sendRequest(targetId);
        if (result.success) {
            alert('Friend request sent!');
        } else {
            alert(`Failed to send request: ${result.error}`);
        }
    }, [sendRequest]);

    // Handle successful match-found for direct calls (via useSocketEvent)
    const handleMatchFound = useCallback((data: any) => {
        setIsHistoryOpen(false);
        clearCallState();
        console.log('[App] Match found via direct call, ensuring room readiness...');
        setDirectMatchData(data);
    }, [clearCallState]);

    const handleIdentifySuccess = useCallback(() => {
        console.log('[App] Identification successful');
    }, []);

    const handleAuthError = useCallback((error: any) => {
        console.error('[App] Socket authentication error:', error);
    }, []);

    useSocketEvent(SocketEvents.MATCH_FOUND, handleMatchFound);
    useSocketEvent(SocketEvents.IDENTIFY_SUCCESS, handleIdentifySuccess);

    // Connect socket with token and identify
    useEffect(() => {
        if (!token) return;
        updateSocketAuth(token);
        const s = getSocketClient(token);
        if (s && !s.connected) {
            console.log('[App] Connecting socket with token...');
            connectSocket();
        }

        const identify = () => {
            if (token) {
                console.log('[App] Identifying socket...', s?.id);
                s?.emit(SocketEvents.USER_IDENTIFY, { token });
            }
        };

        const handleAuthError = async (err: any) => {
            const isAuthError = !err || Object.keys(err).length === 0 ||
                err?.message === 'Authentication error: Invalid token' ||
                err?.message === 'jwt expired' ||
                err?.message === 'Invalid or expired token';

            if (isAuthError) {
                console.log('[App] Socket token expired. Initiating seamless refresh...');
                const newToken = await refreshUser();
                if (newToken) {
                    console.log('[App] Seamless refresh successful. Updating socket auth...');
                    updateSocketAuth(newToken);
                    if (s?.connected) s?.emit(SocketEvents.UPDATE_TOKEN, { token: newToken });
                    else connectSocket();
                } else {
                    console.warn('[App] Token refresh failed permanently. Disconnecting socket.');
                    s?.disconnect();
                }
            } else {
                console.warn('[App] Socket encountered non-auth error:', err);
            }
        };

        const handleTokenUpdated = (data: { success: boolean }) => {
            if (data.success) console.log('[App] Socket token updated successfully (Graceful Refresh)');
        };

        if (s?.connected && token && !isSocketIdentified()) identify();

        const onFocus = () => { if (s?.connected && token) identify(); };
        const onStorageChange = (e: StorageEvent) => {
            if (e.key === 'nz_token') window.location.reload();
        };

        s?.on('connect', identify);
        s?.on(SocketEvents.AUTH_ERROR, handleAuthError);
        s?.on(SocketEvents.TOKEN_UPDATED, handleTokenUpdated);
        window.addEventListener('focus', onFocus);
        window.addEventListener('storage', onStorageChange);

        return () => {
            s?.off('connect', identify);
            s?.off(SocketEvents.AUTH_ERROR, handleAuthError);
            s?.off(SocketEvents.TOKEN_UPDATED, handleTokenUpdated);
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('storage', onStorageChange);
        };
    }, [token, refreshUser]);

    // Also ensure token on mount so we can join room logic
    useEffect(() => {
        ensureToken();
    }, [ensureToken]);


    const handleLeave = () => {
        setIsConnected(false);
        setDirectMatchData(null);
        const s = getSocketClient();
        if (s) s.disconnect();
        router.push('/');
    };

    const handleNavigateToHistory = () => {
        setIsHistoryOpen(true);
    };

    // Show loading or welcome screen - MOVED TO BOTTOM
    if (isChecking) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!user) {
        return <WelcomeScreen onSuccess={refreshUser} />;
    }

    return (
        <main className="min-h-screen bg-white font-sans selection:bg-pink-100">
            <Room
                mode="voice"
                onLeave={handleLeave}
                onNavigateToHistory={handleNavigateToHistory}
                onNavigateToFriends={() => setIsFriendsOpen(true)}
                initialMatchData={directMatchData}
                onConnectionChange={setIsConnected}
                onAddFriend={handleAddFriend}
                friends={friends}
                pendingRequests={pendingRequests}
            />

            {/* Global Overlays */}
            <HistoryDrawer
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                history={history}
                stats={stats}
                isLoading={isLoading}
                error={error}
                onClearHistory={clearHistory}
                onRefresh={() => {
                    fetchHistory();
                    fetchStats();
                }}
                onCall={(targetId: string) => initiateCall(targetId, 'voice')}
                onAddFriend={handleAddFriend}
                friends={friends}
                pendingRequests={pendingRequests}
                isConnected={isConnected}
            />

            <FriendsDrawer
                isOpen={isFriendsOpen}
                onClose={() => setIsFriendsOpen(false)}
                friends={friends}
                pendingRequests={pendingRequests}
                onAcceptRequest={acceptRequest}
                onDeclineRequest={declineRequest}
                onRemoveFriend={removeFriend}
                onCall={(targetId: string) => {
                    setIsFriendsOpen(false);
                    initiateCall(targetId, 'voice');
                }}
                isConnected={isConnected}
                isLoading={isLoadingFriendsData}
            />

            {incomingCall && (
                <IncomingCallOverlay
                    fromCountry={incomingCall.fromCountry}
                    fromCountryCode={incomingCall.fromCountryCode}
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


        </main>
    );
}
