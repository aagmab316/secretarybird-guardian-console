"""
GuardianLogger - Schema-compliant audit logger for SecretaryBird governance events.

This module provides secure, schema-validated logging for Harm Override events,
ensuring all logged events adhere to the constitutional governance rules.
"""

import json
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

try:
    from jsonschema import validate, ValidationError as JsonSchemaValidationError
except ImportError:
    raise ImportError(
        "jsonschema library is required. Install it with: pip install jsonschema"
    )


class GovernanceViolationError(Exception):
    """Raised when a log entry violates governance schema requirements."""
    pass


class GuardianLogger:
    """
    Schema-compliant logger for SecretaryBird Harm Override events.
    
    This logger enforces strict adherence to the HARM_OVERRIDE_EVENT_SCHEMA,
    ensuring all logged events maintain constitutional compliance and auditability.
    """
    
    def __init__(self, schema_path: str = None, audit_log_path: str = None):
        """
        Initialize the GuardianLogger.
        
        Args:
            schema_path: Path to HARM_OVERRIDE_EVENT_SCHEMA.json
                        Defaults to governance/HARM_OVERRIDE_EVENT_SCHEMA.json
            audit_log_path: Path to audit log file (JSONL format)
                           Defaults to audit_events.jsonl in current directory
        """
        # Determine project root
        current_file = Path(__file__).resolve()
        project_root = current_file.parent.parent.parent
        
        # Set default paths
        if schema_path is None:
            schema_path = project_root / "governance" / "HARM_OVERRIDE_EVENT_SCHEMA.json"
        else:
            schema_path = Path(schema_path)
            
        if audit_log_path is None:
            audit_log_path = project_root / "audit_events.jsonl"
        else:
            audit_log_path = Path(audit_log_path)
        
        self.schema_path = schema_path
        self.audit_log_path = audit_log_path
        
        # Load the schema
        self.schema = self._load_schema()
        
        # Ensure audit log directory exists
        self.audit_log_path.parent.mkdir(parents=True, exist_ok=True)
    
    def _load_schema(self) -> Dict[str, Any]:
        """
        Load the HARM_OVERRIDE_EVENT_SCHEMA from the governance directory.
        
        Returns:
            The loaded JSON schema
            
        Raises:
            FileNotFoundError: If schema file doesn't exist
            json.JSONDecodeError: If schema is not valid JSON
        """
        if not self.schema_path.exists():
            raise FileNotFoundError(
                f"Schema file not found: {self.schema_path}. "
                f"Ensure HARM_OVERRIDE_EVENT_SCHEMA.json exists in the governance directory."
            )
        
        with open(self.schema_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def validate_event(self, event_data: Dict[str, Any]) -> None:
        """
        Validate an event payload against the HARM_OVERRIDE_EVENT_SCHEMA.
        
        Args:
            event_data: The event payload to validate
            
        Raises:
            GovernanceViolationError: If the event doesn't meet schema requirements
        """
        try:
            validate(instance=event_data, schema=self.schema)
        except JsonSchemaValidationError as e:
            raise GovernanceViolationError(
                f"Event payload violates governance schema: {e.message}. "
                f"Path: {' -> '.join(str(p) for p in e.path) if e.path else 'root'}"
            ) from e
    
    def log_event(self, event_data: Dict[str, Any]) -> str:
        """
        Validate and log a Harm Override event to the secure audit log.
        
        Args:
            event_data: The event payload to log
            
        Returns:
            The event_id of the logged event
            
        Raises:
            GovernanceViolationError: If the event doesn't meet schema requirements
        """
        # Validate the event before logging
        self.validate_event(event_data)
        
        # Generate audit log ID if not present
        event_id = event_data.get('event_id')
        if not event_id:
            event_id = str(uuid.uuid4())
            event_data['event_id'] = event_id
        
        # Append to audit log in JSONL format
        with open(self.audit_log_path, 'a', encoding='utf-8') as f:
            json.dump(event_data, f, ensure_ascii=False)
            f.write('\n')
        
        return event_id
    
    def get_audit_log_path(self) -> Path:
        """Get the path to the audit log file."""
        return self.audit_log_path
    
    def get_schema_path(self) -> Path:
        """Get the path to the schema file."""
        return self.schema_path


def create_logger(schema_path: str = None, audit_log_path: str = None) -> GuardianLogger:
    """
    Factory function to create a GuardianLogger instance.
    
    Args:
        schema_path: Optional path to schema file
        audit_log_path: Optional path to audit log file
        
    Returns:
        Configured GuardianLogger instance
    """
    return GuardianLogger(schema_path=schema_path, audit_log_path=audit_log_path)
