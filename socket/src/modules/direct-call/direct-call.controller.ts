import { Router, Request, Response } from 'express';
import { directCallService } from './direct-call.service';
import { getIo } from '../../api/emit.controller';
import { activeCalls } from '../call/call.store';

const router = Router();

/** POST /internal/calls/request */
router.post('/request', async (req: Request, res: Response) => {
    const { caller_user_id, target_user_id, mode } = req.body as any;
    const io = getIo();
    if (!io) return res.status(503).json({ error: 'Socket server not ready' });

    try {
        const result = await directCallService.initiateCall(io, caller_user_id, target_user_id, mode || 'voice');
        return res.json(result);
    } catch (error: any) {
        return res.status(error.message === 'User is offline' ? 404 : 400).json({ error: error.message });
    }
});

/** POST /internal/calls/respond */
router.post('/respond', async (req: Request, res: Response) => {
    const { caller_user_id, target_user_id, accepted, mode } = req.body as any;
    const io = getIo();
    if (!io) return res.status(503).json({ error: 'Socket server not ready' });

    try {
        const result = await directCallService.handleResponse(io, target_user_id, caller_user_id, !!accepted, mode || 'voice');
        return res.json(result);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

/** GET /internal/calls/active */
router.get('/active', (_req: Request, res: Response) => {
    const calls: Array<{ socketA: string; socketB: string }> = [];
    const seen = new Set<string>();
    activeCalls.forEach((info: { partner_id: string; start_time: number }, socketA: string) => {
        const partnerA = info.partner_id;
        if (!seen.has(socketA)) {
            seen.add(socketA);
            seen.add(partnerA);
            calls.push({ socketA, socketB: partnerA });
        }
    });
    res.json({ count: activeCalls.size / 2, calls });
});

export default router;
