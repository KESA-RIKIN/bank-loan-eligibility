import { Router } from 'express';
import { z } from 'zod';
import { predict } from '../controllers/predictionController';
import { validateRequest } from '../middleware/validateRequest';
import { EmploymentType, LoanPurpose } from '../types';

const predictSchema = z.object({
  applicantName: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.number().int().min(18, 'Must be at least 18').max(100, 'Must be under 100'),
  income: z.number().min(0, 'Income must be non-negative'),
  creditScore: z.number().int().min(300, 'Credit score min is 300').max(850, 'Credit score max is 850'),
  employmentType: z.nativeEnum(EmploymentType, {
    errorMap: () => ({ message: `Must be one of: ${Object.values(EmploymentType).join(', ')}` }),
  }),
  yearsEmployed: z.number().min(0, 'Years employed must be non-negative'),
  loanAmount: z.number().min(1000, 'Minimum loan amount is $1,000'),
  loanPurpose: z.nativeEnum(LoanPurpose, {
    errorMap: () => ({ message: `Must be one of: ${Object.values(LoanPurpose).join(', ')}` }),
  }),
  debtToIncomeRatio: z.number().min(0).max(1, 'DTI ratio must be between 0 and 1'),
  existingLoans: z.number().int().min(0, 'Existing loans must be non-negative'),
  hasCollateral: z.boolean(),
  collateralValue: z.number().nullable().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
});

const router = Router();

router.post('/', validateRequest(predictSchema), predict);

export default router;
