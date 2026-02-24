import { Request, Response } from 'express';
import { sessionService } from './session.service';

export const sessionController = {
    async getHistory(req: Request, res: Response) {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ error: 'User ID required' });
        try {
            const history = await sessionService.getHistory(userId);
            res.json(history);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch history' });
        }
    },

    async deleteHistory(req: Request, res: Response) {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ error: 'User ID required' });
        try {
            await sessionService.clearHistory(userId);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Failed to clear history' });
        }
    },

    async getStats(req: Request, res: Response) {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ error: 'User ID required' });
        try {
            const stats = await sessionService.getStats(userId);
            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch stats' });
        }
    }
};
