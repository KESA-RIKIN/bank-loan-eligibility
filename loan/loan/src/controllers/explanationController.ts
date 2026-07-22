/**
 * Explanation Controller — POST /api/explain
 */

import { Request, Response } from 'express';
import { ApiResponse, ExplainRequest } from '../types';
import { getApplicationById } from '../services/dataService';
import { evaluateEligibility } from '../services/eligibilityEngine';
import { generateExplanation } from '../services/geminiService';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * POST /api/explain — get AI-powered explanation for an application
 */
export const explain = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { applicationId } = req.body as ExplainRequest;

  const application = getApplicationById(applicationId);

  if (!application) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: `Application with ID "${applicationId}" not found`,
      timestamp: new Date().toISOString(),
    };
    res.status(404).json(response);
    return;
  }

  const eligibility = evaluateEligibility(application);
  const explanation = await generateExplanation(application, eligibility);

  const response: ApiResponse<{
    applicationId: string;
    applicantName: string;
    decision: string;
    score: number;
    explanation: string;
    ruleResults: typeof eligibility.ruleResults;
  }> = {
    success: true,
    data: {
      applicationId: application.id,
      applicantName: application.applicantName,
      decision: eligibility.decision,
      score: eligibility.score,
      explanation,
      ruleResults: eligibility.ruleResults,
    },
    error: null,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});
