import { Router, Request, Response } from 'express';
import { historyService } from './history.service';

const router = Router();

/** POST /internal/history/record — trigger session recording */
router.post('/record', async (req: Request, res: Response) => {
    const { user_id: userId, session_data: sessionData } = req.body as { user_id: string; session_data: any };
    if (!userId || !sessionData) return res.status(400).json({ error: 'user_id and session_data required' });
    try {
        await historyService.addHistory({
            user_id: userId,
            ...sessionData
        });
        res.json({ recorded: true });
    } catch {
        res.status(500).json({ error: 'Failed to record session' });
    }
});

export default router;
