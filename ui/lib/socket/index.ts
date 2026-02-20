// ── Core socket infrastructure ────────────────────────────────────────────────
export { getSocketClient, connectSocket, disconnectSocket, updateSocketAuth } from './socketClient';
export { SocketEvents } from './socketEvents';
export type { SocketEventName } from './socketEvents';
export { useSocketEvent } from './socketRegistry';

// ── Chat ──────────────────────────────────────────────────────────────────────
export type { SendMessagePayload, ReceiveMessagePayload } from './chat/chat.types';
export { emitSendMessage } from './chat/chat.actions';

// ── Matching & WebRTC ─────────────────────────────────────────────────────────
export type {
    StatsUpdatePayload,
    WaitingForMatchPayload,
    PrepareMatchPayload,
    MatchFoundPayload,
    MatchCancelledPayload,
    EndCallPayload,
    RejoinCallPayload,
    RejoinSuccessPayload,
    RejoinFailedPayload,
    PartnerReconnectingPayload,
    PartnerReconnectedPayload,
    OfferPayload,
    OfferReceivedPayload,
    AnswerPayload,
    AnswerReceivedPayload,
    IceCandidatePayload,
    IceCandidateReceivedPayload,
    SignalStrengthPayload,
    PartnerSignalStrengthPayload,
} from './matching/matching.types';
export {
    emitMatchReady,
    emitEndCall,
    emitRejoinCall,
    emitCancelReconnect,
    emitOffer,
    emitAnswer,
    emitIceCandidate,
    emitSignalStrength,
} from './matching/matching.actions';

// ── Media ─────────────────────────────────────────────────────────────────────
export type {
    UpdateMediaStatePayload,
    ToggleMutePayload,
    PartnerMuteStatePayload,
} from './media/media.types';
export { emitUpdateMediaState, emitToggleMute } from './media/media.actions';

// ── History & Presence ────────────────────────────────────────────────────────
export type {
    GetHistoryPayload,
    GetHistoryStatsPayload,
    ClearHistoryPayload,
    HistoryDataPayload,
    SessionRecord,
    HistoryStats,
    HistoryErrorPayload,
    MatchEstablishedPayload,
    SessionEndPayload,
    WatchUserStatusPayload,
    PartnerStatusChangePayload,
} from './history/history.types';
export {
    emitGetHistory,
    emitGetHistoryStats,
    emitClearHistory,
    emitMatchEstablished,
    emitSessionEnd,
    emitWatchUserStatus,
} from './history/history.actions';

// ── Friends ───────────────────────────────────────────────────────────────────
export type {
    FriendRequestReceivedPayload,
    FriendRequestAcceptedPayload,
} from './friends/friends.types';

// ── Direct Call ───────────────────────────────────────────────────────────────
export type {
    InitiateDirectCallPayload,
    IncomingCallPayload,
    RespondToCallPayload,
    CallErrorPayload,
    CancelCallPayload,
} from './direct-call/directCall.types';
export {
    emitInitiateCall,
    emitRespondToCall,
    emitCancelCall,
} from './direct-call/directCall.actions';
