import { getSocketClient } from '../socketClient';
import { SocketEvents } from '../socketEvents';
import {
    GetHistoryPayload,
    GetHistoryStatsPayload,
    ClearHistoryPayload,
    MatchEstablishedPayload,
    SessionEndPayload,
    WatchUserStatusPayload,
} from './history.types';

export function emitGetHistory(token: string, limit: number = 20): void {
    const socket = getSocketClient();
    if (!socket) return void console.warn('[Socket] Client not ready, cannot emit get-history');
    const payload: GetHistoryPayload = { token, limit };
    socket.emit(SocketEvents.GET_HISTORY, payload);
}

export function emitGetHistoryStats(token: string): void {
    const socket = getSocketClient();
    if (!socket) return void console.warn('[Socket] Client not ready, cannot emit get-history-stats');
    const payload: GetHistoryStatsPayload = { token };
    socket.emit(SocketEvents.GET_HISTORY_STATS, payload);
}

export function emitClearHistory(token: string): void {
    const socket = getSocketClient();
    if (!socket) return void console.warn('[Socket] Client not ready, cannot emit clear-history');
    const payload: ClearHistoryPayload = { token };
    socket.emit(SocketEvents.CLEAR_HISTORY, payload);
}

export function emitMatchEstablished(
    token: string,
    partnerId: string,
    mode: 'chat' | 'voice'
): void {
    const socket = getSocketClient();
    if (!socket) return void console.warn('[Socket] Client not ready, cannot emit match-established');
    const payload: MatchEstablishedPayload = { token, partnerId, mode };
    socket.emit(SocketEvents.MATCH_ESTABLISHED, payload);
}

export function emitSessionEnd(
    token: string,
    reason?: SessionEndPayload['reason']
): void {
    const socket = getSocketClient();
    if (!socket) return void console.warn('[Socket] Client not ready, cannot emit session-end');
    const payload: SessionEndPayload = { token, reason };
    socket.emit(SocketEvents.SESSION_END, payload);
}

export function emitWatchUserStatus(userIds: string[]): void {
    const socket = getSocketClient();
    if (!socket) return void console.warn('[Socket] Client not ready, cannot emit watch-user-status');
    const payload: WatchUserStatusPayload = { userIds };
    socket.emit(SocketEvents.WATCH_USER_STATUS, payload);
}
