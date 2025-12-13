# 📘 Secretarybird Engineering Runbook

## 🚑 Emergency: "Connection Refused" / "Phantom Listen"

If `npm run dev` or `pnpm dev` says it's running but the browser/curl **cannot connect**:

### 1. Check Listener
```powershell
netstat -ano | findstr ":5173"
netstat -ano | findstr ":3001"
```
**Must show `LISTENING`** for your port. If it does NOT, the process isn't actually bound.

### 2. Fix Firewall (Administrator PowerShell)
Run this **single line** in an **elevated PowerShell** (Run as Administrator):

```powershell
$n=(Get-Command node.exe).Source; $r='Secretarybird Allow Node (All Ports)'; Remove-NetFirewallRule -DisplayName $r -ErrorAction SilentlyContinue; New-NetFirewallRule -DisplayName $r -Direction Inbound -Action Allow -Program $n -Profile Domain,Private; Get-NetFirewallRule -DisplayName $r
```

This creates an inbound allow rule for `node.exe` on all ports (Domain/Private profiles).

### 3. Restart the Dev Server
After adding the firewall rule, restart your dev server and re-check `netstat`.

---

## 🚀 Startup Sequence (The "Happy Path")

### 1. Start Backend (Governance Core)
```bash
cd secretarybird-guardian-console
npm run dev:backend
```

**Verify:**
```bash
curl http://127.0.0.1:3001/health
```
Expected: `{"status":"ok","version":"0.9.1-governance"}`

### 2. Start Frontend (Family App)
```bash
cd secretarybird-care-website
pnpm dev
```

**Access:** [http://127.0.0.1:5173/family/inoculator](http://127.0.0.1:5173/family/inoculator)

---

## 🧪 Verification Data (Seed)

If the UI is empty, seed the demo drill:

```bash
curl -X POST http://127.0.0.1:3001/api/drills \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "family-demo", "title": "Welcome Drill", "description": "Learn to spot a fake login page.", "difficulty": 1}'
```

Then refresh the UI at `/family/inoculator`.

---

## 🛠️ Environment Fixes Applied

### Frontend (`secretarybird-care-website`)
- **Heap size increased** to prevent Vite OOM crashes:
  - `node --max-old-space-size=4096`
- **Explicit host/port binding** to ensure firewall rules apply:
  - `--host 127.0.0.1 --port 5173`

### Backend (`secretarybird-guardian-console`)
- **ESM import extensions** (`.js`) added for Node module resolution.
- **Hardened startup** with global error traps and DB init try/catch.

---

## 📋 Quick Reference Commands

| Task | Command |
|------|---------|
| Check port listener | `netstat -ano \| findstr ":PORT"` |
| Check firewall rule | `Get-NetFirewallRule -DisplayName 'Secretarybird*'` |
| Health check backend | `curl http://127.0.0.1:3001/health` |
| List drills | `curl http://127.0.0.1:3001/api/drills/family-demo` |

---

*Last updated: v0.9.2 (December 2025)*
