/**
 * Chat Service — manages conversation context and delegates to Gemini.
 */

import { LoanApplication, EligibilityResult, ChatMessage } from '../types';
import { getApplicationById } from './dataService';
import { evaluateEligibility } from './eligibilityEngine';
import { chat as geminiChat } from './geminiService';

export interface ChatContext {
  application?: LoanApplication;
  eligibility?: EligibilityResult;
}

/**
 * Resolves the application context for a chat session.
 */
function resolveContext(applicationId?: string): ChatContext {
  const context: ChatContext = {};

  if (applicationId) {
    const application = getApplicationById(applicationId);
    if (application) {
      context.application = application;
      context.eligibility = evaluateEligibility(application);
    }
  }

  return context;
}

/**
 * Processes a chat message with optional application context.
 */
export async function processChat(
  message: string,
  applicationId?: string,
  conversationHistory?: ChatMessage[]
): Promise<{ reply: string; context: ChatContext }> {
  const context = resolveContext(applicationId);

  const reply = await geminiChat(message, {
    application: context.application,
    eligibility: context.eligibility,
    conversationHistory,
  });

  return { reply, context };
}
