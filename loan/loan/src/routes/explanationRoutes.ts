import { Router } from 'express';
import { z } from 'zod';
import { explain } from '../controllers/explanationController';
import { validateRequest } from '../middleware/validateRequest';

const explainSchema = z.object({
  applicationId: z.string().uuid('Application ID must be a valid UUID'),
});

const router = Router();

router.post('/', validateRequest(explainSchema), explain);

export default router;
