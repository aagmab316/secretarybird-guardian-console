# 📘 Secretarybird Engineering Runbook

## 🖥️ Native Windows Startup (Preferred)

The "Phantom Listen" bug in Windows/VS Code requires starting the backend in a **separate window** using `Start-Process`.

### Quick Start (Backend)
```powershell
cd E:\Seceretarybird\secretarybird-guardian-console
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d E:\Seceretarybird\secretarybird-guardian-console && npx tsx backend/src/server.ts" -WindowStyle Normal
```

This opens a **new cmd window** that stays alive. Wait 2-3 seconds, then verify:

```powershell
curl.exe http://127.0.0.1:3001/health
# Expected: {"status":"ok","version":"0.9.1-governance"}
```

### Why Start-Process?
VS Code's integrated terminal has process lifecycle issues on Windows. Spawning the server in a separate window keeps it alive.

---

## 🐳 Docker Startup (Alternative)

If native Windows still fails, use Docker to bypass Windows firewall/WFP issues.

### Quick Start
```powershell
cd secretarybird-guardian-console
docker-compose up --build -d
```

### Verify
```powershell
curl.exe http://localhost:3001/health
# Expected: {"status":"ok","version":"0.9.1-governance"}
```

### Watch Logs
```powershell
docker-compose logs -f
```

### Stop Container
```powershell
docker-compose down
```

---

## 🚀 Full Startup Sequence

### 1. Start Backend (Native Windows)
```powershell
cd E:\Seceretarybird\secretarybird-guardian-console
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d E:\Seceretarybird\secretarybird-guardian-console && npx tsx backend/src/server.ts" -WindowStyle Normal
```

### 2. Start Frontend (Vite)
```powershell
cd secretarybird-care-website
pnpm dev
```

**Access:** [http://localhost:5173/family/inoculator](http://localhost:5173/family/inoculator)

---

## 🧪 Seed Demo Data

```powershell
curl.exe -X POST http://127.0.0.1:3001/api/drills -H "Content-Type: application/json" -d '{\"tenantId\": \"family-demo\", \"title\": \"Welcome Drill\", \"description\": \"Learn to spot a fake login page.\", \"difficulty\": 1}'
```

---

## 🚑 Troubleshooting: Windows "Phantom Listen"

If the backend logs "listening" but `curl` fails:

### 1. Check Listener
```powershell
netstat -ano | findstr ":3001"
```
**Must show `LISTENING`**. If not, the process died silently.

### 2. Use Start-Process (The Fix)
The VS Code terminal doesn't keep Node processes alive properly. Use:
```powershell
Start-Process -FilePath "cmd" -ArgumentList "/k", "npx tsx backend/src/server.ts" -WindowStyle Normal
```

### 3. Firewall Rules (If Needed)
Run in **elevated PowerShell**:
```powershell
$n=(Get-Command node.exe).Source; $r='Secretarybird Allow Node (All Ports)'; Remove-NetFirewallRule -DisplayName $r -ErrorAction SilentlyContinue; New-NetFirewallRule -DisplayName $r -Direction Inbound -Action Allow -Program $n -Profile Domain,Private,Public; Get-NetFirewallRule -DisplayName $r
```

---

## 📋 Quick Reference

| Task | Command |
|------|---------|
| Start backend (native) | `Start-Process -FilePath "cmd" -ArgumentList "/k", "npx tsx backend/src/server.ts"` |
| Start backend (Docker) | `docker-compose up -d` |
| Stop backend (Docker) | `docker-compose down` |
| Health check | `curl.exe http://127.0.0.1:3001/health` |
| List drills | `curl.exe http://127.0.0.1:3001/api/drills/family-demo` |
| Check listener | `netstat -ano \| findstr ":3001"` |
| Check firewall | `Get-NetFirewallRule -DisplayName 'Secretarybird*'` |

---

*Last updated: v0.9.3 (December 2025)*
