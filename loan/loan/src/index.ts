/**
 * Server Entry Point
 * Starts the Express server with graceful shutdown handling.
 */

import app from './app';
import { config, hasGeminiKey } from './config';

const server = app.listen(config.port, () => {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║       ExplainAI LoanWise — Backend Server       ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  🚀 Server:    http://localhost:${config.port}             ║`);
  console.log(`║  📡 API Base:  http://localhost:${config.port}/api         ║`);
  console.log(`║  🏥 Health:    http://localhost:${config.port}/api/health  ║`);
  console.log(`║  🌍 Env:       ${config.nodeEnv.padEnd(33)}║`);
  console.log(`║  🤖 Gemini:    ${(hasGeminiKey ? 'Connected' : 'Fallback mode').padEnd(33)}║`);
  console.log('╚══════════════════════════════════════════════════╝\n');

  console.log('📋 Available Endpoints:');
  console.log('   GET  /api/health          → Service health check');
  console.log('   GET  /api/applications    → List applications (paginated)');
  console.log('   GET  /api/applications/:id → Get application + eligibility');
  console.log('   POST /api/predict         → Submit & evaluate loan');
  console.log('   POST /api/explain         → AI explanation for a decision');
  console.log('   POST /api/chat            → Chat about loan decisions\n');
});

// ─── Graceful Shutdown ──────────────────────────────────────────────────────

function gracefulShutdown(signal: string) {
  console.log(`\n⏳ ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('✅ Server closed. Goodbye!\n');
    process.exit(0);
  });

  // Force exit after 10s
  setTimeout(() => {
    console.error('❌ Forced shutdown after 10s timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('🔥 Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('🔥 Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});
