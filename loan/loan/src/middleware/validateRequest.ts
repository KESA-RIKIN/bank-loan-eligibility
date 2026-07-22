/**
 * Request Validation Middleware — uses Zod schemas to validate request bodies and queries.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse } from '../types';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Creates a validation middleware for the given Zod schema and request target.
 */
export function validateRequest(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[target]);
      // Replace the parsed (and coerced) data back onto the request
      (req as Record<string, unknown>)[target] = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: `Validation failed: ${errors.map((e) => `${e.field} — ${e.message}`).join('; ')}`,
          timestamp: new Date().toISOString(),
        };

        res.status(400).json(response);
        return;
      }
      next(error);
    }
  };
}
