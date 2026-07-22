/**
 * Application Controller — GET /api/applications, GET /api/applications/:id
 */

import { Request, Response } from 'express';
import { ApiResponse, LoanApplication, PaginationQuery, PaginatedResponse, EligibilityResult } from '../types';
import { getApplicationsPaginated, getApplicationById } from '../services/dataService';
import { evaluateEligibility } from '../services/eligibilityEngine';

/**
 * GET /api/applications — paginated, filterable, searchable list
 */
export function listApplications(req: Request, res: Response): void {
  const query: PaginationQuery = {
    page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    status: req.query.status as PaginationQuery['status'],
    minCreditScore: req.query.minCreditScore ? parseInt(req.query.minCreditScore as string, 10) : undefined,
    maxCreditScore: req.query.maxCreditScore ? parseInt(req.query.maxCreditScore as string, 10) : undefined,
    search: req.query.search as string | undefined,
    sortBy: req.query.sortBy as string | undefined,
    sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
  };

  const result = getApplicationsPaginated(query);

  const response: ApiResponse<PaginatedResponse<LoanApplication>> = {
    success: true,
    data: result,
    error: null,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}

/**
 * GET /api/applications/:id — single application with eligibility result
 */
export function getApplication(req: Request, res: Response): void {
  const { id } = req.params;
  const application = getApplicationById(id);

  if (!application) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: `Application with ID "${id}" not found`,
      timestamp: new Date().toISOString(),
    };
    res.status(404).json(response);
    return;
  }

  const eligibility = evaluateEligibility(application);

  const response: ApiResponse<{ application: LoanApplication; eligibility: EligibilityResult }> = {
    success: true,
    data: { application, eligibility },
    error: null,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}
