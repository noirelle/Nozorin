import { getSocketClient } from '../socketClient';
import { SocketEvents } from '../socketEvents';
import {
    InitiateDirectCallPayload,
    RespondToCallPayload,
    CancelCallPayload,
} from './directCall.types';

export function emitInitiateCall(targetUserId: string, mode: 'voice'): void {
    const socket = getSocketClient();
    if (!socket) return void console.warn('[Socket] Client not ready, cannot initiate direct call');
    const payload: InitiateDirectCallPayload = { targetUserId, mode };
    socket.emit(SocketEvents.INITIATE_DIRECT_CALL, payload, (ack: { success: boolean }) => {
        if (!ack?.success) console.error('[Socket] initiate-direct-call not acknowledged', payload);
    });
}

export function emitRespondToCall(
    callerSocketId: string,
    accepted: boolean,
    mode: 'voice'
): void {
    const socket = getSocketClient();
    if (!socket) return void console.warn('[Socket] Client not ready, cannot respond to call');
    const payload: RespondToCallPayload = { callerSocketId, accepted, mode };
    socket.emit(SocketEvents.RESPOND_TO_CALL, payload, (ack: { success: boolean }) => {
        if (!ack?.success) console.error('[Socket] respond-to-call not acknowledged', payload);
    });
}

export function emitCancelCall(targetUserId: string): void {
    const socket = getSocketClient();
    if (!socket) return void console.warn('[Socket] Client not ready, cannot cancel call');
    const payload: CancelCallPayload = { targetUserId };
    socket.emit(SocketEvents.CANCEL_CALL, payload, (ack: { success: boolean }) => {
        if (!ack?.success) console.error('[Socket] cancel-call not acknowledged', payload);
    });
}
