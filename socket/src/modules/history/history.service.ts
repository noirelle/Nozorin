import { AppDataSource } from '../../core/config/database.config';
import { CallHistory } from './history.entity';
import { logger } from '../../core/logger';
import { Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { getUserIdFromToken } from '../../core/utils/jwt.utils';
import { userService } from '../../shared/services/user.service';

export const historyService = {
    async getHistory(userId: string, limit: number = 15): Promise<CallHistory[]> {
        const repository = AppDataSource.getRepository(CallHistory);
        return repository.find({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
            take: limit
        });
    },

    async getHistoryStats(userId: string) {
        const repository = AppDataSource.getRepository(CallHistory);
        const records = await repository.find({ where: { user_id: userId } });

        const totalDuration = records.reduce((acc: number, curr: CallHistory) => acc + curr.duration, 0);
        const averageDuration = records.length > 0 ? Math.floor(totalDuration / records.length) : 0;
        const totalSessions = records.length;

        const countriesConnected = [...new Set(records.map((r: CallHistory) => r.partner_country).filter((c: string | null): c is string => !!c))];

        return {
            totalSessions,
            totalDuration,
            averageDuration,
            countriesConnected
        };
    },

    async clearHistory(userId: string) {
        const repository = AppDataSource.getRepository(CallHistory);
        await repository.delete({ user_id: userId });
    },

    async addHistory(data: Partial<CallHistory>) {
        try {
            const repository = AppDataSource.getRepository(CallHistory);

            // Add new record
            const newRecord = repository.create(data);
            await repository.save(newRecord);

            // Enforce 15-record limit per user (FIFO)
            const records = await repository.find({
                where: { user_id: (data as any).user_id },
                order: { created_at: 'DESC' }
            });

            if (records.length > 15) {
                const recordsToDelete = records.slice(15);
                await repository.remove(recordsToDelete);
            }

            return newRecord;
        } catch (err) {
            logger.error({ err, userId: (data as any).user_id }, '[HISTORY] Failed to add history record');
            return null;
        }
    }
};

export const register = (_io: unknown, socket: Socket): void => {
    socket.on(SocketEvents.GET_HISTORY, async (data: { token: string; limit?: number }) => {
        const { token, limit = 15 } = data;
        if (!token) { socket.emit(SocketEvents.HISTORY_ERROR, { message: 'Token required' }); return; }

        const userId = getUserIdFromToken(token);
        if (!userId) { socket.emit(SocketEvents.HISTORY_ERROR, { message: 'Invalid token' }); return; }

        const isRegistered = await userService.isUserRegistered(userId);
        if (!isRegistered) { socket.emit(SocketEvents.HISTORY_ERROR, { message: 'Invalid token' }); return; }

        try {
            const history = await historyService.getHistory(userId, limit);
            const partnerIds = [...new Set(history.map((s: CallHistory) => s.partner_id).filter((id): id is string => !!(id && id !== 'unknown')))];
            const statuses = await userService.getUserStatuses(partnerIds);

            const enhanced = history.map((s: CallHistory) => ({
                sessionId: s.id,
                partnerId: s.partner_id,
                partnerUsername: s.partner_username,
                partnerAvatar: s.partner_avatar,
                partnerCountry: s.partner_country,
                partnerCountryCode: s.partner_country_code,
                duration: s.duration,
                mode: s.mode,
                createdAt: s.created_at ? new Date(s.created_at).getTime() : 0,
                disconnectReason: s.reason,
                partnerStatus: s.partner_id && s.partner_id !== 'unknown' ? statuses[s.partner_id] : { isOnline: false, lastSeen: 0 },
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
