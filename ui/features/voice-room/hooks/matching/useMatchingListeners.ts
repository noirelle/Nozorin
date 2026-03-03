import { useCallback } from 'react';
import { useSocketEvent, SocketEvents } from '../../../../lib/socket';
import {
    WaitingForMatchPayload,
    PrepareMatchPayload,
    MatchFoundPayload,
    MatchCancelledPayload,
    PartnerReconnectingPayload,
    PartnerReconnectedPayload,
    RejoinSuccessPayload,
} from '../../../../lib/socket/matching/matching.types';

interface UseMatchingListenersProps {
    handleWaitingForMatch: (data: WaitingForMatchPayload) => void;
    handlePrepareMatch: (data: PrepareMatchPayload) => void;
    handleMatchCancelled: (data: MatchCancelledPayload) => void;
    handleMatchFound: (data: MatchFoundPayload) => void;
    handleCallEnded: () => void;
    handlePartnerReconnecting: (data: PartnerReconnectingPayload) => void;
    handlePartnerReconnected: (data: PartnerReconnectedPayload) => void;
    handleRejoinSuccess: (data: RejoinSuccessPayload) => void;
    handleRejoinFailed: (data: { reason: string }) => void;
    handleUserLeft: (data: { socketId: string }) => void;
}

export const useMatchingListeners = ({
    handleWaitingForMatch,
    handlePrepareMatch,
    handleMatchCancelled,
    handleMatchFound,
    handleCallEnded,
    handlePartnerReconnecting,
    handlePartnerReconnected,
    handleRejoinSuccess,
    handleRejoinFailed,
    handleUserLeft,
}: UseMatchingListenersProps) => {
    useSocketEvent<WaitingForMatchPayload>(SocketEvents.WAITING_FOR_MATCH, handleWaitingForMatch);
    useSocketEvent<PrepareMatchPayload>(SocketEvents.PREPARE_MATCH, handlePrepareMatch);
    useSocketEvent<MatchCancelledPayload>(SocketEvents.MATCH_CANCELLED, handleMatchCancelled);
    useSocketEvent<MatchFoundPayload>(SocketEvents.MATCH_FOUND, handleMatchFound);
    useSocketEvent(SocketEvents.CALL_ENDED, handleCallEnded);
    useSocketEvent<PartnerReconnectingPayload>(SocketEvents.PARTNER_RECONNECTING, handlePartnerReconnecting);
    useSocketEvent<PartnerReconnectedPayload>(SocketEvents.PARTNER_RECONNECTED, handlePartnerReconnected);
    useSocketEvent<RejoinSuccessPayload>(SocketEvents.REJOIN_SUCCESS, handleRejoinSuccess);
    useSocketEvent<{ reason: string }>(SocketEvents.REJOIN_FAILED, handleRejoinFailed);
    useSocketEvent<{ socketId: string }>(SocketEvents.USER_LEFT, handleUserLeft);
};
