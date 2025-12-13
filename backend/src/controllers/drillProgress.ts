// backend/src/controllers/drillProgress.ts
// INTERNAL USE ONLY — Secretarybird Sanctuary Platform (Confidential)
// Derives drill progress from audit_logs (governance-safe, no PII)

import db from '../db/database.js';

export type DrillOutcome = 'CLICKED' | 'REPORTED';

export type DrillProgress = {
  drillId: string;
  attempts: number;
  lastOutcome: DrillOutcome | null;
  lastAttemptAt: string | null; // ISO timestamp
  completed: boolean;           // true if any REPORTED exists
  xpEarned: number;             // current rule: 100 if completed else 0
};

const XP_FOR_REPORTED = 100;

/**
 * Derives per-drill progress from audit_logs for a tenant.
 * 
 * SECURITY: This query uses only audit_log metadata (drillId, outcome, timestamp)
 * and never touches typed content (email/password). The audit_logs table is
 * append-only and contains only governance-safe fields.
 * 
 * @param tenantId - The tenant to query progress for
 * @returns Record mapping drillId -> DrillProgress
 */
export function getProgressByTenant(tenantId: string): Record<string, DrillProgress> {
  // Use better-sqlite3's synchronous API
  // Query: aggregate attempts + find latest outcome per drill from audit_logs
  const rows = db.prepare(`
    WITH drill_attempts AS (
      SELECT 
        json_extract(metadata, '$.drillId') AS drillId,
        json_extract(metadata, '$.outcome') AS outcome,
        timestamp,
        ROW_NUMBER() OVER (
          PARTITION BY json_extract(metadata, '$.drillId') 
          ORDER BY timestamp DESC
        ) AS rn
      FROM audit_logs
      WHERE tenant_id = ?
        AND event_type = 'DRILL_COMPLETED'
    ),
    aggregated AS (
      SELECT
        drillId,
        COUNT(*) AS attempts,
        MAX(CASE WHEN outcome = 'REPORTED' THEN 1 ELSE 0 END) AS hasReported
      FROM drill_attempts
      GROUP BY drillId
    ),
    latest AS (
      SELECT drillId, outcome, timestamp
      FROM drill_attempts
      WHERE rn = 1
    )
    SELECT
      a.drillId AS drillId,
      a.attempts AS attempts,
      l.outcome AS lastOutcome,
      l.timestamp AS lastAttemptAt,
      a.hasReported AS hasReported
    FROM aggregated a
    LEFT JOIN latest l ON l.drillId = a.drillId
  `).all(tenantId) as Array<{
    drillId: string;
    attempts: number;
    lastOutcome: string | null;
    lastAttemptAt: string | null;
    hasReported: number;
  }>;

  const out: Record<string, DrillProgress> = {};
  
  for (const r of rows) {
    const completed = Number(r.hasReported) === 1;
    out[String(r.drillId)] = {
      drillId: String(r.drillId),
      attempts: Number(r.attempts ?? 0),
      lastOutcome: (r.lastOutcome as DrillOutcome) ?? null,
      lastAttemptAt: r.lastAttemptAt ?? null,
      completed,
      xpEarned: completed ? XP_FOR_REPORTED : 0,
    };
  }
  
  return out;
}

/**
 * Gets total XP for a tenant (sum of all completed drills).
 * 
 * @param tenantId - The tenant to calculate XP for
 * @returns Total XP earned
 */
export function getTotalXP(tenantId: string): number {
  const progress = getProgressByTenant(tenantId);
  return Object.values(progress).reduce((sum, p) => sum + p.xpEarned, 0);
}
