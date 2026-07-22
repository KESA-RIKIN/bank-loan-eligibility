// ─── Enums ──────────────────────────────────────────────────────────────────

export enum EmploymentType {
  SALARIED = 'Salaried',
  SELF_EMPLOYED = 'Self-Employed',
  BUSINESS_OWNER = 'Business Owner',
  FREELANCER = 'Freelancer',
  UNEMPLOYED = 'Unemployed',
}

export enum LoanPurpose {
  HOME = 'Home',
  CAR = 'Car',
  EDUCATION = 'Education',
  PERSONAL = 'Personal',
  BUSINESS = 'Business',
  MEDICAL = 'Medical',
}

export enum ApplicationStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  DENIED = 'Denied',
  UNDER_REVIEW = 'Under Review',
}

export enum Decision {
  APPROVED = 'Approved',
  DENIED = 'Denied',
  MANUAL_REVIEW = 'Manual Review',
}

// ─── Core Interfaces ────────────────────────────────────────────────────────

export interface Address {
  city: string;
  state: string;
}

export interface LoanApplication {
  id: string;
  applicantName: string;
  panCardNumber: string;
  age: number;
  income: number;
  creditScore: number;
  employmentType: EmploymentType;
  yearsEmployed: number;
  loanAmount: number;
  loanPurpose: LoanPurpose;
  tenure: number;
  debtToIncomeRatio: number;
  existingLoans: number;
  hasCollateral: boolean;
  collateralValue: number | null;
  address: Address;
  status: ApplicationStatus;
  createdAt: string;
}

// ─── Eligibility Engine ─────────────────────────────────────────────────────

export interface RuleResult {
  ruleName: string;
  passed: boolean;
  weight: number;
  score: number;
  message: string;
}

export interface EligibilityResult {
  eligible: boolean;
  score: number;
  decision: Decision;
  reasons: string[];
  ruleResults: RuleResult[];
  summary: string;
}

export interface EligibilityRule {
  name: string;
  defaultWeight: number;
  evaluate: (application: LoanApplication, weight?: number) => RuleResult;
}

export interface RuleConfig {
  name: string;
  weight: number;
  isActive: boolean;
}

// ─── API Request / Response ─────────────────────────────────────────────────

export interface PredictRequest {
  applicantName: string;
  panCardNumber: string;
  age: number;
  income: number;
  creditScore: number;
  employmentType: EmploymentType;
  yearsEmployed: number;
  loanAmount: number;
  loanPurpose: LoanPurpose;
  tenure: number;
  debtToIncomeRatio: number;
  existingLoans: number;
  hasCollateral: boolean;
  collateralValue?: number | null;
  city: string;
  state: string;
}

export interface ExplainRequest {
  applicationId: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  applicationId?: string;
  conversationHistory?: ChatMessage[];
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  status?: ApplicationStatus;
  minCreditScore?: number;
  maxCreditScore?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  timestamp: string;
}

export interface HealthResponse {
  status: string;
  uptime: number;
  timestamp: string;
  version: string;
  totalApplications: number;
}
