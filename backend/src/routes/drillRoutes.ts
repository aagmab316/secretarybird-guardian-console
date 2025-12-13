// backend/src/routes/drillRoutes.ts
import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { createDrill, getDrillsForTenant, getDrillById, recordDrillAttempt, type DrillOutcome } from '../controllers/drillController.js';
import { getProgressByTenant, type DrillProgress } from '../controllers/drillProgress.js';

const router = Router();

// Audit-safe logger: logs only safe fields, never typed content
const auditLog = (event: string, data: Record<string, string | number | undefined>) => {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    ...data,
  };
  // Structured JSON log for audit trail
  console.log(JSON.stringify(entry));
};

// Validation Schemas (all use .strict() to reject extra fields - security requirement)
const CreateSchema = z.object({
  tenantId: z.string().min(1),
  title: z.string().min(3),
  description: z.string().optional(),
  difficulty: z.number().min(1).max(10),
}).strict();

// SECURITY: .strict() rejects any fields beyond drillId/outcome
// This is the server-side enforcement that prevents credential exfiltration
// even if the frontend is compromised.
const AttemptSchema = z.object({
  outcome: z.enum(['REPORTED', 'CLICKED']),
}).strict();

// POST /api/drills (Create)
router.post('/', (req, res) => {
  try {
    const data = CreateSchema.parse(req.body);
    const result = createDrill(data);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: 'Validation Failed', details: err });
  }
});

// GET /api/drills/:tenantId (List with Progress)
// v0.9.6: Returns drills + per-drill progress derived from audit_logs
router.get('/:tenantId', (req, res) => {
  try {
    const tenantId = req.params.tenantId;
    const drills = getDrillsForTenant(tenantId) as Array<{ id: string }>;
    const progress = getProgressByTenant(tenantId);

    // Merge progress into each drill (governance-safe: only drillId/outcome/timestamp)
    const drillsWithProgress = drills.map((drill) => ({
      ...drill,
      progress: progress[drill.id] ?? {
        drillId: drill.id,
        attempts: 0,
        lastOutcome: null,
        lastAttemptAt: null,
        completed: false,
        xpEarned: 0,
      } as DrillProgress,
    }));

    res.json(drillsWithProgress);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database Error' });
  }
});

// GET /api/drills/drill/:id (Single Drill)
router.get('/drill/:id', (req, res) => {
  try {
    const drill = getDrillById(req.params.id);
    if (!drill) {
      return res.status(404).json({ error: 'Drill not found' });
    }
    res.json(drill);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database Error' });
  }
});

// PATCH /api/drills/:id/attempt (Record Outcome)
// SECURITY: This endpoint is the choke point for credential exfiltration prevention.
// - AttemptSchema.strict() rejects any extra fields (email, password, etc.)
// - auditLog() records only drillId + outcome, never typed content
router.patch('/:id/attempt', (req, res) => {
  const requestId = randomUUID();
  const drillId = req.params.id;

  try {
    // Zod .strict() will throw if ANY extra fields are present
    const { outcome } = AttemptSchema.parse(req.body);
    
    // Audit-safe logging: only drillId, outcome, timestamp, requestId
    auditLog('DRILL_ATTEMPT', { requestId, drillId, outcome });

    const result = recordDrillAttempt(drillId, outcome as DrillOutcome);
    res.json(result);
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'DRILL_NOT_FOUND') {
      auditLog('DRILL_ATTEMPT_NOT_FOUND', { requestId, drillId });
      return res.status(404).json({ error: 'Drill not found' });
    }
    
    // Log validation failure (potential attack attempt) but NOT the payload contents
    auditLog('DRILL_ATTEMPT_REJECTED', { requestId, drillId, reason: 'validation_failed' });
    
    // Return 422 Unprocessable Entity for validation errors (matches FastAPI convention)
    res.status(422).json({ error: 'Validation Failed', message: 'Unexpected fields in request body' });
  }
});

export default router;
