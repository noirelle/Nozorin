import { Socket } from 'socket.io';
import { SocketEvents } from '../socket.events';
import { historyService } from '../../modules/history/history.service';
import { getUserIdFromToken } from '../../core/utils/jwt.utils';
import { userService } from '../../modules/user/user.service';

export const handleHistoryEvents = (socket: Socket) => {
    /**
     * Get session history for the current user
     */
    socket.on(SocketEvents.GET_HISTORY, async (data: { token: string; limit?: number }) => {
        const { token, limit = 20 } = data;

        if (!token) {
            socket.emit(SocketEvents.HISTORY_ERROR, { message: 'Token required' });
            return;
        }

        const userId = getUserIdFromToken(token);
        if (!userId) {
            socket.emit(SocketEvents.HISTORY_ERROR, { message: 'Invalid token' });
            return;
        }

        const isRegistered = await userService.isUserRegistered(userId);
        if (!isRegistered) {
            console.warn(`[HISTORY] Unregistered user ${userId.substring(0, 8)} attempting to access history`);
            socket.emit(SocketEvents.HISTORY_ERROR, { message: 'Invalid token' });
            return;
        }

        try {
            const history = await historyService.getHistory(userId, limit);

            const partnerIds = [...new Set(history.map((s: any) => s.partnerId).filter((id: any) => id && id !== 'unknown'))] as string[];
            const statuses = await userService.getUserStatuses(partnerIds);

            const enhancedHistory = history.map((session: any) => ({
                ...session,
                partnerStatus: session.partnerId && session.partnerId !== 'unknown'
                    ? statuses[session.partnerId]
                    : { isOnline: false, lastSeen: 0 },
            }));

            socket.emit(SocketEvents.HISTORY_DATA, { history: enhancedHistory });
            console.log(`[HISTORY] Sent ${history.length} sessions (enhanced) to user ${userId.substring(0, 8)}...`);
        } catch (error) {
            console.error('[HISTORY] Error retrieving history:', error);
            socket.emit(SocketEvents.HISTORY_ERROR, { message: 'Failed to retrieve history' });
        }
    });

    /**
     * Get history statistics
     */
    socket.on(SocketEvents.GET_HISTORY_STATS, async (data: { token: string }) => {
        const { token } = data;

        if (!token) {
            socket.emit(SocketEvents.HISTORY_STATS_ERROR, { message: 'Token required' });
            return;
        }

        const userId = getUserIdFromToken(token);
        if (!userId) {
            socket.emit(SocketEvents.HISTORY_STATS_ERROR, { message: 'Invalid token' });
            return;
        }

        const isRegistered = await userService.isUserRegistered(userId);
        if (!isRegistered) {
            socket.emit(SocketEvents.HISTORY_STATS_ERROR, { message: 'Invalid token' });
            return;
        }

        try {
            const stats = await historyService.getHistoryStats(userId);
            socket.emit(SocketEvents.HISTORY_STATS, stats);
            console.log(`[HISTORY] Sent stats to user ${userId.substring(0, 8)}...`);
        } catch (error) {
            console.error('[HISTORY] Error retrieving stats:', error);
            socket.emit(SocketEvents.HISTORY_STATS_ERROR, { message: 'Failed to retrieve stats' });
        }
    });

    /**
     * Clear session history
     */
    socket.on(SocketEvents.CLEAR_HISTORY, async (data: { token: string }) => {
        const { token } = data;

        if (!token) {
            socket.emit(SocketEvents.HISTORY_CLEAR_ERROR, { message: 'Token required' });
            return;
        }

        const userId = getUserIdFromToken(token);
        if (!userId) {
            socket.emit(SocketEvents.HISTORY_CLEAR_ERROR, { message: 'Invalid token' });
            return;
        }

        const isRegistered = await userService.isUserRegistered(userId);
        if (!isRegistered) {
            socket.emit(SocketEvents.HISTORY_CLEAR_ERROR, { message: 'Invalid token' });
            return;
        }

        try {
            await historyService.clearHistory(userId);
            socket.emit(SocketEvents.HISTORY_CLEARED);
            console.log(`[HISTORY] Cleared history for user ${userId.substring(0, 8)}...`);
        } catch (error) {
            console.error('[HISTORY] Error clearing history:', error);
            socket.emit(SocketEvents.HISTORY_CLEAR_ERROR, { message: 'Failed to clear history' });
        }
    });
};
