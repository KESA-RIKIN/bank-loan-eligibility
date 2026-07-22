/**
 * Rule-Based Eligibility Engine
 *
 * Each rule is independently defined with a name, weight, and evaluate function.
 * The engine runs all rules, calculates a weighted score, and produces a decision.
 */

import {
  LoanApplication,
  EligibilityResult,
  EligibilityRule,
  RuleResult,
  Decision,
  EmploymentType,
  LoanPurpose,
} from '../types';
import { getRuleWeight } from './ruleService';

// ─── Individual Rules ───────────────────────────────────────────────────────

const creditScoreRule: EligibilityRule = {
  name: 'Credit Score',
  defaultWeight: 25,
  evaluate(app: LoanApplication, dynamicWeight?: number): RuleResult {
    const weight = dynamicWeight ?? this.defaultWeight;
    const passed = app.creditScore >= 650;
    let message: string;
    let score: number;

    if (app.creditScore >= 750) {
      score = 25;
      message = `Excellent credit score (${app.creditScore}). Strong indicator of creditworthiness.`;
    } else if (app.creditScore >= 700) {
      score = 20;
      message = `Good credit score (${app.creditScore}). Meets lending standards.`;
    } else if (app.creditScore >= 650) {
      score = 15;
      message = `Fair credit score (${app.creditScore}). Meets minimum threshold but room for improvement.`;
    } else if (app.creditScore >= 550) {
      score = 8;
      message = `Below-average credit score (${app.creditScore}). Higher risk — below the 650 minimum threshold.`;
    } else {
      score = 2;
      message = `Poor credit score (${app.creditScore}). Significant risk — well below minimum threshold of 650.`;
    }

    return { ruleName: 'Credit Score', passed, weight: 25, score, message };
  },
};

const incomeAdequacyRule: EligibilityRule = {
  name: 'Income Adequacy',
  defaultWeight: 20,
  evaluate(app: LoanApplication, dynamicWeight?: number): RuleResult {
    const weight = dynamicWeight ?? this.defaultWeight;
    // Assume a 5-year loan term with rough EMI estimation
    const annualEMI = app.loanAmount / 5;
    const ratio = app.income / annualEMI;
    const passed = ratio >= 3;

    let score: number;
    let message: string;

    if (ratio >= 5) {
      score = 20;
      message = `Strong income-to-EMI ratio (${ratio.toFixed(1)}x). Income comfortably covers loan obligations.`;
    } else if (ratio >= 3) {
      score = 14;
      message = `Adequate income-to-EMI ratio (${ratio.toFixed(1)}x). Income is sufficient for loan repayment.`;
    } else if (ratio >= 2) {
      score = 8;
      message = `Marginal income-to-EMI ratio (${ratio.toFixed(1)}x). Income may be stretched thin.`;
    } else {
      score = 3;
      message = `Insufficient income-to-EMI ratio (${ratio.toFixed(1)}x). Income does not adequately cover the requested loan.`;
    }

    return { ruleName: 'Income Adequacy', passed, weight: 20, score, message };
  },
};

const debtToIncomeRule: EligibilityRule = {
  name: 'Debt-to-Income Ratio',
  defaultWeight: 15,
  evaluate(app: LoanApplication, dynamicWeight?: number): RuleResult {
    const weight = dynamicWeight ?? this.defaultWeight;
    const passed = app.debtToIncomeRatio <= 0.43;
    let score: number;
    let message: string;

    if (app.debtToIncomeRatio <= 0.2) {
      score = 15;
      message = `Low debt-to-income ratio (${(app.debtToIncomeRatio * 100).toFixed(0)}%). Excellent debt management.`;
    } else if (app.debtToIncomeRatio <= 0.35) {
      score = 12;
      message = `Moderate DTI ratio (${(app.debtToIncomeRatio * 100).toFixed(0)}%). Within acceptable range.`;
    } else if (app.debtToIncomeRatio <= 0.43) {
      score = 8;
      message = `DTI ratio at upper limit (${(app.debtToIncomeRatio * 100).toFixed(0)}%). Approaches the 43% maximum threshold.`;
    } else {
      score = 3;
      message = `High DTI ratio (${(app.debtToIncomeRatio * 100).toFixed(0)}%). Exceeds the 43% maximum — applicant is over-leveraged.`;
    }

    return { ruleName: 'Debt-to-Income Ratio', passed, weight: 15, score, message };
  },
};

