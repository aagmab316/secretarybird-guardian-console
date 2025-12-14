// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database.js';
import drillRoutes from './routes/drillRoutes.js';
import { governanceRouter } from './routes/governance.js';

// 🚨 Global Error Traps
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 UNHANDLED REJECTION:', reason);
});

const app = express();
const PORT = 3001;
const HOST = '127.0.0.1'; // 🔒 FORCE IPv4 - eliminates localhost resolution ambiguity

// 1. Init Infrastructure (Safe Mode)
try {
  console.log('🔌 Initializing Database...');
  initDatabase();
} catch (err) {
  console.error('❌ FATAL: Database initialization failed:', err);
  process.exit(1);
}

// 2. Middleware
app.use(cors()); // Allow Frontend access
app.use(express.json());

app.use((err: Error & { type?: string }, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ ok: false, error: "Invalid JSON body" });
  }
  return next(err);
});

// 3. Mount Routes
app.use('/api/drills', drillRoutes);
app.use('/api', governanceRouter);

// 4. Health Check
app.get('/health', (req, res) =>
  res.json({ status: 'ok', version: '0.9.1-governance' }),
);

// 5. Start
console.log(`🚀 About to listen on ${HOST}:${PORT}...`);
const server = app.listen(PORT, HOST, () => {
  const addr = server.address();
  console.log('✅ server.listen callback fired; address =', addr);
  console.log(`🛡️  Governance Core running on http://${HOST}:${PORT}`);
});

server.on('listening', () => {
  const addr = server.address();
  console.log('📡 server "listening" event; address =', addr);
});

server.on('close', () => {
  console.warn('🛑 server "close" event fired');
});

server.on('error', (err) => {
  console.error('❌ FATAL: Server failed to start:', err);
});

// Keepalive to prevent process exit - multiple strategies
setInterval(() => {
  // Keep event loop alive
}, 1000);

// Also keep stdin open to anchor the process
process.stdin.resume();

console.log('🔄 Process anchored - stdin + interval keepalive active');
