/**
 * Request Logger Middleware — configured Morgan for structured logging.
 */

import morgan from 'morgan';
import { isProduction } from '../config';

export const requestLogger = isProduction
  ? morgan('combined')
  : morgan('dev');
