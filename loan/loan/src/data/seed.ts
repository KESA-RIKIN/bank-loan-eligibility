/**
 * Seed script — generates 100 realistic loan applications and writes to applications.json.
 * Run with: npm run seed
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  LoanApplication,
  EmploymentType,
  LoanPurpose,
  ApplicationStatus,
} from '../types';

// ─── Reference Data ─────────────────────────────────────────────────────────

const firstNames = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Christopher', 'Karen', 'Daniel', 'Lisa', 'Matthew', 'Nancy',
  'Anthony', 'Betty', 'Mark', 'Margaret', 'Steven', 'Sandra', 'Andrew', 'Ashley',
  'Rajesh', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Ananya', 'Suresh', 'Meera',
  'Arjun', 'Kavya', 'Rahul', 'Divya', 'Sanjay', 'Pooja', 'Arun', 'Neha',
  'Carlos', 'Maria', 'Wei', 'Yuki', 'Omar', 'Fatima', 'Luis', 'Sofia',
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris',
  'Sharma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Reddy', 'Joshi', 'Verma',
  'Nair', 'Iyer', 'Menon', 'Rao', 'Das', 'Chatterjee', 'Banerjee', 'Mukherjee',
  'Chen', 'Wang', 'Tanaka', 'Suzuki', 'Kim', 'Park', 'Ali', 'Hassan',
];

const cities = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
  'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
  'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte',
  'Seattle', 'Denver', 'Boston', 'Portland', 'Miami',
];

const states = [
  'NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA', 'TX', 'CA',
  'TX', 'FL', 'TX', 'OH', 'NC', 'WA', 'CO', 'MA', 'OR', 'FL',
];

const employmentTypes = Object.values(EmploymentType);
const loanPurposes = Object.values(LoanPurpose);

// ─── Helpers ────────────────────────────────────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick<T>(arr: T[], weights: number[]): T {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}

function randomDate(daysBack: number): string {
  const now = Date.now();
  const past = now - randomInt(0, daysBack) * 86400000;
  return new Date(past).toISOString();
}

// ─── Application Generator ─────────────────────────────────────────────────

function generateApplication(): LoanApplication {
  const cityIndex = randomInt(0, cities.length - 1);
  const employmentType = weightedPick(employmentTypes, [40, 20, 15, 15, 10]);
  const age = randomInt(19, 70);

  // Income correlates with employment type
  let incomeBase: number;
  switch (employmentType) {
    case EmploymentType.SALARIED:
      incomeBase = randomInt(30000, 200000);
      break;
    case EmploymentType.BUSINESS_OWNER:
      incomeBase = randomInt(50000, 500000);
      break;
    case EmploymentType.SELF_EMPLOYED:
      incomeBase = randomInt(25000, 180000);
      break;
    case EmploymentType.FREELANCER:
      incomeBase = randomInt(20000, 120000);
      break;
    case EmploymentType.UNEMPLOYED:
      incomeBase = randomInt(0, 15000);
      break;
    default:
      incomeBase = randomInt(30000, 100000);
  }

  // Round income to nearest thousand
  const income = Math.round(incomeBase / 1000) * 1000;

  // Credit score — distribution skewed toward 600-750 range
  const creditScore = weightedPick(
    [randomInt(300, 499), randomInt(500, 649), randomInt(650, 749), randomInt(750, 850)],
    [10, 25, 40, 25]
  );

  const loanPurpose = pick(loanPurposes);

  // Loan amount correlates with purpose
  let loanAmount: number;
  switch (loanPurpose) {
    case LoanPurpose.HOME:
      loanAmount = randomInt(100000, 800000);
      break;
    case LoanPurpose.CAR:
      loanAmount = randomInt(10000, 75000);
      break;
    case LoanPurpose.EDUCATION:
      loanAmount = randomInt(5000, 150000);
      break;
    case LoanPurpose.BUSINESS:
      loanAmount = randomInt(25000, 500000);
      break;
    case LoanPurpose.MEDICAL:
      loanAmount = randomInt(5000, 100000);
      break;
    case LoanPurpose.PERSONAL:
      loanAmount = randomInt(2000, 50000);
      break;
    default:
      loanAmount = randomInt(5000, 100000);
  }

  // Round loan amount
  loanAmount = Math.round(loanAmount / 1000) * 1000;

  const yearsEmployed = employmentType === EmploymentType.UNEMPLOYED
    ? 0
    : randomInt(0, Math.min(age - 18, 40));

  const debtToIncomeRatio = randomFloat(0.0, 0.75);
  const existingLoans = randomInt(0, 6);

  // Collateral more likely for Home and Business loans
  const hasCollateral = [LoanPurpose.HOME, LoanPurpose.BUSINESS, LoanPurpose.CAR].includes(loanPurpose)
    ? Math.random() > 0.2
    : Math.random() > 0.7;

  const collateralValue = hasCollateral
    ? Math.round(randomInt(loanAmount * 0.5, loanAmount * 1.5) / 1000) * 1000
    : null;

  // Status weighted toward Pending
  const status = weightedPick(
    [ApplicationStatus.PENDING, ApplicationStatus.APPROVED, ApplicationStatus.DENIED, ApplicationStatus.UNDER_REVIEW],
    [40, 25, 20, 15]
  );

  return {
    id: uuidv4(),
    applicantName: `${pick(firstNames)} ${pick(lastNames)}`,
    age,
    income,
    creditScore,
    employmentType,
    yearsEmployed,
    loanAmount,
    loanPurpose,
    debtToIncomeRatio,
    existingLoans,
    hasCollateral,
    collateralValue,
    address: {
      city: cities[cityIndex],
      state: states[cityIndex],
    },
    status,
    createdAt: randomDate(365),
  };
}

// ─── Main ───────────────────────────────────────────────────────────────────

function seed() {
  const applications: LoanApplication[] = [];

  for (let i = 0; i < 100; i++) {
    applications.push(generateApplication());
  }

  const outputPath = path.resolve(__dirname, 'applications.json');
  fs.writeFileSync(outputPath, JSON.stringify(applications, null, 2), 'utf-8');

  console.log(`✅ Generated ${applications.length} loan applications`);
  console.log(`📁 Written to ${outputPath}`);

  // Print some stats
  const stats = {
    approved: applications.filter(a => a.status === ApplicationStatus.APPROVED).length,
    denied: applications.filter(a => a.status === ApplicationStatus.DENIED).length,
    pending: applications.filter(a => a.status === ApplicationStatus.PENDING).length,
    underReview: applications.filter(a => a.status === ApplicationStatus.UNDER_REVIEW).length,
    avgCreditScore: Math.round(applications.reduce((s, a) => s + a.creditScore, 0) / applications.length),
    avgIncome: Math.round(applications.reduce((s, a) => s + a.income, 0) / applications.length),
    avgLoanAmount: Math.round(applications.reduce((s, a) => s + a.loanAmount, 0) / applications.length),
  };

  console.log('\n📊 Dataset Statistics:');
  console.table(stats);
}

seed();
