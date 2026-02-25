import { Router, Request, Response } from 'express';
import { activeSessions } from './tracking.store';

const router = Router();

/** GET /internal/tracking/session/:user_id */
router.get('/session/:user_id', (req: Request, res: Response) => {
    const { user_id: userId } = req.params;
    let session = null;
    activeSessions.forEach((s, socketId) => {
        if (s.user_id === userId) session = { ...s, socket_id: socketId };
    });
    if (!session) return res.status(404).json({ error: 'No active session' });
    res.json(session);
});

export default router;
