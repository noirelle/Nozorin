import { Socket } from 'socket.io';
import { historyService } from '../services/historyService';
import { getUserIdFromToken, verifyVisitorToken } from '../utils/jwtUtils';

/**
 * Handle history-related socket events
 */
export const handleHistoryEvents = (socket: Socket) => {

    /**
     * Get session history for the current user
     */
    socket.on('get-history', async (data: { token: string; limit?: number }) => {
        const { token, limit = 20 } = data;

        if (!token) {
            socket.emit('history-error', { message: 'Token required' });
            return;
        }

        const userId = getUserIdFromToken(token);
        if (!userId) {
            socket.emit('history-error', { message: 'Invalid token' });
            return;
        }

        try {
            const history = await historyService.getHistory(userId, limit);
            socket.emit('history-data', { history });
            console.log(`[HISTORY] Sent ${history.length} sessions to user ${userId.substring(0, 8)}...`);
        } catch (error) {
            console.error('[HISTORY] Error retrieving history:', error);
            socket.emit('history-error', { message: 'Failed to retrieve history' });
        }
    });

    /**
     * Get history statistics
     */
    socket.on('get-history-stats', async (data: { token: string }) => {
        const { token } = data;

        if (!token) {
            socket.emit('history-stats-error', { message: 'Token required' });
            return;
        }

        const userId = getUserIdFromToken(token);
        if (!userId) {
            socket.emit('history-stats-error', { message: 'Invalid token' });
            return;
        }

        try {
            const stats = await historyService.getHistoryStats(userId);
            socket.emit('history-stats', stats);
            console.log(`[HISTORY] Sent stats to user ${userId.substring(0, 8)}...`);
        } catch (error) {
            console.error('[HISTORY] Error retrieving stats:', error);
            socket.emit('history-stats-error', { message: 'Failed to retrieve stats' });
        }
    });

    /**
     * Clear session history
     */
    socket.on('clear-history', async (data: { token: string }) => {
        const { token } = data;

        if (!token) {
            socket.emit('history-clear-error', { message: 'Token required' });
            return;
        }

        const userId = getUserIdFromToken(token);
        if (!userId) {
            socket.emit('history-clear-error', { message: 'Invalid token' });
            return;
        }

        try {
            await historyService.clearHistory(userId);
            socket.emit('history-cleared');
            console.log(`[HISTORY] Cleared history for user ${userId.substring(0, 8)}...`);
        } catch (error) {
            console.error('[HISTORY] Error clearing history:', error);
            socket.emit('history-clear-error', { message: 'Failed to clear history' });
        }
    });
};
