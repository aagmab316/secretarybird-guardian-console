// backend/src/db/database.ts
import Database from 'better-sqlite3';
import path from 'path';

// Governance: Persistent, local storage.
const dbPath = path.resolve('secretarybird.db');
const db = new Database(dbPath); // verbose: console.log for debugging

export function initDatabase() {
  // 1. Drills Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS drills (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      difficulty INTEGER CHECK(difficulty BETWEEN 1 AND 10),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
      outcome TEXT CHECK(outcome IS NULL OR outcome IN ('REPORTED', 'CLICKED')),
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Audit Logs Table (Immutable Record)
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      metadata TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('🔒 Secure Database Initialized at:', dbPath);
}

export default db;
