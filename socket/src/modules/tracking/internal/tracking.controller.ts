import { Router, Request, Response } from 'express';
import { activeSessions } from '../tracking.store';

const router = Router();

/** GET /internal/tracking/session/:userId */
router.get('/session/:userId', (req: Request, res: Response) => {
    const { userId } = req.params;
    let session = null;
    activeSessions.forEach((s, socketId) => {
        if (s.userId === userId) session = { ...s, socketId };
    });
    if (!session) return res.status(404).json({ error: 'No active session' });
    res.json(session);
});

export default router;
