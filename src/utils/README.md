# GuardianLogger Utility

Schema-compliant audit logger for SecretaryBird governance events, ensuring all Harm Override events adhere to constitutional governance rules.

## Overview

The GuardianLogger utility provides:
- Schema validation against `HARM_OVERRIDE_EVENT_SCHEMA.json`
- Secure audit log writing in JSONL format
- Governance violation error handling
- Auditability for all logged events

## Installation

Install the required Python dependencies:

```bash
pip install -r requirements.txt
```

## Usage

### Basic Usage

```python
from src.utils.guardian_logger import GuardianLogger, GovernanceViolationError

# Initialize logger (uses default paths)
logger = GuardianLogger()

# Create a valid event
event = {
    "event_id": "unique_event_id_123456",
    "event_type": "HARM_OVERRIDE",
    "timestamp_utc": "2024-01-15T10:30:00Z",
    "constitution_version": "v0.2",
    "request_context": {
        "channel": "web",
        "language": "en",
        "user_role": "guardian",
        "subject_role": "child",
        "request_summary": "Guardian reporting suspected abuse requiring attention"
    },
    "risk_assessment": {
        "credible_risk": True,
        "imminence": "imminent",
        "severity": "severe",
        "harm_domains": ["physical", "psychological"],
        "evidence_signals": ["Visible bruising", "Child expressed fear"]
    },
    "override_decision": {
        "override_applied": True,
        "least_intrusive_means": True,
        "proportionality": True,
        "time_limited": True,
        "actions_taken": ["Contacted emergency services", "Created incident report"]
    },
    "accountability": {
        "logged": True,
        "review_required": True,
        "review_sla_hours": 24
    }
}

# Log the event
try:
    event_id = logger.log_event(event)
    print(f"Event logged successfully: {event_id}")
except GovernanceViolationError as e:
    print(f"Governance violation: {e}")
```

### Custom Paths

```python
# Use custom schema and audit log paths
logger = GuardianLogger(
    schema_path="/path/to/custom/schema.json",
    audit_log_path="/secure/location/audit.jsonl"
)
```

### Validation Only

```python
# Validate without logging
try:
    logger.validate_event(event)
    print("Event is valid")
except GovernanceViolationError as e:
    print(f"Validation failed: {e}")
```

## Schema Requirements

All events must include:
- `event_id` (string, min 16 characters)
- `event_type` (must be "HARM_OVERRIDE")
- `timestamp_utc` (ISO 8601 datetime format)
- `constitution_version` (format: v#.#.# or v#.#)
- `request_context` with:
  - `channel` (enum: web, mobile, sms, whatsapp, api, admin_console)
  - `language` (min 2 characters)
  - `user_role` (enum: child, elder, adult, guardian, staff, unknown)
  - `subject_role` (enum: child, elder, adult, unknown)
  - `request_summary` (min 10 characters)
- `risk_assessment` with:
  - `credible_risk` (boolean)
  - `imminence` (enum: imminent, ongoing, potential, unknown)
  - `severity` (enum: catastrophic, severe, moderate, low, unknown)
  - `harm_domains` (array, min 1 item)
  - `evidence_signals` (array, min 1 item)
- `override_decision` with:
  - `override_applied` (boolean)
- `accountability` (object)

See `governance/HARM_OVERRIDE_EVENT_SCHEMA.json` for complete schema details.

## Testing

Run the test suite:

```bash
python3 test_guardian.py
```

The test suite validates:
- ✓ Schema loading and initialization
- ✓ Valid event logging with complete and minimal required fields
- ✓ Invalid event rejection with descriptive error messages
- ✓ Schema enforcement for all field constraints

## Output

Events are logged to `audit_events.jsonl` in JSONL (JSON Lines) format, with one event per line:

```jsonl
{"event_id": "evt_001", "event_type": "HARM_OVERRIDE", ...}
{"event_id": "evt_002", "event_type": "HARM_OVERRIDE", ...}
```

This format enables efficient log processing and streaming.

## Security Considerations

1. **Audit Log Protection**: The `audit_events.jsonl` file contains sensitive data and should be:
   - Stored in a secure location with appropriate access controls
   - Excluded from version control (added to .gitignore)
   - Backed up regularly to tamper-proof storage
   - Monitored for unauthorized access

2. **Schema Validation**: All events are validated before writing to prevent malformed or incomplete audit records.

3. **Error Handling**: Schema violations raise `GovernanceViolationError` with descriptive messages, preventing invalid events from being logged.

## Integration

To integrate GuardianLogger into your application:

1. Import the logger:
   ```python
   from src.utils.guardian_logger import GuardianLogger, GovernanceViolationError
   ```

2. Initialize once during application startup:
   ```python
   logger = GuardianLogger()
   ```

3. Log events at critical governance checkpoints:
   ```python
   try:
       logger.log_event(harm_override_event)
   except GovernanceViolationError as e:
       # Handle validation error
       log_error(f"Failed to log governance event: {e}")
   ```

## License

Part of the SecretaryBird Guardian Console project.
