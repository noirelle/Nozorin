import { Router, Request, Response } from 'express';
import { activeCalls } from '../../call/call.store';

const router = Router();

/** GET /internal/calls/active */
router.get('/active', (_req: Request, res: Response) => {
    const calls: Array<{ socketA: string; socketB: string }> = [];
    const seen = new Set<string>();
    activeCalls.forEach((partnerA: string, socketA: string) => {
        if (!seen.has(socketA)) {
            seen.add(socketA);
            seen.add(partnerA);
            calls.push({ socketA, socketB: partnerA });
        }
    });
    res.json({ count: activeCalls.size / 2, calls });
});

export default router;
