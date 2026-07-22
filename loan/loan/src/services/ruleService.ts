import fs from 'fs';
import path from 'path';
import { RuleConfig } from '../types';

const dataPath = path.resolve(__dirname, '../../data');
const rulesFile = path.join(dataPath, 'rules.json');

// Ensure the rules file exists
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}
if (!fs.existsSync(rulesFile)) {
  const defaultRules: RuleConfig[] = [
    { name: 'Credit Score', weight: 25, isActive: true },
    { name: 'Income Adequacy', weight: 20, isActive: true },
    { name: 'Debt-to-Income Ratio', weight: 15, isActive: true },
    { name: 'Employment Stability', weight: 10, isActive: true },
    { name: 'Employment Type', weight: 5, isActive: true },
    { name: 'Age Eligibility', weight: 5, isActive: true },
    { name: 'Loan-to-Income Ratio', weight: 10, isActive: true },
    { name: 'Existing Loan Burden', weight: 5, isActive: true },
    { name: 'Collateral', weight: 3, isActive: true },
    { name: 'Loan Purpose Risk', weight: 2, isActive: true },
  ];
  fs.writeFileSync(rulesFile, JSON.stringify(defaultRules, null, 2), 'utf-8');
}

/**
 * Loads the rule configuration from JSON.
 */
export function getRuleConfigs(): RuleConfig[] {
  try {
    const data = fs.readFileSync(rulesFile, 'utf-8');
    return JSON.parse(data) as RuleConfig[];
  } catch (error) {
    console.error('Failed to parse rules.json, falling back to empty array.', error);
    return [];
  }
}

/**
 * Overwrites the rule configuration.
 */
export function updateRuleConfigs(newRules: RuleConfig[]): void {
  fs.writeFileSync(rulesFile, JSON.stringify(newRules, null, 2), 'utf-8');
}

/**
 * Gets the weight of a specific rule, or returns a fallback default.
 */
export function getRuleWeight(ruleName: string, defaultWeight: number): number {
  const rules = getRuleConfigs();
  const rule = rules.find((r) => r.name === ruleName);
  if (!rule || !rule.isActive) {
    return 0; // If it's inactive, weight is 0. If it doesn't exist, we'll assume it was disabled.
  }
  return rule.weight;
}
