import { Router } from 'express';
import { getRules, updateRules, getAnalytics } from '../controllers/adminController';

const router = Router();

router.get('/rules', getRules);
router.post('/rules', updateRules);
router.get('/analytics', getAnalytics);

export default router;
