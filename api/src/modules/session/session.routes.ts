import { Router } from 'express';
import { sessionController } from './session.controller';

const router = Router();

router.get('/history/list/:userId', sessionController.getHistory);
router.get('/history/stats/:userId', sessionController.getStats);
router.delete('/history/delete/:userId', sessionController.deleteHistory);

export default router;