const employmentStabilityRule: EligibilityRule = {
  name: 'Employment Stability',
  defaultWeight: 10,
  evaluate(app: LoanApplication, dynamicWeight?: number): RuleResult {
    const weight = dynamicWeight ?? this.defaultWeight;
    const passed = app.yearsEmployed >= 2;
    let score: number;
    let message: string;

    if (app.yearsEmployed >= 5) {
      score = 10;
      message = `Excellent employment stability (${app.yearsEmployed} years). Long track record of steady employment.`;
    } else if (app.yearsEmployed >= 2) {
      score = 7;
      message = `Adequate employment history (${app.yearsEmployed} years). Meets the 2-year minimum.`;
    } else if (app.yearsEmployed >= 1) {
      score = 4;
      message = `Limited employment history (${app.yearsEmployed} year). Below the 2-year recommended minimum.`;
    } else {
      score = 1;
      message = `Insufficient employment history (${app.yearsEmployed} years). Employment stability is a concern.`;
    }

    return { ruleName: 'Employment Stability', passed, weight: 10, score, message };
  },
};

const employmentTypeRule: EligibilityRule = {
  name: 'Employment Type',
  defaultWeight: 5,
  evaluate(app: LoanApplication, dynamicWeight?: number): RuleResult {
    const weight = dynamicWeight ?? this.defaultWeight;
    const passed = app.employmentType !== EmploymentType.UNEMPLOYED;
    let score: number;
    let message: string;

    switch (app.employmentType) {
      case EmploymentType.SALARIED:
        score = 5;
        message = 'Salaried employment provides stable, predictable income.';
        break;
      case EmploymentType.BUSINESS_OWNER:
        score = 4;
        message = 'Business ownership indicates entrepreneurial capability but carries some income variability.';
        break;
      case EmploymentType.SELF_EMPLOYED:
        score = 3;
        message = 'Self-employment is acceptable but income may be less predictable.';
        break;
      case EmploymentType.FREELANCER:
        score = 3;
        message = 'Freelance income can be variable. Additional documentation may be needed.';
        break;
      case EmploymentType.UNEMPLOYED:
        score = 0;
        message = 'Currently unemployed — no active income source to service the loan.';
        break;
      default:
        score = 2;
        message = 'Employment type could not be fully assessed.';
    }

    return { ruleName: 'Employment Type', passed, weight: 5, score, message };
  },
};

const ageEligibilityRule: EligibilityRule = {
  name: 'Age Eligibility',
  defaultWeight: 5,
  evaluate(app: LoanApplication, dynamicWeight?: number): RuleResult {
    const weight = dynamicWeight ?? this.defaultWeight;
    const passed = app.age >= 21 && app.age <= 65;
    let score: number;
    let message: string;

    if (app.age < 21) {
      score = 0;
      message = `Applicant is ${app.age} years old — below the minimum age of 21.`;
    } else if (app.age > 65) {
      score = 1;
      message = `Applicant is ${app.age} years old — exceeds the maximum age of 65 for standard loan products.`;
    } else if (app.age <= 55) {
      score = 5;
      message = `Applicant age (${app.age}) is well within the eligible range (21–65).`;
    } else {
      score = 3;
      message = `Applicant age (${app.age}) is within range but closer to the upper limit.`;
    }

    return { ruleName: 'Age Eligibility', passed, weight: 5, score, message };
  },
};

