'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Room from '@/features/call-room/components/Room';
import { HistoryDrawer } from '@/features/call-room/components/HistoryDrawer';
import { FriendsDrawer } from '@/features/call-room/components/FriendsDrawer';
import { useHistory, useUser, useDirectCall, useFriends } from '@/hooks';
import { socket } from '@/lib/socket';
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
    } = useHistory(socket(), token, async () => null); // Removed regenerateToken

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
    } = useDirectCall(socket(), handleCloseHistory);

    // Friend System hook
    const {
        friends,
        pendingRequests,
        sendRequest,
        acceptRequest,
        declineRequest,
        removeFriend,
        isLoading: isLoadingFriendsData
    } = useFriends(socket(), token);

    const handleAddFriend = useCallback(async (targetId: string) => {
        const result = await sendRequest(targetId);
        if (result.success) {
            alert('Friend request sent!');
        } else {
            alert(`Failed to send request: ${result.error}`);
        }
    }, [sendRequest]);

    // Handle successful match-found for direct calls
    useEffect(() => {
        const s = socket();
        if (!s) return;

        const handleMatchFound = (data: any) => {
            // 1. Close history modal first for a smooth transition
            setIsHistoryOpen(false);
            // 2. Clear any active "Calling..." overlays immediately
            clearCallState();

            console.log('[App] Match found via direct call, ensuring room readiness...');
            // Store data to pass to Room component if needed for initial connection
            setDirectMatchData(data);
        };

        const handleIdentifySuccess = () => {
            console.log('[App] Identification successful');
        };

        const handleAuthError = (error: any) => {
            console.error('[App] Socket authentication error:', error);
            // Handle auth error, e.g., clear token, redirect to login
            // For now, just log it.
        };

        s.on('match-found', handleMatchFound);
        s.on('identify-success', handleIdentifySuccess);
        s.on('auth-error', handleAuthError);

        return () => {
            s.off('match-found', handleMatchFound);
            s.off('identify-success', handleIdentifySuccess);
            s.off('auth-error', handleAuthError);
        };
    }, []); // Run once on mount

    // Identify user to socket
    useEffect(() => {
        // Ensure socket is initialized with token
        const s = socket(token);
        if (!s) return;

        // If we have a token but socket is disconnected, connect now
        if (token && !s.connected) {
            console.log('[App] Connecting socket with token...');
            s.connect();
        }

        const identify = () => {
            if (token) {
                console.log('[App] Identifying socket...', s.id);
                // We still keep this for backward compatibility or explicit identification if needed,
                // but the middleware handles the main auth now.
                s.emit('user-identify', { token });
            }
        };

        const handleAuthError = async (err: any) => {
            console.error('[App] Socket authentication error:', err);
            // If error is related to expiration, try to refresh
            if (err?.message === 'Authentication error: Invalid token' || err?.message === 'jwt expired') {
                console.log('[App] Token invalid/expired, attempting refresh...');
                const newToken = await refreshUser();
                if (newToken) {
                    console.log('[App] Refresh successful, updating socket token...');
                    // Update socket auth for future reconnections
                    socket(newToken);
                    // Emit update-token to keep current connection alive if possible
                    s.emit('update-token', { token: newToken });
                } else {
                    console.warn('[App] Refresh failed, disconnecting socket.');
                    s.disconnect();
                }
            }
        };

        const handleTokenUpdated = (data: { success: boolean }) => {
            if (data.success) {
                console.log('[App] Socket token updated successfully (Graceful Refresh)');
            }
        };

        if (s.connected && token) {
            identify();
        }

        const onFocus = () => {
            console.log('[App] Re-verifying session on focus...');
            if (s.connected && token) identify();
        };

        const interval = setInterval(() => {
            if (s.connected && token) {
                identify();
            }
        }, 10000);

        const onStorageChange = (e: StorageEvent) => {
            if (e.key === 'nz_token') {
                console.log('[App] Visitor token changed in another tab, re-identifying...');
                window.location.reload();
            }
        };

        s.on('connect', identify);
        s.on('auth-error', handleAuthError);
        s.on('token-updated', handleTokenUpdated);

        window.addEventListener('focus', onFocus);
        window.addEventListener('storage', onStorageChange);

        return () => {
            s.off('connect', identify);
            s.off('auth-error', handleAuthError);
            s.off('token-updated', handleTokenUpdated);

            window.removeEventListener('focus', onFocus);
            window.removeEventListener('storage', onStorageChange);
            clearInterval(interval);
        };
    }, [token, refreshUser]);

    // Also ensure token on mount so we can join room logic
    useEffect(() => {
        ensureToken();
    }, [ensureToken]);


    const handleLeave = () => {
        setIsConnected(false);
        setDirectMatchData(null);
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
