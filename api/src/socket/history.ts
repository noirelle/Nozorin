import { Socket } from 'socket.io';
import { historyService } from '../services/historyService';
import { getUserIdFromToken } from '../utils/jwtUtils';
import { userService } from '../services/userService';

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

        // Verify user exists in our current session store (DB/Redis)
        const isRegistered = await userService.isUserRegistered(userId);
        if (!isRegistered) {
            console.warn(`[HISTORY] Unregistered user ${userId.substring(0, 8)} attempting to access history`);
            socket.emit('history-error', { message: 'Invalid token' }); // Triggers client-side regen
            return;
        }

        try {
            const history = await historyService.getHistory(userId, limit);

            // Fetch statuses for all partners in the history
            const partnerIds = [...new Set(history.map((s: any) => s.partnerId).filter((id: any) => id && id !== 'unknown'))] as string[];
            const statuses = await userService.getUserStatuses(partnerIds);

            // Enhance history with status info
            const enhancedHistory = history.map((session: any) => ({
                ...session,
                partnerStatus: session.partnerId && session.partnerId !== 'unknown'
                    ? statuses[session.partnerId]
                    : { isOnline: false, lastSeen: 0 }
            }));

            socket.emit('history-data', { history: enhancedHistory });
            console.log(`[HISTORY] Sent ${history.length} sessions (enhanced) to user ${userId.substring(0, 8)}...`);
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

        // Verify user exists
        const isRegistered = await userService.isUserRegistered(userId);
        if (!isRegistered) {
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

        // Verify user exists
        const isRegistered = await userService.isUserRegistered(userId);
        if (!isRegistered) {
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
