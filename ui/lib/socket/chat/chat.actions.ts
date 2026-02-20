import { getSocketClient } from '../core/socketClient';
import { SocketEvents } from '../core/socketEvents';
import { SendMessagePayload } from './chat.types';

export function emitSendMessage(target: string, message: string): void {
    const socket = getSocketClient();
    if (!socket) return void console.warn('[Socket] Client not ready, cannot send message');

    const payload: SendMessagePayload = { target, message };
    socket.emit(SocketEvents.SEND_MESSAGE, payload, (ack: { success: boolean }) => {
        if (!ack?.success) console.error('[Socket] send-message not delivered', payload);
    });
}
