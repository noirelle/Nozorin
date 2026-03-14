'use client';

import React from 'react';
import { RightSidebar } from '@/components/RightSidebar';
import { DesktopVoiceFeed } from './DesktopVoiceFeed';
import { ArrowLeft } from 'lucide-react';

export const DesktopVoiceLayout = ({
    onLeave,
    history,
    friends,
    pendingRequests,
    sentRequests,
    onAcceptRequest,
    onDeclineRequest,
    onCancelRequest,
    onAddFriend,
    onRemoveFriend,
    onCall,
    voiceRoomData,
    directMatchData,
    setIsConnected,
    initialReconnecting,
    initialCallData,
    isConnected,
    searchTimer
}: any) => {

    return (
        <main className="flex-1 lg:ml-[72px] flex justify-center h-screen overflow-hidden">
            <div className="w-full max-w-[935px] flex h-full">
                {/* Content Column */}
                <div className="flex-1 max-w-[630px] pt-8 px-8 min-h-0">
                    <div className="flex flex-col h-full min-h-0">
                        <div className="mb-6 flex items-center h-10 shrink-0">
                            <button
                                onClick={onLeave}
                                className="hidden p-2 hover:bg-pink-50 text-zinc-900 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                        </div>
                        <DesktopVoiceFeed
                            onLeave={onLeave}
                            onNavigateToHistory={() => { }}
                            onNavigateToFriends={() => { }}
                            initialMatchData={directMatchData}
                            onConnectionChange={setIsConnected}
                            onAddFriend={onAddFriend}
                            onAcceptFriend={onAcceptRequest}
                            friends={friends}
                            pendingRequests={pendingRequests}
                            sentRequests={sentRequests}
                            initialReconnecting={initialReconnecting}
                            initialCallData={initialCallData}
                            voiceRoomData={voiceRoomData}
                            searchTimer={searchTimer}
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
                    onAcceptRequest={onAcceptRequest}
                    onDeclineRequest={onDeclineRequest}
                    onCancelRequest={onCancelRequest}
                    onAddFriend={onAddFriend}
                    onCall={onCall}
                    onRemoveFriend={onRemoveFriend}
                    isBusy={isConnected}
                />
            </div>
        </main>
    );
};
