/**
 * Express Application Setup
 * Configures middleware, routes, and error handling.
 */

import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';

// Routes
import healthRoutes from './routes/healthRoutes';
import applicationRoutes from './routes/applicationRoutes';
import predictionRoutes from './routes/predictionRoutes';
import explanationRoutes from './routes/explanationRoutes';
import chatRoutes from './routes/chatRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();

// ─── Security & Parsing ─────────────────────────────────────────────────────

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: config.cors.origin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Serve Frontend ─────────────────────────────────────────────────────────

app.use(express.static(path.resolve(__dirname, '../public')));

// ─── Logging ────────────────────────────────────────────────────────────────

app.use(requestLogger);

// ─── API Routes ─────────────────────────────────────────────────────────────

app.use('/api/health', healthRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/predict', predictionRoutes);
app.use('/api/explain', explanationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// Also mount health at root /health for convenience
app.use('/health', healthRoutes);

// ─── 404 Handler ────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: `Route not found: ${_req.method} ${_req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
});

// ─── Global Error Handler ───────────────────────────────────────────────────

app.use(errorHandler);

export default app;
