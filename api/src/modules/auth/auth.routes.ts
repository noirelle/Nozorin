
import { Router } from 'express';
import { authController } from './auth.controller';

const router = Router();

router.post('/guest', authController.guestLogin);
router.post('/anonymous', authController.anonymousIdentityLogin);
router.post('/refresh', authController.refreshToken);

export default router;
