import { getSocketClient } from '../core/socketClient';
import { SocketEvents } from '../core/socketEvents';
import {
    EndCallPayload,
    RejoinCallPayload,
    SignalStrengthPayload,
    OfferPayload,
    AnswerPayload,
    IceCandidatePayload,
} from './matching.types';

export function emitMatchReady(): void {
    const socket = getSocketClient();
    if (!socket) return void console.warn('[Socket] Client not ready, cannot emit match-ready');
    socket.emit(SocketEvents.MATCH_READY);
}

export function emitEndCall(target: string | null): void {
    const socket = getSocketClient();
    if (!socket) return void console.warn('[Socket] Client not ready, cannot emit end-call');
    const payload: EndCallPayload = { target };
    socket.emit(SocketEvents.END_CALL, payload, (ack: { success: boolean }) => {
        if (!ack?.success) console.error('[Socket] end-call not acknowledged', payload);
    });
}

export function emitRejoinCall(roomId?: string): void {
    const socket = getSocketClient();
    if (!socket) return void console.warn('[Socket] Client not ready, cannot emit rejoin-call');
    const payload: RejoinCallPayload = { roomId };
    socket.emit(SocketEvents.REJOIN_CALL, payload);
}

export function emitCancelReconnect(): void {
    const socket = getSocketClient();
    if (!socket) return void console.warn('[Socket] Client not ready, cannot emit cancel-reconnect');
    socket.emit(SocketEvents.CANCEL_RECONNECT);
}

export function emitOffer(target: string, sdp: RTCSessionDescriptionInit): void {
    const socket = getSocketClient();
    if (!socket) return void console.warn('[Socket] Client not ready, cannot emit offer');
    const payload: OfferPayload = { target, sdp };
    socket.emit(SocketEvents.OFFER, payload);
}

export function emitAnswer(target: string, sdp: RTCSessionDescriptionInit): void {
    const socket = getSocketClient();
    if (!socket) return void console.warn('[Socket] Client not ready, cannot emit answer');
    const payload: AnswerPayload = { target, sdp };
    socket.emit(SocketEvents.ANSWER, payload);
}

export function emitIceCandidate(target: string, candidate: RTCIceCandidateInit): void {
    const socket = getSocketClient();
    if (!socket) return void console.warn('[Socket] Client not ready, cannot emit ice-candidate');
    const payload: IceCandidatePayload = { target, candidate };
    socket.emit(SocketEvents.ICE_CANDIDATE, payload);
}

export function emitSignalStrength(
    target: string,
    strength: 'good' | 'fair' | 'poor' | 'reconnecting'
): void {
    const socket = getSocketClient();
    if (!socket) return void console.warn('[Socket] Client not ready, cannot emit signal-strength');
    const payload: SignalStrengthPayload = { target, strength };
    socket.emit(SocketEvents.SIGNAL_STRENGTH, payload);
}
