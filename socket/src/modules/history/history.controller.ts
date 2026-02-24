import { Router, Request, Response } from 'express';
import { historyService } from './history.service';

const router = Router();

/** POST /internal/history/record — trigger session recording */
router.post('/record', async (req: Request, res: Response) => {
    const { userId, sessionData } = req.body as { userId: string; sessionData: Record<string, unknown> };
    if (!userId || !sessionData) return res.status(400).json({ error: 'userId and sessionData required' });
    try {
        await historyService.startSession(userId, sessionData);
        res.json({ recorded: true });
    } catch {
        res.status(500).json({ error: 'Failed to record session' });
    }
});

export default router;
