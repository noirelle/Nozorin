// ── Direct Call ───────────────────────────────────────────────────────────────

export interface InitiateDirectCallPayload {
    target_user_id: string;
    mode: 'voice';
}

export interface IncomingCallPayload {
    from_user_id: string;
    from_socket_id: string;
    from_username: string;
    from_avatar: string;
    from_gender: string;
    from_country: string;
    from_country_code: string;
    mode: 'voice';
}

export interface RespondToCallPayload {
    caller_socket_id: string;
    accepted: boolean;
    mode: 'voice';
}

export interface CallErrorPayload {
    message: string;
}

export interface CancelCallPayload {
    target_user_id: string;
}
