import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import Ajv from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { appendFile, mkdir } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Governance Auth Guard (Fail-Closed)
const getGovernanceKey = () => {
  const key = process.env.SB_GOVERNANCE_API_KEY;
  if (!key) {
    throw new Error(
      "CRITICAL: SB_GOVERNANCE_API_KEY is not set. Governance endpoint cannot function."
    );
  }
  return key;
};

if (!getGovernanceKey()) {
  throw new Error(
    "CRITICAL: SB_GOVERNANCE_API_KEY is not set. Governance endpoint cannot start."
  );
}

/**
 * Constant-time comparison to prevent timing attacks
 */
function isValidGovernanceKey(providedKey: string): boolean {
  try {
    const a = Buffer.from(providedKey);
    const b = Buffer.from(getGovernanceKey()!); // Non-null assertion safe due to check above

    // timingSafeEqual throws if lengths differ
    if (a.length !== b.length) return false;

    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Middleware: Enforce Governance Key
 */
function requireGovernanceKey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const providedKey = req.header("X-Governance-Key");

  if (!providedKey || typeof providedKey !== 'string' || !isValidGovernanceKey(providedKey)) {
    // SECURITY: Do NOT log the key itself
    console.warn("[GOVERNANCE] Unauthorized attempt", {
      ip: req.ip,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });

    return res.status(401).json({
      error: "Access Denied: Invalid Governance Key",
    });
  }

  next();
}

// Load the Single Source of Truth Schema
// We use readFileSync because this is a critical startup dependency.
// If the schema is missing, the app should crash or fail to start this route.
const SCHEMA_PATH = path.resolve(__dirname, "../../../governance/HARM_OVERRIDE_EVENT_SCHEMA.json");
const schemaJson = JSON.parse(readFileSync(SCHEMA_PATH, "utf-8"));

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schemaJson);

function makeEventId(): string {
  // Not cryptographic, just unique-enough for audit correlation.
  return `SB-LOG-${Math.random().toString(16).slice(2, 10)}${Date.now().toString(16)}`;
}

// --- Cryptographic Integrity Helpers ---

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);

  if (Array.isArray(value)) {
    return "[" + value.map(stableStringify).join(",") + "]";
  }

  const keys = Object.keys(value).sort();
  const entries = keys.map((k) => JSON.stringify(k) + ":" + stableStringify(value[k]));
  return "{" + entries.join(",") + "}";
}

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function calculateEventHash(payloadWithoutIntegrity: unknown, previousHash: string): string {
  // Canonical, deterministic content
  const canonical = stableStringify(payloadWithoutIntegrity);
  return sha256Hex(canonical + previousHash);
}

const GENESIS_HASH = "0".repeat(64);

function getLastEventHash(logPath: string): string {
  if (!existsSync(logPath)) return GENESIS_HASH;

  const content = readFileSync(logPath, "utf-8").trim();
  if (!content) return GENESIS_HASH;

  const lines = content.split("\n");
  const last = lines[lines.length - 1];

  try {
    const lastEvent = JSON.parse(last);
    const h = lastEvent?.cryptographic_integrity?.event_hash;

    // If chain is corrupt, fail-closed (do not write further)
    if (typeof h !== "string" || !/^[a-f0-9]{64}$/.test(h)) {
      throw new Error("CRITICAL: Audit log chain corrupted or missing hash; refusing to append.");
    }
    return h;
  } catch {
    // If we can't parse the last line, the log is corrupt.
    throw new Error("CRITICAL: Audit log corrupted (parse error); refusing to append.");
  }
}

// 2. Audit Log Path Resolution
const REPO_ROOT = process.cwd();
const GOVERNANCE_LOG_FILE = process.env.SB_AUDIT_LOG_PATH
  ? path.resolve(process.env.SB_AUDIT_LOG_PATH)
  : path.join(REPO_ROOT, "audit_events.jsonl");

console.log("[GOVERNANCE] CWD:", process.cwd());
console.log("[GOVERNANCE] Audit log path:", GOVERNANCE_LOG_FILE);

router.post("/governance/harm-override/log", requireGovernanceKey, async (req, res) => {
  const body = req.body;

  // Construct the full event payload FIRST.
  // This ensures we validate exactly what we intend to write to the immutable log.
  // We map the flat API request body to the nested Schema structure.
  const event_id = makeEventId();
  const ts = new Date().toISOString();

  const draftPayload = {
    event_id,
    event_type: "HARM_OVERRIDE",
    timestamp_utc: ts,
    constitution_version: process.env.SB_CONSTITUTION_VERSION ?? "v0.1",
    request_context: {
      channel: body.channel ?? "api",
      language: body.language ?? "en",
      user_role: body.user_role,
      subject_role: body.subject_role,
      request_summary: body.summary,
      case_id: body.case_id ?? null,
    },
    risk_assessment: body.risk_assessment,
    override_decision: {
      override_applied: body.override_applied ?? true, // Default to true if omitted, as per previous logic
      least_intrusive_means: body.least_intrusive_means,
      proportionality: body.proportionality,
      time_limited: body.time_limited,
      actions_taken: body.actions_taken,
    },
    accountability: {
      logged: true,
      log_sink: "file_append_only",
      review_required: true,
      review_sla_hours: 24,
    },
  };

  // Fail closed: if we can't write the log, we refuse to acknowledge override.
  try {
    const logPath = GOVERNANCE_LOG_FILE;
    
    // 1. Read Previous Hash (Fail-Closed if corrupt)
    const previousHash = getLastEventHash(logPath);

    // 2. Calculate Current Hash
    const currentHash = calculateEventHash(draftPayload, previousHash);

    // 3. Attach Integrity Block
    const finalPayload = {
      ...draftPayload,
      cryptographic_integrity: {
        hash_algorithm: "SHA-256",
        previous_event_hash: previousHash,
        event_hash: currentHash,
        signature: null // Placeholder for future signing
      }
    };

    // 4. Validate the FULL payload (including integrity) against the Single Source of Truth
    const valid = validate(finalPayload);

    if (!valid) {
      return res.status(400).json({
        ok: false,
        error: "Governance Schema Violation(s)",
        details: validate.errors,
      });
    }

    const parent = path.dirname(logPath);
    if (parent && parent !== ".") {
      await mkdir(parent, { recursive: true });
    }
    await appendFile(logPath, `${JSON.stringify(finalPayload)}\n`, { encoding: "utf-8" });

    return res.status(200).json({ ok: true, event_id });
  } catch (err) {
    console.error("Audit Log Write Failed:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to write governance audit log",
    });
  }
});

export { router as governanceRouter };




