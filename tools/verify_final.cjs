#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const LOG_FILE = path.join(__dirname, "../audit_events.jsonl");
const BODY_FILE = path.join(__dirname, "../valid_body.json");
const PORT = 3001;
const API_URL = `http://127.0.0.1:${PORT}/api/governance/harm-override/log`;
const GOVERNANCE_KEY = process.env.SB_GOVERNANCE_API_KEY || "test-secret-key-12345-must-be-long-enough";

let backendProcess = null;

function log(msg) {
  console.log(`[VERIFY] ${msg}`);
}

function error(msg) {
  console.error(`[ERROR] ${msg}`);
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startBackend() {
  return new Promise((resolve, reject) => {
    log("Starting backend...");
    process.env.SB_GOVERNANCE_API_KEY = GOVERNANCE_KEY;
    
    backendProcess = spawn("npx.cmd", ["tsx", "backend/src/server.ts"], {
      stdio: "pipe",
      shell: true,
      cwd: path.join(__dirname, "..")
    });

    let startupTimeout = setTimeout(() => {
      if (backendProcess) {
        backendProcess.kill();
      }
      reject(new Error("Backend startup timeout"));
    }, 15000);

    backendProcess.stdout.on("data", (data) => {
      const msg = data.toString();
      if (msg.includes("listening") || msg.includes("started") || msg.includes("ready")) {
        clearTimeout(startupTimeout);
        log("Backend started ✅");
        resolve();
      }
    });

    backendProcess.stderr.on("data", (data) => {
      // Ignore compilation noise
    });

    backendProcess.on("error", (err) => {
      clearTimeout(startupTimeout);
      reject(err);
    });
  });
}

async function stopBackend() {
  if (backendProcess) {
    log("Stopping backend...");
    backendProcess.kill("SIGTERM");
    await wait(1000);
    if (backendProcess && !backendProcess.killed) {
      backendProcess.kill("SIGKILL");
    }
  }
}

async function httpRequest(method, url, headers, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const https = require("https");
    const http = require("http");
    const client = urlObj.protocol === "https:" ? https : http;

    const options = {
      method,
      headers: { ...headers, "Content-Type": "application/json" }
    };

    if (body) {
      options.headers["Content-Length"] = Buffer.byteLength(body);
    }

    const req = client.request(url, options, (res) => {
      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function testWrongKey() {
  log("Test B: Wrong Key...");
  const body = fs.readFileSync(BODY_FILE, "utf-8");
  try {
    const result = await httpRequest("POST", API_URL, {
      "X-Governance-Key": "WRONG_KEY"
    }, body);
    
    if (result.status === 401) {
      log("✅ 401 Unauthorized (correct response)");
      return true;
    } else {
      error(`Expected 401, got ${result.status}`);
      return false;
    }
  } catch (err) {
    error(`Request failed: ${err.message}`);
    return false;
  }
}

async function testCorrectKey() {
  log("Test C: Correct Key...");
  const body = fs.readFileSync(BODY_FILE, "utf-8");
  try {
    const result = await httpRequest("POST", API_URL, {
      "X-Governance-Key": GOVERNANCE_KEY
    }, body);

    if (result.status === 200) {
      try {
        const response = JSON.parse(result.body);
        if (response.ok && response.event_id) {
          log(`✅ 200 OK with event_id: ${response.event_id}`);
          return true;
        }
      } catch (e) {
        error(`Invalid response JSON: ${result.body}`);
        return false;
      }
    } else {
      error(`Expected 200, got ${result.status}. Body: ${result.body}`);
      return false;
    }
  } catch (err) {
    error(`Request failed: ${err.message}`);
    return false;
  }
}

async function testAuditWrite() {
  log("Test D: Audit Write Check...");
  if (!fs.existsSync(LOG_FILE)) {
    error("Audit file not found");
    return false;
  }

  const content = fs.readFileSync(LOG_FILE, "utf-8").trim();
  if (!content) {
    error("Audit file is empty");
    return false;
  }

  const lines = content.split("\n").filter(l => l.trim());
  if (lines.length === 1) {
    log(`✅ Audit file has exactly 1 entry`);
    return true;
  } else {
    error(`Expected 1 entry, found ${lines.length}`);
    return false;
  }
}

async function main() {
  console.log("\n=== GOVERNANCE ENDPOINT VERIFICATION ===\n");

  // Clean slate
  if (fs.existsSync(LOG_FILE)) {
    fs.unlinkSync(LOG_FILE);
    log("Cleaned old audit log");
  }

  try {
    // Test A: Boot without key (fail-closed)
    log("Test A: Fail-Closed Boot (Missing Key)...");
    process.env.SB_GOVERNANCE_API_KEY = "";
    
    let bootTest = await new Promise((resolve) => {
      const testProc = spawn("npx.cmd", ["tsx", "backend/src/server.ts"], {
        stdio: "pipe",
        shell: true,
        cwd: path.join(__dirname, "..")
      });

      setTimeout(() => {
        if (testProc && !testProc.killed) {
          testProc.kill();
          resolve(false);
        }
      }, 5000);

      testProc.on("exit", (code) => {
        resolve(code !== 0); // Should exit with error
      });

      testProc.on("error", () => {
        resolve(true); // Should fail to start
      });
    });

    if (bootTest) {
      log("✅ Backend correctly fails to start without key");
    } else {
      error("Backend should have failed to start without key");
      process.exit(1);
    }

    // Set key for remaining tests
    process.env.SB_GOVERNANCE_API_KEY = GOVERNANCE_KEY;

    // Start backend
    await startBackend();
    await wait(2000);

    // Run HTTP tests
    const testB = await testWrongKey();
    await wait(500);
    const testC = await testCorrectKey();
    await wait(500);
    const testD = await testAuditWrite();

    // Summary
    console.log("\n=== VERIFICATION SUMMARY ===");
    const passed = (bootTest ? 1 : 0) + (testB ? 1 : 0) + (testC ? 1 : 0) + (testD ? 1 : 0);
    console.log(`Passed: ${passed}/4\n`);

    if (passed === 4) {
      console.log("✅ All governance verification tests PASSED");
      process.exit(0);
    } else {
      console.log("❌ Some tests failed");
      process.exit(1);
    }

  } catch (err) {
    error(`Verification failed: ${err.message}`);
    process.exit(1);
  } finally {
    await stopBackend();
  }
}

main().catch(err => {
  error(`Fatal error: ${err.message}`);
  process.exit(1);
});
