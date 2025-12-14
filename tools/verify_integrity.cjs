const fs = require("fs");
const crypto = require("crypto");

const LOG_FILE = process.env.SB_AUDIT_LOG_PATH || "audit_events.jsonl";
const GENESIS_HASH = "0".repeat(64);

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  const keys = Object.keys(value).sort();
  return "{" + keys.map(k => JSON.stringify(k) + ":" + stableStringify(value[k])).join(",") + "}";
}

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function calculateHash(payloadWithoutIntegrity, prevHash) {
  return sha256Hex(stableStringify(payloadWithoutIntegrity) + prevHash);
}

if (!fs.existsSync(LOG_FILE)) {
  console.log("No audit log found to verify.");
  process.exit(0);
}

const content = fs.readFileSync(LOG_FILE, "utf-8").trim();
if (!content) {
  console.log("Audit log is empty.");
  process.exit(0);
}

const lines = content.split("\n");
let previousHash = GENESIS_HASH;

console.log(`🔍 Scanning ${lines.length} events for integrity...\n`);

for (let i = 0; i < lines.length; i++) {
  const lineNum = i + 1;
  const line = lines[i];

  let event;
  try {
    event = JSON.parse(line);
  } catch (e) {
    console.error(`❌ PARSE ERROR at Line ${lineNum}: ${e.message}`);
    process.exit(1);
  }

  const integrity = event.cryptographic_integrity;
  if (!integrity) {
    console.error(`❌ Missing cryptographic_integrity at Line ${lineNum}`);
    process.exit(1);
  }

  if (integrity.hash_algorithm !== "SHA-256") {
    console.error(`❌ Invalid algorithm at Line ${lineNum}: ${integrity.hash_algorithm}`);
    process.exit(1);
  }

  if (integrity.previous_event_hash !== previousHash) {
    console.error(`❌ BROKEN CHAIN at Line ${lineNum}`);
    console.error(`   Expected Prev: ${previousHash}`);
    console.error(`   Found Prev:    ${integrity.previous_event_hash}`);
    process.exit(1);
  }

  const { cryptographic_integrity, ...payload } = event;
  const calculated = calculateHash(payload, previousHash);

  if (calculated !== integrity.event_hash) {
    console.error(`❌ TAMPERING DETECTED at Line ${lineNum}`);
    console.error(`   Stored Hash:     ${integrity.event_hash}`);
    console.error(`   Calculated Hash: ${calculated}`);
    process.exit(1);
  }

  previousHash = integrity.event_hash;
}

console.log(`✅ INTEGRITY CONFIRMED. ${lines.length} events verified. Chain unbroken.`);
console.log(`🔒 Final Tip Hash: ${previousHash}`);
