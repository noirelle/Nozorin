import { getSocketClient } from '../core/socketClient';
import { SocketEvents } from '../core/socketEvents';
import {
    InitiateDirectCallPayload,
    RespondToCallPayload,
    CancelCallPayload,
} from './directCall.types';

export function emitInitiateCall(target_user_id: string, mode: 'voice'): void {
    const socket = getSocketClient();
    if (!socket) return void console.warn('[Socket] Client not ready, cannot initiate direct call');
    const payload: InitiateDirectCallPayload = { target_user_id, mode };
    socket.emit(SocketEvents.INITIATE_DIRECT_CALL, payload, (ack: { success: boolean }) => {
        if (!ack?.success) console.error('[Socket] initiate-direct-call not acknowledged', payload);
    });
}

export function emitRespondToCall(
    caller_socket_id: string,
    accepted: boolean,
    mode: 'voice'
): void {
    const socket = getSocketClient();
    if (!socket) return void console.warn('[Socket] Client not ready, cannot respond to call');
    const payload: RespondToCallPayload = { caller_socket_id, accepted, mode };
    socket.emit(SocketEvents.RESPOND_TO_CALL, payload, (ack: { success: boolean }) => {
        if (!ack?.success) console.error('[Socket] respond-to-call not acknowledged', payload);
    });
}

export function emitCancelCall(target_user_id: string): void {
    const socket = getSocketClient();
    if (!socket) return void console.warn('[Socket] Client not ready, cannot cancel call');
    const payload: CancelCallPayload = { target_user_id };
    socket.emit(SocketEvents.CANCEL_CALL, payload, (ack: { success: boolean }) => {
        if (!ack?.success) console.error('[Socket] cancel-call not acknowledged', payload);
    });
}
