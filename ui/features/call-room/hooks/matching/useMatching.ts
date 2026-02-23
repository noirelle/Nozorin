import { useCallback } from 'react';
import { useMatchingState, MatchStatus } from './useMatchingState';
import { useMatchingActions } from './useMatchingActions';
import { useMatchingListeners } from './useMatchingListeners';
import {
    MatchFoundPayload,
    PartnerReconnectingPayload,
    PartnerReconnectedPayload,
    RejoinSuccessPayload,
} from '../../../../lib/socket/matching/matching.types';

interface UseMatchingProps {
    onMatchFound?: (data: MatchFoundPayload) => void;
    onMatchCancelled?: (data: { reason: string }) => void;
    onCallEnded?: () => void;
    onPartnerReconnecting?: (data: PartnerReconnectingPayload) => void;
    onPartnerReconnected?: (data: PartnerReconnectedPayload) => void;
    onRejoinSuccess?: (data: RejoinSuccessPayload) => void;
    onRejoinFailed?: (data: { reason: string }) => void;
    onFatalError?: () => void;
}

export type { MatchStatus };

export const useMatching = (props: UseMatchingProps) => {
    const state = useMatchingState();
    const actions = useMatchingActions({ ...state, callbacks: props });

    useMatchingListeners({
        handleWaitingForMatch: useCallback(actions.buildHandleWaitingForMatch(), [actions.buildHandleWaitingForMatch]),
        handlePrepareMatch: useCallback(actions.buildHandlePrepareMatch(), [actions.buildHandlePrepareMatch]),
        handleMatchCancelled: useCallback(actions.buildHandleMatchCancelled(), [actions.buildHandleMatchCancelled]),
        handleMatchFound: useCallback(actions.buildHandleMatchFound(), [actions.buildHandleMatchFound]),
        handleCallEnded: useCallback(actions.buildHandleCallEnded(), [actions.buildHandleCallEnded]),
        handlePartnerReconnecting: useCallback(actions.buildHandlePartnerReconnecting(), [actions.buildHandlePartnerReconnecting]),
        handlePartnerReconnected: useCallback(actions.buildHandlePartnerReconnected(), [actions.buildHandlePartnerReconnected]),
        handleRejoinSuccess: useCallback(actions.buildHandleRejoinSuccess(), [actions.buildHandleRejoinSuccess]),
        handleRejoinFailed: useCallback(actions.buildHandleRejoinFailed(), [actions.buildHandleRejoinFailed]),
        handleIdentified: useCallback(actions.buildHandleIdentified(), [actions.buildHandleIdentified]),
    });

    return {
        startSearch: actions.startSearch,
        stopSearch: actions.stopSearch,
        endCall: actions.endCall,
        skipToNext: actions.skipToNext,
        rejoinCall: actions.rejoinCall,
        cancelReconnect: actions.cancelReconnect,
        status: state.status,
        position: state.position,
        isSkipping: state.isSkipping,
        reconnectCountdown: state.reconnectCountdown,
    };
};
