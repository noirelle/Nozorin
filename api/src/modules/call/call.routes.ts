
import { Router } from 'express';
import { callController } from './call.controller';
import { authenticateToken } from '../../core/middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/request', callController.requestCall);
router.post('/respond', callController.respondToCall);

export default router;
