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
    }
};
