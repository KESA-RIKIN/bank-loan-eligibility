/**
 * Gemini Service — AI-powered explanations and chat using Google Generative AI.
 * Falls back to rule-based summaries when no API key is configured.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config, hasGeminiKey } from '../config';
import { LoanApplication, EligibilityResult, ChatMessage } from '../types';

// ─── Gemini Client ──────────────────────────────────────────────────────────

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI | null {
  if (!hasGeminiKey) return null;
  if (!genAI) {
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
  }
  return genAI;
}

// ─── Explanation Generation ─────────────────────────────────────────────────

export async function generateExplanation(
  application: LoanApplication,
  eligibility: EligibilityResult
): Promise<string> {
  const client = getClient();

  if (!client) {
    return generateFallbackExplanation(application, eligibility);
  }

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = buildExplanationPrompt(application, eligibility);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text || generateFallbackExplanation(application, eligibility);
  } catch (error) {
    console.error('Gemini API error (falling back to rule-based):', error);
    return generateFallbackExplanation(application, eligibility);
  }
}

function buildExplanationPrompt(app: LoanApplication, result: EligibilityResult): string {
  return `You are a senior loan underwriting analyst. Provide a clear, professional explanation for the following loan decision.

## Applicant Profile
- **Name**: ${app.applicantName}
- **Age**: ${app.age}
- **Income**: ₹${app.income.toLocaleString()}/year
- **Credit Score**: ${app.creditScore}
- **Employment**: ${app.employmentType} (${app.yearsEmployed} years)
- **Existing Loans**: ${app.existingLoans}
- **Debt-to-Income Ratio**: ${(app.debtToIncomeRatio * 100).toFixed(1)}%
- **Location**: ${app.address.city}, ${app.address.state}

## Loan Details
- **Amount Requested**: ₹${app.loanAmount.toLocaleString()}
- **Purpose**: ${app.loanPurpose}
- **Collateral**: ${app.hasCollateral ? `Yes (₹${app.collateralValue?.toLocaleString()})` : 'None'}

## Engine Decision
- **Decision**: ${result.decision}
- **Score**: ${result.score}/100
- **Eligible**: ${result.eligible ? 'Yes' : 'No'}

## Rule Results
${result.ruleResults.map(r => `- **${r.ruleName}**: ${r.passed ? 'PASS' : 'FAIL'} (${r.score}/${r.weight}) — ${r.message}`).join('\n')}

---

Provide a 3–5 paragraph explanation that:
1. Summarizes the decision in plain language
2. Highlights the strongest factors (positive or negative)
3. Explains what the applicant could do to improve their chances (if denied or under review)
4. Maintains a professional but empathetic tone

Do NOT use markdown headers. Use plain text paragraphs.`;
}

// ─── Chat ───────────────────────────────────────────────────────────────────

export async function chat(
  message: string,
  context: {
    application?: LoanApplication;
    eligibility?: EligibilityResult;
    conversationHistory?: ChatMessage[];
  }
): Promise<string> {
  const client = getClient();

  if (!client) {
    return generateFallbackChatResponse(message, context);
  }

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const systemPrompt = buildChatSystemPrompt(context);
    const history = (context.conversationHistory || []).map((msg) => ({
      role: msg.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.content }],
    }));

    const chatSession = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood. I\'m ready to help with loan-related questions. How can I assist you?' }] },
        ...history,
      ],
    });

    const result = await chatSession.sendMessage(message);
    const response = result.response;
    return response.text() || 'I apologize, I was unable to generate a response. Please try again.';
  } catch (error) {
    console.error('Gemini chat error (falling back):', error);
    return generateFallbackChatResponse(message, context);
  }
}

function buildChatSystemPrompt(context: {
  application?: LoanApplication;
  eligibility?: EligibilityResult;
}): string {
  let prompt = `You are an AI loan advisor assistant. Help users understand loan decisions, eligibility criteria, and provide guidance on improving their loan applications.

Be professional, empathetic, and clear in your responses. If you don't have specific information, say so rather than making assumptions.

Key rules for loan eligibility:
- Minimum credit score: 650
- Maximum debt-to-income ratio: 43%
- Minimum employment: 2 years
- Age range: 21–65
- Loan amount should not exceed 5x annual income
- Maximum 3 existing loans recommended
- Collateral recommended for loans > ₹100,000`;

  if (context.application) {
    const app = context.application;
    prompt += `\n\n## Current Application Context
- Applicant: ${app.applicantName}
- Income: ₹${app.income.toLocaleString()}, Credit Score: ${app.creditScore}
- Employment: ${app.employmentType} (${app.yearsEmployed} years)
- Requesting: ₹${app.loanAmount.toLocaleString()} for ${app.loanPurpose}
- DTI: ${(app.debtToIncomeRatio * 100).toFixed(1)}%, Existing Loans: ${app.existingLoans}`;
  }

  if (context.eligibility) {
    prompt += `\n\n## Eligibility Result
- Decision: ${context.eligibility.decision} (Score: ${context.eligibility.score}/100)
- ${context.eligibility.ruleResults.map(r => `${r.ruleName}: ${r.passed ? 'PASS' : 'FAIL'} (${r.score}/${r.weight})`).join(', ')}`;
  }

  return prompt;
}

// ─── Fallback Responses ─────────────────────────────────────────────────────

function generateFallbackExplanation(app: LoanApplication, result: EligibilityResult): string {
  const passed = result.ruleResults.filter((r) => r.passed);
  const failed = result.ruleResults.filter((r) => !r.passed);

  let explanation = `Loan Application Analysis for ${app.applicantName}\n\n`;
  explanation += `Decision: ${result.decision} | Eligibility Score: ${result.score}/100\n\n`;
  explanation += `${app.applicantName} applied for a ₹${app.loanAmount.toLocaleString()} ${app.loanPurpose.toLowerCase()} loan. `;
  explanation += `The applicant has an annual income of ₹${app.income.toLocaleString()}, a credit score of ${app.creditScore}, `;
  explanation += `and is currently ${app.employmentType.toLowerCase()} with ${app.yearsEmployed} years of employment history.\n\n`;

  if (passed.length > 0) {
    explanation += `Strengths:\n`;
    passed.forEach((r) => {
      explanation += `• ${r.message}\n`;
    });
    explanation += '\n';
  }

  if (failed.length > 0) {
    explanation += `Areas of Concern:\n`;
    failed.forEach((r) => {
      explanation += `• ${r.message}\n`;
    });
    explanation += '\n';
  }

  if (result.decision !== 'Approved') {
    explanation += `Recommendations for Improvement:\n`;
    if (app.creditScore < 650) {
      explanation += `• Work on improving credit score to at least 650 through timely bill payments and reducing credit utilization.\n`;
    }
    if (app.debtToIncomeRatio > 0.43) {
      explanation += `• Reduce existing debts to bring the debt-to-income ratio below 43%.\n`;
    }
    if (app.yearsEmployed < 2) {
      explanation += `• Build a longer employment history — lenders prefer at least 2 years of stable employment.\n`;
    }
    if (app.loanAmount / app.income > 5) {
      explanation += `• Consider requesting a smaller loan amount relative to income.\n`;
    }
  }

  return explanation;
}

function generateFallbackChatResponse(
  message: string,
  context: { application?: LoanApplication; eligibility?: EligibilityResult }
): string {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('credit score') || lowerMsg.includes('credit')) {
    if (context.application) {
      return `The applicant's credit score is ${context.application.creditScore}. Our minimum threshold is 650. ${
        context.application.creditScore >= 650
          ? 'This meets our requirements.'
          : 'This is below our minimum — improving credit score would significantly help the application.'
      } Credit scores can be improved by making timely payments, reducing credit utilization, and avoiding new hard inquiries.`;
    }
    return 'A minimum credit score of 650 is required for loan approval. Scores above 750 are considered excellent and receive the highest ratings in our evaluation. To improve your credit score, focus on timely bill payments, keeping credit utilization below 30%, and maintaining a long credit history.';
  }

  if (lowerMsg.includes('income') || lowerMsg.includes('salary')) {
    if (context.application) {
      const ratio = context.application.loanAmount / context.application.income;
      return `The applicant's income is ₹${context.application.income.toLocaleString()}/year, requesting a loan of ₹${context.application.loanAmount.toLocaleString()} (${ratio.toFixed(1)}x annual income). We recommend the loan amount should not exceed 5x annual income. ${
        ratio <= 5 ? 'This is within acceptable range.' : 'This exceeds our recommended limit.'
      }`;
    }
    return 'We evaluate whether your income can comfortably cover the loan repayments. As a guideline, the loan amount should not exceed 5 times your annual income, and your debt-to-income ratio should stay below 43%.';
  }

  if (lowerMsg.includes('improve') || lowerMsg.includes('denied') || lowerMsg.includes('rejected')) {
    return 'To improve your chances of loan approval, consider: (1) Improving your credit score above 650, (2) Reducing your debt-to-income ratio below 43%, (3) Building at least 2 years of stable employment, (4) Requesting a loan amount within 5x your annual income, (5) Providing collateral for larger loans, and (6) Reducing the number of existing loans.';
  }

  if (lowerMsg.includes('status') || lowerMsg.includes('decision')) {
    if (context.eligibility) {
      return `The application decision is: ${context.eligibility.decision} with an eligibility score of ${context.eligibility.score}/100. ${context.eligibility.summary}`;
    }
    return 'I can provide details about a specific application if you include an application ID with your request.';
  }

  if (context.application && context.eligibility) {
    return `I'm here to help with questions about ${context.application.applicantName}'s loan application. The current decision is ${context.eligibility.decision} with a score of ${context.eligibility.score}/100. You can ask about specific factors like credit score, income adequacy, debt-to-income ratio, or how to improve the application.`;
  }

  return 'I\'m a loan advisor assistant. I can help you understand loan eligibility criteria, explain application decisions, and provide guidance on improving your chances of approval. Try asking about credit scores, income requirements, or specific application details.';
}
