/**
 * Prediction Controller — POST /api/predict
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  ApiResponse,
  LoanApplication,
  EligibilityResult,
  PredictRequest,
  ApplicationStatus,
} from '../types';
import { addApplication } from '../services/dataService';
import { evaluateEligibility } from '../services/eligibilityEngine';

/**
 * POST /api/predict — submit loan data, get eligibility prediction
 */
export function predict(req: Request, res: Response): void {
  const body = req.body as PredictRequest;

  // Build a full LoanApplication from the request
  const application: LoanApplication = {
    id: uuidv4(),
    applicantName: body.applicantName,
    panCardNumber: body.panCardNumber || 'UNKNOWN',
    age: body.age,
    income: body.income,
    creditScore: body.creditScore,
    employmentType: body.employmentType,
    yearsEmployed: body.yearsEmployed,
    loanAmount: body.loanAmount,
    loanPurpose: body.loanPurpose,
    tenure: body.tenure || 5, // default to 5 years if not provided
    debtToIncomeRatio: body.debtToIncomeRatio,
    existingLoans: body.existingLoans,
    hasCollateral: body.hasCollateral,
    collateralValue: body.collateralValue ?? null,
    address: {
      city: body.city,
      state: body.state,
    },
    status: ApplicationStatus.PENDING,
    createdAt: new Date().toISOString(),
  };

  // Run eligibility engine
  const eligibility: EligibilityResult = evaluateEligibility(application);

  // Update status based on decision
  application.status =
    eligibility.decision === 'Approved'
      ? ApplicationStatus.APPROVED
      : eligibility.decision === 'Denied'
      ? ApplicationStatus.DENIED
      : ApplicationStatus.UNDER_REVIEW;

  // Persist the application
  addApplication(application);

  const response: ApiResponse<{ application: LoanApplication; eligibility: EligibilityResult }> = {
    success: true,
    data: { application, eligibility },
    error: null,
    timestamp: new Date().toISOString(),
  };

  res.status(201).json(response);
}
