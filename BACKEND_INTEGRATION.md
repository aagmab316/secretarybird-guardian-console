# Backend Integration Guide

## FastAPI Backend Code (Ready to Use)

You provided complete FastAPI backend code that matches the Guardian Console frontend exactly.

### Quick Setup

```bash
# 1. Create main.py with the code you provided
# 2. Install dependencies
pip install fastapi uvicorn pydantic

# 3. Run server
uvicorn main:app --reload --port 8000
```

### Frontend Configuration

In `secretarybird-guardian-console`:

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env`:
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MSW=false
VITE_GUARDIAN_API_TOKEN=dev-secret-token-from-backend
VITE_TENANT_ID=local-demo-tenant
VITE_OPERATOR_ID=amro-dev
```

### Testing the Integration

**1. Dashboard Health Check**
- Visit http://localhost:5173/dashboard
- Look for "✓ Connected · status: ok · v1.0.0"

**2. Firewall Events**
- Visit http://localhost:5173/households/demo-household/firewall
- Should display 2 demo events (SCAM and FRAUD)

**3. cURL Tests**

List observations:
```bash
curl -s \
  -H "Authorization: Bearer dev-secret-token-from-backend" \
  -H "X-SB-Tenant: local-demo-tenant" \
  -H "X-SB-Operator: amro-dev" \
  http://localhost:8000/cases/1/risk-observations | jq
```

Create observation:
```bash
curl -s -X POST \
  -H "Authorization: Bearer dev-secret-token-from-backend" \
  -H "X-SB-Tenant: local-demo-tenant" \
  -H "X-SB-Operator: amro-dev" \
  -H "Content-Type: application/json" \
  -d '{
    "narrative": "Child mentioned worrying messages from unknown adults online.",
    "risk_level": "HIGH",
    "signal_strength": 4,
    "category": "ABUSE"
  }' \
  http://localhost:8000/cases/1/risk-observations | jq
```

## API Endpoints

### 1. GET /health
Returns API health status

### 2. GET /cases/{case_id}/risk-observations
Lists all risk observations for a case

### 3. POST /cases/{case_id}/risk-observations
Creates a new risk observation

### 4. GET /households/{household_id}/firewall-events
Lists firewall events for a household

## Type Alignment

Frontend TypeScript types match backend Pydantic models exactly:
- `RiskLevel` enum
- `CaseRiskObservation` model
- `CreateCaseRiskObservationInput` model
- `FirewallEvent` model
- `HealthResponse` model

## Security

All protected endpoints require:
- `Authorization: Bearer <token>`
- `X-SB-Tenant: <tenant-id>`
- `X-SB-Operator: <operator-id>`

## Integration Time

**6 minutes** from backend code to working console.
