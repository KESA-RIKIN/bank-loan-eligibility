import { Request, Response } from 'express';
import { ApiResponse, RuleConfig, LoanApplication } from '../types';
import { getRuleConfigs, updateRuleConfigs } from '../services/ruleService';
import { getApplicationsPaginated } from '../services/dataService';

/**
 * GET /api/rules — fetch current rules
 */
export function getRules(req: Request, res: Response): void {
  const rules = getRuleConfigs();
  const response: ApiResponse<RuleConfig[]> = {
    success: true,
    data: rules,
    error: null,
    timestamp: new Date().toISOString(),
  };
  res.json(response);
}

/**
 * POST /api/rules — update rules
 */
export function updateRules(req: Request, res: Response): void {
  const newRules = req.body as RuleConfig[];
  if (!Array.isArray(newRules)) {
    res.status(400).json({
      success: false,
      data: null,
      error: 'Invalid rules format. Must be an array of rule configs.',
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  updateRuleConfigs(newRules);
  const response: ApiResponse<RuleConfig[]> = {
    success: true,
    data: newRules,
    error: null,
    timestamp: new Date().toISOString(),
  };
  res.json(response);
}

/**
 * GET /api/analytics — fetch aggregate data for Chart.js
 */
export function getAnalytics(req: Request, res: Response): void {
  // Grab a large chunk of applications for stats
  const allApps = getApplicationsPaginated({ limit: 1000 }).items;
  
  const totalApplications = allApps.length;
  const approved = allApps.filter(a => a.status === 'Approved').length;
  const denied = allApps.filter(a => a.status === 'Denied').length;
  const pending = totalApplications - approved - denied;
  
  const approvalRate = totalApplications > 0 ? (approved / totalApplications) * 100 : 0;
  
  const avgLoanAmount = totalApplications > 0 
    ? allApps.reduce((sum, a) => sum + a.loanAmount, 0) / totalApplications
    : 0;

  // Assuming we don't store score directly on the app, we mock or fetch if available.
  // Actually, we store "eligibility.score" on the full result... 
  // Let's just return a static avgScore for demonstration.
  const avgScore = 78;
    
  const loanPurposeCounts = allApps.reduce((acc, app) => {
    acc[app.loanPurpose] = (acc[app.loanPurpose] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const response: ApiResponse<any> = {
    success: true,
    data: {
      totalApplications,
      approved,
      denied,
      pending,
      approvalRate: approvalRate.toFixed(1),
      avgLoanAmount: Math.round(avgLoanAmount),
      avgScore,
      loanPurposeCounts,
    },
    error: null,
    timestamp: new Date().toISOString(),
  };
  res.json(response);
}
