/**
 * Chat Controller — POST /api/chat
 */

import { Request, Response } from 'express';
import { ApiResponse, ChatRequest, ChatMessage } from '../types';
import { processChat } from '../services/chatService';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * POST /api/chat — conversational AI about loan decisions
 */
export const chatHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { message, applicationId, conversationHistory } = req.body as ChatRequest;

  const { reply, context } = await processChat(message, applicationId, conversationHistory);

  const updatedHistory: ChatMessage[] = [
    ...(conversationHistory || []),
    { role: 'user', content: message },
    { role: 'assistant', content: reply },
  ];

  const response: ApiResponse<{
    reply: string;
    conversationHistory: ChatMessage[];
    hasApplicationContext: boolean;
  }> = {
    success: true,
    data: {
      reply,
      conversationHistory: updatedHistory,
      hasApplicationContext: !!context.application,
    },
    error: null,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});
