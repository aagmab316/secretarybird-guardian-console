import { Router } from "express";
import Ajv from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { appendFile, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

router.post("/governance/harm-override/log", async (req, res) => {
  const body = req.body;

  // Construct the full event payload FIRST.
  // This ensures we validate exactly what we intend to write to the immutable log.
  // We map the flat API request body to the nested Schema structure.
  const event_id = makeEventId();
  const ts = new Date().toISOString();

  const payload = {
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

  // Validate the FULL payload against the Single Source of Truth
  const valid = validate(payload);

  if (!valid) {
    return res.status(400).json({
      ok: false,
      error: "Governance Schema Violation(s)",
      details: validate.errors,
    });
  }

  // Fail closed: if we can't write the log, we refuse to acknowledge override.
  try {
    const logPath = process.env.SB_AUDIT_LOG_PATH ?? "audit_events.jsonl";
    const parent = path.dirname(logPath);
    if (parent && parent !== ".") {
      await mkdir(parent, { recursive: true });
    }
    await appendFile(logPath, `${JSON.stringify(payload)}\n`, { encoding: "utf-8" });

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
