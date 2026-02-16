
import { Router } from 'express';
import { authController } from '../controllers/authController';

const router = Router();

router.post('/guest', authController.guestLogin);
router.post('/anonymous', authController.anonymousIdentityLogin);

export default router;
