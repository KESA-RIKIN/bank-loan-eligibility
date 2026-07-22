import { Router } from 'express';
import { z } from 'zod';
import { chatHandler } from '../controllers/chatController';
import { validateRequest } from '../middleware/validateRequest';

const chatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long (max 2000 chars)'),
  applicationId: z.string().uuid().optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional(),
});

const router = Router();

router.post('/', validateRequest(chatSchema), chatHandler);

export default router;
