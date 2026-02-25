import { Router } from 'express';
import { sessionController } from './session.controller';

const router = Router();

router.get('/history/:userId', sessionController.getHistory);
router.delete('/history/:userId', sessionController.deleteHistory);

export default router;
