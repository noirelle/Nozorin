
import { Router, Request, Response, NextFunction } from 'express';
import matchmakingController from '../modules/matchmaking/matchmaking.controller';
import mediaController from '../modules/media/media.controller';
import historyController from '../modules/history/history.controller';
import directCallController from '../modules/direct-call/direct-call.controller';
import trackingController from '../modules/tracking/tracking.controller';
import presenceController from '../modules/presence/presence.controller';
import friendsController from '../modules/friends/friends.controller';
import emitController from './emit.controller';

const router = Router();

/** Shared internal auth guard — requires INTERNAL_API_SECRET header */
const internalAuth = (req: Request, res: Response, next: NextFunction): void => {
    const secret = req.headers['x-internal-secret'];
    if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    next();
};

router.use(internalAuth);

router.use('/queue', matchmakingController);
router.use('/media', mediaController);
router.use('/history', historyController);
router.use('/calls', directCallController);
router.use('/tracking', trackingController);
router.use('/status', presenceController);
router.use('/friends', friendsController);
router.use('/', emitController);

export default router;
