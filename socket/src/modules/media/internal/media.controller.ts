import { Router, Request, Response } from 'express';
import { userMediaState } from '../media.store';

const router = Router();

/** GET /internal/media/state/:socketId */
router.get('/state/:socketId', (req: Request, res: Response) => {
    const { socketId } = req.params;
    const state = userMediaState.get(socketId);
    if (!state) return res.status(404).json({ error: 'Socket not found' });
    res.json({ socketId, ...state });
});

export default router;
