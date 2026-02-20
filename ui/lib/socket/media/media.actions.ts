import { getSocketClient } from '../core/socketClient';
import { SocketEvents } from '../core/socketEvents';
import { UpdateMediaStatePayload, ToggleMutePayload } from './media.types';

export function emitUpdateMediaState(isMuted: boolean): void {
    const socket = getSocketClient();
    if (!socket) return void console.warn('[Socket] Client not ready, cannot emit update-media-state');
    const payload: UpdateMediaStatePayload = { isMuted };
    socket.emit(SocketEvents.UPDATE_MEDIA_STATE, payload);
}

export function emitToggleMute(target: string, isMuted: boolean): void {
    const socket = getSocketClient();
    if (!socket) return void console.warn('[Socket] Client not ready, cannot emit toggle-mute');
    const payload: ToggleMutePayload = { target, isMuted };
    socket.emit(SocketEvents.TOGGLE_MUTE, payload);
}
