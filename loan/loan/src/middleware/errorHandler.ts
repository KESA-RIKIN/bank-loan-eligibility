/**
 * Global Error Handler Middleware
 * Catches all unhandled errors and returns consistent JSON responses.
 */

import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import { isProduction } from '../config';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof AppError
    ? err.message
    : isProduction
      ? 'Internal Server Error'
      : err.message;

  if (statusCode >= 500) {
    console.error('🔥 Server Error:', err);
  }

  const response: ApiResponse<null> = {
    success: false,
    data: null,
    error: message,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
}

/**
 * Catches async errors in route handlers and forwards to the error handler.
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