const loanToIncomeRule: EligibilityRule = {
  name: 'Loan-to-Income Ratio',
  defaultWeight: 10,
  evaluate(app: LoanApplication, dynamicWeight?: number): RuleResult {
    const weight = dynamicWeight ?? this.defaultWeight;
    const ratio = app.loanAmount / (app.income || 1);
    const passed = ratio <= 5;
    let score: number;
    let message: string;

    if (ratio <= 2) {
      score = 10;
      message = `Loan-to-income ratio is very conservative (${ratio.toFixed(1)}x annual income).`;
    } else if (ratio <= 3.5) {
      score = 8;
      message = `Loan-to-income ratio is reasonable (${ratio.toFixed(1)}x annual income).`;
    } else if (ratio <= 5) {
      score = 5;
      message = `Loan-to-income ratio is at the upper limit (${ratio.toFixed(1)}x annual income).`;
    } else {
      score = 2;
      message = `Loan amount is ${ratio.toFixed(1)}x annual income — exceeds the 5x maximum.`;
    }

    return { ruleName: 'Loan-to-Income Ratio', passed, weight: 10, score, message };
  },
};

const existingLoanBurdenRule: EligibilityRule = {
  name: 'Existing Loan Burden',
  defaultWeight: 5,
  evaluate(app: LoanApplication, dynamicWeight?: number): RuleResult {
    const weight = dynamicWeight ?? this.defaultWeight;
    const passed = app.existingLoans <= 3;
    let score: number;
    let message: string;

    if (app.existingLoans === 0) {
      score = 5;
      message = 'No existing loans. Clean borrowing profile.';
    } else if (app.existingLoans <= 2) {
      score = 4;
      message = `${app.existingLoans} existing loan(s) — manageable debt obligations.`;
    } else if (app.existingLoans <= 3) {
      score = 3;
      message = `${app.existingLoans} existing loans. Approaching the recommended maximum.`;
    } else {
      score = 1;
      message = `${app.existingLoans} existing loans — exceeds recommended maximum of 3. High cumulative debt risk.`;
    }

    return { ruleName: 'Existing Loan Burden', passed, weight: 5, score, message };
  },
};

const collateralRule: EligibilityRule = {
  name: 'Collateral',
  defaultWeight: 3,
  evaluate(app: LoanApplication, dynamicWeight?: number): RuleResult {
    const weight = dynamicWeight ?? this.defaultWeight;
    const isLargeLoan = app.loanAmount > 100000;
    const passed = !isLargeLoan || app.hasCollateral;
    let score: number;
    let message: string;

    if (app.hasCollateral && app.collateralValue) {
      const coverage = app.collateralValue / app.loanAmount;
      if (coverage >= 1) {
        score = 3;
        message = `Collateral valued at $${app.collateralValue.toLocaleString()} fully covers the loan (${(coverage * 100).toFixed(0)}% coverage).`;
      } else {
        score = 2;
        message = `Collateral valued at $${app.collateralValue.toLocaleString()} partially covers the loan (${(coverage * 100).toFixed(0)}% coverage).`;
      }
    } else if (!isLargeLoan) {
      score = 2;
      message = 'No collateral, but loan amount is below the $100,000 collateral requirement threshold.';
    } else {
      score = 0;
      message = `No collateral for a $${app.loanAmount.toLocaleString()} loan. Collateral is recommended for loans exceeding $100,000.`;
    }

    return { ruleName: 'Collateral', passed, weight: 3, score, message };
  },
};

const loanPurposeRiskRule: EligibilityRule = {
  name: 'Loan Purpose Risk',
  defaultWeight: 2,
  evaluate(app: LoanApplication, dynamicWeight?: number): RuleResult {
    const weight = dynamicWeight ?? this.defaultWeight;
    let score: number;
    let message: string;
    let passed: boolean;

    switch (app.loanPurpose) {
      case LoanPurpose.HOME:
        score = 2;
        passed = true;
        message = 'Home loans are low-risk — the property itself acts as security.';
        break;
      case LoanPurpose.EDUCATION:
        score = 2;
        passed = true;
        message = 'Education loans are low-risk — investment in future earning potential.';
        break;
      case LoanPurpose.CAR:
        score = 2;
        passed = true;
        message = 'Car loans carry low-to-moderate risk — the vehicle serves as collateral.';
        break;
      case LoanPurpose.BUSINESS:
        score = 1;
        passed = true;
        message = 'Business loans carry moderate risk — returns depend on business performance.';
        break;
      case LoanPurpose.MEDICAL:
        score = 1;
        passed = true;
        message = 'Medical loans are necessary expenses — moderate risk profile.';
        break;
      case LoanPurpose.PERSONAL:
        score = 1;
        passed = true;
        message = 'Personal loans carry higher risk due to lack of specific purpose or collateral.';
        break;
      default:
        score = 1;
        passed = true;
        message = 'Loan purpose could not be fully assessed.';
    }

    return { ruleName: 'Loan Purpose Risk', passed, weight: 2, score, message };
  },
};

