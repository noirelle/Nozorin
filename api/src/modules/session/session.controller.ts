import { Request, Response } from 'express';
import { sessionService } from './session.service';

export const sessionController = {
    async getHistory(req: Request, res: Response) {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ error: 'User ID required' });
        try {
            const data = await sessionService.getHistory(userId);
            res.json({
                status: 'success',
                data,
                message: 'History fetched successfully'
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch history' });
        }
    },

    async deleteHistory(req: Request, res: Response) {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ error: 'User ID required' });
        try {
            await sessionService.deleteHistory(userId);
            res.status(200).json({
                status: 'success',
                message: 'History deleted successfully'
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete history' });
        }
    },

    async getActiveCall(req: Request, res: Response) {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        try {
            const data = await sessionService.getActiveSession(userId);
            if (!data) {
                return res.status(404).json({
                    status: 'error',
                    message: 'No active session found'
                });
            }

            res.json({
                status: 'success',
                data,
                message: 'Active session retrieved'
            });
        } catch (error) {
            console.error('[SESSION] Error getting active call:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getCurrentSession(req: Request, res: Response) {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        try {
            const data = await sessionService.getCurrentSessionStatus(userId);
            res.json({
                status: 'success',
                data,
                message: 'Current session status retrieved'
            });
        } catch (error) {
            console.error('[SESSION] Error getting current session:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
