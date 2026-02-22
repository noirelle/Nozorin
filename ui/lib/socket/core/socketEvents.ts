/**
 * Central registry of all socket event names used in the application.
 * Declared as a const object so values are accessible at runtime.
 */
export const SocketEvents = {
    // ── Connection ──────────────────────────────────────────────────────────
    CONNECT_ERROR: 'connect_error',
    IDENTIFY_SUCCESS: 'identify-success',
    USER_IDENTIFY: 'user-identify',
    UPDATE_TOKEN: 'update-token',
    FORCE_RECONNECT: 'force-reconnect',
    AUTH_ERROR: 'auth-error',
    TOKEN_UPDATED: 'token-updated',
    MULTI_SESSION: 'multi-session',

    // ── Matchmaking ──────────────────────────────────────────────────────────
    WAITING_FOR_MATCH: 'waiting-for-match',
    PREPARE_MATCH: 'prepare-match',
    MATCH_READY: 'match-ready',
    MATCH_FOUND: 'match-found',
    MATCH_CANCELLED: 'match-cancelled',
    END_CALL: 'end-call',
    CALL_ENDED: 'call-ended',
    REJOIN_CALL: 'rejoin-call',
    REJOIN_SUCCESS: 'rejoin-success',
    REJOIN_FAILED: 'rejoin-failed',
    CANCEL_RECONNECT: 'cancel-reconnect',
    PARTNER_RECONNECTING: 'partner-reconnecting',
    PARTNER_RECONNECTED: 'partner-reconnected',

    // ── WebRTC Signaling ─────────────────────────────────────────────────────
    OFFER: 'offer',
    ANSWER: 'answer',
    ICE_CANDIDATE: 'ice-candidate',
    SIGNAL_STRENGTH: 'signal-strength',
    PARTNER_SIGNAL_STRENGTH: 'partner-signal-strength',

    // ── Chat ─────────────────────────────────────────────────────────────────
    SEND_MESSAGE: 'send-message',
    RECEIVE_MESSAGE: 'receive-message',

    // ── Media State ───────────────────────────────────────────────────────────
    UPDATE_MEDIA_STATE: 'update-media-state',
    TOGGLE_MUTE: 'toggle-mute',
    PARTNER_MUTE_STATE: 'partner-mute-state',

    // ── History ───────────────────────────────────────────────────────────────
    GET_HISTORY: 'get-history',
    HISTORY_DATA: 'history-data',
    GET_HISTORY_STATS: 'get-history-stats',
    HISTORY_STATS: 'history-stats',
    CLEAR_HISTORY: 'clear-history',
    HISTORY_CLEARED: 'history-cleared',
    HISTORY_ERROR: 'history-error',
    HISTORY_STATS_ERROR: 'history-stats-error',
    HISTORY_CLEAR_ERROR: 'history-clear-error',

    // ── Presence / Session ────────────────────────────────────────────────────
    MATCH_ESTABLISHED: 'match-established',
    SESSION_END: 'session-end',
    WATCH_USER_STATUS: 'watch-user-status',
    PARTNER_STATUS_CHANGE: 'partner-status-change',

    // ── Stats ─────────────────────────────────────────────────────────────────
    STATS_UPDATE: 'stats-update',

    // ── Friends ───────────────────────────────────────────────────────────────
    FRIEND_REQUEST_RECEIVED: 'friend-request-received',
    FRIEND_REQUEST_ACCEPTED: 'friend-request-accepted',

    // ── Direct Call ───────────────────────────────────────────────────────────
    INITIATE_DIRECT_CALL: 'initiate-direct-call',
    INCOMING_CALL: 'incoming-call',
    RESPOND_TO_CALL: 'respond-to-call',
    CALL_CANCELLED_BY_CALLER: 'call-cancelled-by-caller',
    CALL_ERROR: 'call-error',
    CALL_DECLINED: 'call-declined',
    CANCEL_CALL: 'cancel-call',
} as const;

export type SocketEventName = typeof SocketEvents[keyof typeof SocketEvents];
