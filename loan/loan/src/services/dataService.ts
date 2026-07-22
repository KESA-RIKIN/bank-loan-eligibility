/**
 * Data Service — reads and writes loan applications from/to JSON file.
 * Acts as the data access layer (replaces a database).
 */

import fs from 'fs';
import path from 'path';
import { LoanApplication, PaginationQuery, PaginatedResponse } from '../types';
import { config } from '../config';

const DATA_FILE = path.resolve(config.dataDir, 'applications.json');

// ─── In-Memory Cache ────────────────────────────────────────────────────────

let applicationsCache: LoanApplication[] | null = null;

function loadApplications(): LoanApplication[] {
  if (applicationsCache) return applicationsCache;

  if (!fs.existsSync(DATA_FILE)) {
    console.warn('⚠️  applications.json not found. Run "npm run seed" to generate mock data.');
    applicationsCache = [];
    return applicationsCache;
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  applicationsCache = JSON.parse(raw) as LoanApplication[];
  console.log(`📦 Loaded ${applicationsCache.length} applications from disk`);
  return applicationsCache;
}

function saveApplications(applications: LoanApplication[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(applications, null, 2), 'utf-8');
  applicationsCache = applications;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function getAllApplications(): LoanApplication[] {
  return loadApplications();
}

export function getApplicationById(id: string): LoanApplication | undefined {
  return loadApplications().find((app) => app.id === id);
}

export function addApplication(application: LoanApplication): LoanApplication {
  const applications = loadApplications();
  applications.push(application);
  saveApplications(applications);
  return application;
}

export function updateApplication(id: string, updates: Partial<LoanApplication>): LoanApplication | undefined {
  const applications = loadApplications();
  const index = applications.findIndex((app) => app.id === id);
  if (index === -1) return undefined;

  applications[index] = { ...applications[index], ...updates };
  saveApplications(applications);
  return applications[index];
}

export function getTotalCount(): number {
  return loadApplications().length;
}

/**
 * Returns a paginated, filtered, sorted, and searchable list of applications.
 */
export function getApplicationsPaginated(query: PaginationQuery): PaginatedResponse<LoanApplication> {
  let applications = [...loadApplications()];

  // ── Filter by status ──
  if (query.status) {
    applications = applications.filter((app) => app.status === query.status);
  }

  // ── Filter by credit score range ──
  if (query.minCreditScore !== undefined) {
    applications = applications.filter((app) => app.creditScore >= query.minCreditScore!);
  }
  if (query.maxCreditScore !== undefined) {
    applications = applications.filter((app) => app.creditScore <= query.maxCreditScore!);
  }

  // ── Search by name ──
  if (query.search) {
    const searchLower = query.search.toLowerCase();
    applications = applications.filter((app) =>
      app.applicantName.toLowerCase().includes(searchLower)
    );
  }

  // ── Sort ──
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder || 'desc';

  applications.sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[sortBy];
    const bVal = (b as Record<string, unknown>)[sortBy];

    if (aVal === undefined || bVal === undefined) return 0;

    let comparison = 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal);
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  // ── Paginate ──
  const page = query.page || config.pagination.defaultPage;
  const limit = Math.min(query.limit || config.pagination.defaultLimit, config.pagination.maxLimit);
  const total = applications.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const items = applications.slice(startIndex, startIndex + limit);

  return { items, total, page, limit, totalPages };
}

/**
 * Invalidate cache — useful after external file modifications.
 */
export function invalidateCache(): void {
  applicationsCache = null;
}