// ─── Engine ─────────────────────────────────────────────────────────────────

const ALL_RULES: EligibilityRule[] = [
  creditScoreRule,
  incomeAdequacyRule,
  debtToIncomeRule,
  employmentStabilityRule,
  employmentTypeRule,
  ageEligibilityRule,
  loanToIncomeRule,
  existingLoanBurdenRule,
  collateralRule,
  loanPurposeRiskRule,
];

/**
 * Evaluates a loan application against all rules and returns a comprehensive result.
 */
export function evaluateEligibility(application: LoanApplication): EligibilityResult {
  const ruleResults = ALL_RULES.map((rule) => {
    const dynamicWeight = getRuleWeight(rule.name, rule.defaultWeight);
    if (dynamicWeight === 0) {
      // rule is disabled
      return { ruleName: rule.name, passed: true, weight: 0, score: 0, message: 'Rule disabled.' };
    }
    const result = rule.evaluate(application, dynamicWeight);
    
    // Scale score based on dynamic weight vs default weight
    // If the original logic returned `result.score` based on `this.defaultWeight`,
    // we need to scale it by `dynamicWeight / this.defaultWeight`
    result.score = (result.score / rule.defaultWeight) * dynamicWeight;
    result.weight = dynamicWeight;
    
    return result;
  });

  // Total score is the sum of individual rule scores
  const score = Math.round(ruleResults.reduce((sum, r) => sum + r.score, 0));

  // Decision thresholds
  let decision: Decision;
  let eligible: boolean;

  if (score >= 75) {
    decision = Decision.APPROVED;
    eligible = true;
  } else if (score >= 45) {
    decision = Decision.MANUAL_REVIEW;
    eligible = false;
  } else {
    decision = Decision.DENIED;
    eligible = false;
  }

  // Collect reasons — failures first, then successes
  const failedRules = ruleResults.filter((r) => !r.passed);
  const passedRules = ruleResults.filter((r) => r.passed);
  const reasons = [
    ...failedRules.map((r) => `❌ ${r.message}`),
    ...passedRules.map((r) => `✅ ${r.message}`),
  ];

  // Generate summary
  const summary = generateSummary(application, decision, score, failedRules);

  return { eligible, score, decision, reasons, ruleResults, summary };
}

function generateSummary(
  app: LoanApplication,
  decision: Decision,
  score: number,
  failedRules: RuleResult[]
): string {
  const decisionText = decision === Decision.APPROVED
    ? `The application from ${app.applicantName} for a $${app.loanAmount.toLocaleString()} ${app.loanPurpose.toLowerCase()} loan has been APPROVED.`
    : decision === Decision.MANUAL_REVIEW
    ? `The application from ${app.applicantName} for a $${app.loanAmount.toLocaleString()} ${app.loanPurpose.toLowerCase()} loan requires MANUAL REVIEW.`
    : `The application from ${app.applicantName} for a $${app.loanAmount.toLocaleString()} ${app.loanPurpose.toLowerCase()} loan has been DENIED.`;

  const scoreText = `Eligibility score: ${score}/100.`;

  let issuesText = '';
  if (failedRules.length > 0) {
    issuesText = ` Key concerns: ${failedRules.map((r) => r.ruleName).join(', ')}.`;
  }

  return `${decisionText} ${scoreText}${issuesText}`;
}

/**
 * Returns all rule names and weights for transparency.
 */
export function getRuleDefinitions(): Array<{ name: string; weight: number }> {
  return ALL_RULES.map((r) => ({ name: r.name, weight: getRuleWeight(r.name, r.defaultWeight) }));
}
