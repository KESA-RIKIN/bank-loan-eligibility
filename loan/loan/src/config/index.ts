import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  dataDir: path.resolve(__dirname, '../data'),
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100,
  },
} as const;

export const isProduction = config.nodeEnv === 'production';
export const hasGeminiKey = config.geminiApiKey.length > 0 && config.geminiApiKey !== 'your-gemini-api-key-here';
