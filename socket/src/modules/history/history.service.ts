import { Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { getUserIdFromToken } from '../../core/utils/jwt.utils';
import { userService } from '../../shared/services/user.service';
import { logger } from '../../core/logger';

const API_URL = process.env.API_SERVICE_URL || 'http://nozorin_api:3001';

export const historyService = {
    async getHistory(userId: string, limit: number) {
        const res = await fetch(`${API_URL}/api/history/${userId}?limit=${limit}`);
        return res.json();
    },
    async getHistoryStats(userId: string) {
        const res = await fetch(`${API_URL}/api/history/${userId}/stats`);
        return res.json();
    },
    async clearHistory(userId: string) {
        await fetch(`${API_URL}/api/history/${userId}`, { method: 'DELETE' });
    },
    async startSession(userId: string, data: Record<string, unknown>) {
        await fetch(`${API_URL}/api/history/${userId}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    },
    async endSession(userId: string, reason?: string) {
        await fetch(`${API_URL}/api/history/${userId}/sessions/end`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
        });
    },
};

export const register = (_io: unknown, socket: Socket): void => {
    socket.on(SocketEvents.GET_HISTORY, async (data: { token: string; limit?: number }) => {
        const { token, limit = 20 } = data;
        if (!token) { socket.emit(SocketEvents.HISTORY_ERROR, { message: 'Token required' }); return; }

        const userId = getUserIdFromToken(token);
        if (!userId) { socket.emit(SocketEvents.HISTORY_ERROR, { message: 'Invalid token' }); return; }

        const isRegistered = await userService.isUserRegistered(userId);
        if (!isRegistered) { socket.emit(SocketEvents.HISTORY_ERROR, { message: 'Invalid token' }); return; }

        try {
            const history = await historyService.getHistory(userId, limit);
            const partnerIds = [...new Set((history as any[]).map(s => s.partnerId).filter((id: string) => id && id !== 'unknown'))];
            const statuses = await userService.getUserStatuses(partnerIds as string[]);
            const enhanced = (history as any[]).map(s => ({
                ...s,
                partnerStatus: s.partnerId && s.partnerId !== 'unknown' ? statuses[s.partnerId] : { isOnline: false, lastSeen: 0 },
            }));
            socket.emit(SocketEvents.HISTORY_DATA, { history: enhanced });
            logger.info({ userId: userId.substring(0, 8), count: history.length }, '[HISTORY] Sent history');
        } catch (err) {
            logger.error({ err }, '[HISTORY] Failed to retrieve history');
            socket.emit(SocketEvents.HISTORY_ERROR, { message: 'Failed to retrieve history' });
        }
    });

    socket.on(SocketEvents.GET_HISTORY_STATS, async (data: { token: string }) => {
        const { token } = data;
        if (!token) { socket.emit(SocketEvents.HISTORY_STATS_ERROR, { message: 'Token required' }); return; }
        const userId = getUserIdFromToken(token);
        if (!userId) { socket.emit(SocketEvents.HISTORY_STATS_ERROR, { message: 'Invalid token' }); return; }
        const isRegistered = await userService.isUserRegistered(userId);
        if (!isRegistered) { socket.emit(SocketEvents.HISTORY_STATS_ERROR, { message: 'Invalid token' }); return; }
        try {
            const stats = await historyService.getHistoryStats(userId);
            socket.emit(SocketEvents.HISTORY_STATS, stats);
        } catch (err) {
            logger.error({ err }, '[HISTORY] Failed to retrieve stats');
            socket.emit(SocketEvents.HISTORY_STATS_ERROR, { message: 'Failed to retrieve stats' });
        }
    });

    socket.on(SocketEvents.CLEAR_HISTORY, async (data: { token: string }) => {
        const { token } = data;
        if (!token) { socket.emit(SocketEvents.HISTORY_CLEAR_ERROR, { message: 'Token required' }); return; }
        const userId = getUserIdFromToken(token);
        if (!userId) { socket.emit(SocketEvents.HISTORY_CLEAR_ERROR, { message: 'Invalid token' }); return; }
        const isRegistered = await userService.isUserRegistered(userId);
        if (!isRegistered) { socket.emit(SocketEvents.HISTORY_CLEAR_ERROR, { message: 'Invalid token' }); return; }
        try {
            await historyService.clearHistory(userId);
            socket.emit(SocketEvents.HISTORY_CLEARED);
            logger.info({ userId: userId.substring(0, 8) }, '[HISTORY] Cleared');
        } catch (err) {
            logger.error({ err }, '[HISTORY] Failed to clear');
            socket.emit(SocketEvents.HISTORY_CLEAR_ERROR, { message: 'Failed to clear history' });
        }
    });
};
