// backend/src/controllers/drillController.ts
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';

export interface CreateDrillInput {
  tenantId: string;
  title: string;
  description?: string;
  difficulty: number;
}

export interface DrillRecord {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  difficulty: number;
  status: string;
  outcome: string | null;
  completed_at: string | null;
  created_at: string;
}

export const createDrill = (data: CreateDrillInput) => {
  const id = uuidv4();

  // Transaction: Create Drill + Write Audit Log
  const createTx = db.transaction(() => {
    // 1. Insert Drill
    db.prepare(`
      INSERT INTO drills (id, tenant_id, title, description, difficulty)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, data.tenantId, data.title, data.description || '', data.difficulty);

    // 2. Audit Log (Governance Requirement)
    db.prepare(`
      INSERT INTO audit_logs (tenant_id, event_type, actor_id, metadata)
      VALUES (?, ?, ?, ?)
    `).run(
      data.tenantId,
      'DRILL_CREATED',
      'system-admin',
      JSON.stringify({ drillId: id }),
    );
  });

  createTx();
  return { id, ...data };
};

export const getDrillsForTenant = (tenantId: string) => {
  // Governance: Strict Isolation (WHERE tenant_id = ?)
  return db
    .prepare(`
    SELECT * FROM drills WHERE tenant_id = ? ORDER BY created_at DESC
  `)
    .all(tenantId);
};

export const getDrillById = (id: string): DrillRecord | undefined => {
  return db.prepare(`SELECT * FROM drills WHERE id = ?`).get(id) as DrillRecord | undefined;
};

export type DrillOutcome = 'REPORTED' | 'CLICKED';

export const recordDrillAttempt = (id: string, outcome: DrillOutcome) => {
  const drill = getDrillById(id);
  if (!drill) {
    throw new Error('DRILL_NOT_FOUND');
  }

  // Transaction: Update Drill + Write Audit Log
  const attemptTx = db.transaction(() => {
    // 1. Update Drill status and outcome
    db.prepare(`
      UPDATE drills 
      SET status = 'completed', outcome = ?, completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(outcome, id);

    // 2. Audit Log (Governance Requirement: Immutable Record)
    db.prepare(`
      INSERT INTO audit_logs (tenant_id, event_type, actor_id, metadata)
      VALUES (?, ?, ?, ?)
    `).run(
      drill.tenant_id,
      'DRILL_COMPLETED',
      'family-user',
      JSON.stringify({ drillId: id, outcome }),
    );
  });

  attemptTx();
  return { id, outcome, status: 'completed' };
};
