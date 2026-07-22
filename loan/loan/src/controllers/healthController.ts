/**
 * Health Controller — GET /api/health
 */

import { Request, Response } from 'express';
import { ApiResponse, HealthResponse } from '../types';
import { getTotalCount } from '../services/dataService';

const startTime = Date.now();

export function getHealth(_req: Request, res: Response): void {
  const response: ApiResponse<HealthResponse> = {
    success: true,
    data: {
      status: 'healthy',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      totalApplications: getTotalCount(),
    },
    error: null,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}
