import { Router } from 'express';
import { syncUser, getMe } from './auth.controller';
import { auth } from '../../middleware/auth.middleware';

const router = Router();

router.post('/sync-user', auth, syncUser);
router.get('/me', auth, getMe);

export default router;
