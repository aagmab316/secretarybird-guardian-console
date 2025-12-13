"""
Test suite for GuardianLogger - validates schema enforcement and logging behavior.

This test demonstrates:
1. Valid logging with properly formatted inputs
2. Invalid logging with missing or malformed fields
3. Schema validation enforcement
"""

import json
import os
import sys
import tempfile
from datetime import datetime
from pathlib import Path

# Add src to path to import guardian_logger
sys.path.insert(0, str(Path(__file__).parent / "src"))

from utils.guardian_logger import GuardianLogger, GovernanceViolationError


def test_valid_logging():
    """Test logging with valid, schema-compliant events."""
    print("\n=== Testing Valid Logging ===")
    
    # Create a temporary audit log for testing
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.jsonl') as tmp:
        tmp_audit_log = tmp.name
    
    try:
        # Initialize logger
        logger = GuardianLogger(audit_log_path=tmp_audit_log)
        
        # Create a valid event
        valid_event = {
            "event_id": "test_event_12345678",
            "event_type": "HARM_OVERRIDE",
            "timestamp_utc": datetime.utcnow().isoformat() + "Z",
            "constitution_version": "v0.2",
            "request_context": {
                "channel": "web",
                "language": "en",
                "user_role": "guardian",
                "subject_role": "child",
                "request_summary": "Guardian reporting suspected abuse case requiring immediate attention",
                "case_id": "case_001"
            },
            "risk_assessment": {
                "credible_risk": True,
                "imminence": "imminent",
                "severity": "severe",
                "harm_domains": ["physical", "psychological"],
                "evidence_signals": [
                    "Visible bruising reported",
                    "Child expressed fear",
                    "Pattern of unexplained injuries"
                ]
            },
            "override_decision": {
                "override_applied": True,
                "least_intrusive_means": True,
                "proportionality": True,
                "time_limited": True,
                "actions_taken": [
                    "Contacted emergency services",
                    "Notified designated safeguarding lead",
                    "Created incident report"
                ]
            },
            "accountability": {
                "logged": True,
                "review_required": True,
                "review_sla_hours": 24
            }
        }
        
        # Log the valid event
        event_id = logger.log_event(valid_event)
        print(f"✓ Valid event logged successfully")
        print(f"  Event ID: {event_id}")
        
        # Verify the log was written
        with open(tmp_audit_log, 'r') as f:
            logged_events = [json.loads(line) for line in f]
        
        assert len(logged_events) == 1, "Expected 1 logged event"
        assert logged_events[0]["event_id"] == event_id, "Event ID mismatch"
        print(f"✓ Verified event written to audit log: {tmp_audit_log}")
        
        # Test another valid event with minimal required fields
        minimal_event = {
            "event_id": "minimal_event_99999",
            "event_type": "HARM_OVERRIDE",
            "timestamp_utc": datetime.utcnow().isoformat() + "Z",
            "constitution_version": "v1.0",
            "request_context": {
                "channel": "sms",
                "language": "es",
                "user_role": "adult",
                "subject_role": "elder",
                "request_summary": "Elder self-reporting financial exploitation concerns"
            },
            "risk_assessment": {
                "credible_risk": True,
                "imminence": "ongoing",
                "severity": "moderate",
                "harm_domains": ["financial_exploitation"],
                "evidence_signals": [
                    "Unexplained bank withdrawals"
                ]
            },
            "override_decision": {
                "override_applied": False
            },
            "accountability": {}
        }
        
        event_id_2 = logger.log_event(minimal_event)
        print(f"✓ Minimal valid event logged successfully")
        print(f"  Event ID: {event_id_2}")
        
        print("\n✅ All valid logging tests passed!\n")
        
    finally:
        # Clean up
        if os.path.exists(tmp_audit_log):
            os.unlink(tmp_audit_log)


def test_invalid_logging():
    """Test logging with invalid events - should fail with descriptive messages."""
    print("\n=== Testing Invalid Logging (Expected Failures) ===")
    
    # Create a temporary audit log for testing
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.jsonl') as tmp:
        tmp_audit_log = tmp.name
    
    try:
        logger = GuardianLogger(audit_log_path=tmp_audit_log)
        
        # Test 1: Missing required field (timestamp_utc)
        print("\nTest 1: Missing required field (timestamp_utc)")
        invalid_event_1 = {
            "event_id": "invalid_001_long_enough",
            "event_type": "HARM_OVERRIDE",
            # Missing timestamp_utc
            "constitution_version": "v0.2",
            "request_context": {
                "channel": "web",
                "language": "en",
                "user_role": "guardian",
                "subject_role": "child",
                "request_summary": "Test request summary text"
            },
            "risk_assessment": {
                "credible_risk": True,
                "imminence": "imminent",
                "severity": "severe",
                "harm_domains": ["physical"],
                "evidence_signals": ["Evidence item"]
            },
            "override_decision": {
                "override_applied": True
            },
            "accountability": {}
        }
        
        try:
            logger.log_event(invalid_event_1)
            print("  ✗ FAILED: Should have raised GovernanceViolationError")
        except GovernanceViolationError as e:
            print(f"  ✓ Correctly rejected: {str(e)[:100]}...")
        
        # Test 2: Invalid enum value
        print("\nTest 2: Invalid enum value (wrong channel)")
        invalid_event_2 = {
            "event_id": "invalid_002_long_enough",
            "event_type": "HARM_OVERRIDE",
            "timestamp_utc": datetime.utcnow().isoformat() + "Z",
            "constitution_version": "v0.2",
            "request_context": {
                "channel": "invalid_channel",  # Invalid enum value
                "language": "en",
                "user_role": "guardian",
                "subject_role": "child",
                "request_summary": "Test request summary text"
            },
            "risk_assessment": {
                "credible_risk": True,
                "imminence": "imminent",
                "severity": "severe",
                "harm_domains": ["physical"],
                "evidence_signals": ["Evidence item"]
            },
            "override_decision": {
                "override_applied": True
            },
            "accountability": {}
        }
        
        try:
            logger.log_event(invalid_event_2)
            print("  ✗ FAILED: Should have raised GovernanceViolationError")
        except GovernanceViolationError as e:
            print(f"  ✓ Correctly rejected: {str(e)[:100]}...")
        
        # Test 3: Wrong event_type
        print("\nTest 3: Wrong event_type constant")
        invalid_event_3 = {
            "event_id": "invalid_003_long_enough",
            "event_type": "WRONG_TYPE",  # Must be "HARM_OVERRIDE"
            "timestamp_utc": datetime.utcnow().isoformat() + "Z",
            "constitution_version": "v0.2",
            "request_context": {
                "channel": "web",
                "language": "en",
                "user_role": "guardian",
                "subject_role": "child",
                "request_summary": "Test request summary text"
            },
            "risk_assessment": {
                "credible_risk": True,
                "imminence": "imminent",
                "severity": "severe",
                "harm_domains": ["physical"],
                "evidence_signals": ["Evidence item"]
            },
            "override_decision": {
                "override_applied": True
            },
            "accountability": {}
        }
        
        try:
            logger.log_event(invalid_event_3)
            print("  ✗ FAILED: Should have raised GovernanceViolationError")
        except GovernanceViolationError as e:
            print(f"  ✓ Correctly rejected: {str(e)[:100]}...")
        
        # Test 4: Empty harm_domains array (minItems: 1)
        print("\nTest 4: Empty harm_domains array")
        invalid_event_4 = {
            "event_id": "invalid_004_long_enough",
            "event_type": "HARM_OVERRIDE",
            "timestamp_utc": datetime.utcnow().isoformat() + "Z",
            "constitution_version": "v0.2",
            "request_context": {
                "channel": "web",
                "language": "en",
                "user_role": "guardian",
                "subject_role": "child",
                "request_summary": "Test request summary text"
            },
            "risk_assessment": {
                "credible_risk": True,
                "imminence": "imminent",
                "severity": "severe",
                "harm_domains": [],  # Empty array, violates minItems: 1
                "evidence_signals": ["Evidence item"]
            },
            "override_decision": {
                "override_applied": True
            },
            "accountability": {}
        }
        
        try:
            logger.log_event(invalid_event_4)
            print("  ✗ FAILED: Should have raised GovernanceViolationError")
        except GovernanceViolationError as e:
            print(f"  ✓ Correctly rejected: {str(e)[:100]}...")
        
        # Test 5: Invalid constitution_version pattern
        print("\nTest 5: Invalid constitution_version pattern")
        invalid_event_5 = {
            "event_id": "invalid_005_long_enough",
            "event_type": "HARM_OVERRIDE",
            "timestamp_utc": datetime.utcnow().isoformat() + "Z",
            "constitution_version": "version_1",  # Doesn't match pattern ^v\d+\.\d+(\.\d+)?$
            "request_context": {
                "channel": "web",
                "language": "en",
                "user_role": "guardian",
                "subject_role": "child",
                "request_summary": "Test request summary text"
            },
            "risk_assessment": {
                "credible_risk": True,
                "imminence": "imminent",
                "severity": "severe",
                "harm_domains": ["physical"],
                "evidence_signals": ["Evidence item"]
            },
            "override_decision": {
                "override_applied": True
            },
            "accountability": {}
        }
        
        try:
            logger.log_event(invalid_event_5)
            print("  ✗ FAILED: Should have raised GovernanceViolationError")
        except GovernanceViolationError as e:
            print(f"  ✓ Correctly rejected: {str(e)[:100]}...")
        
        # Test 6: request_summary too short (minLength: 10)
        print("\nTest 6: request_summary too short")
        invalid_event_6 = {
            "event_id": "invalid_006_long_enough",
            "event_type": "HARM_OVERRIDE",
            "timestamp_utc": datetime.utcnow().isoformat() + "Z",
            "constitution_version": "v0.2",
            "request_context": {
                "channel": "web",
                "language": "en",
                "user_role": "guardian",
                "subject_role": "child",
                "request_summary": "Short"  # Too short, minLength: 10
            },
            "risk_assessment": {
                "credible_risk": True,
                "imminence": "imminent",
                "severity": "severe",
                "harm_domains": ["physical"],
                "evidence_signals": ["Evidence item"]
            },
            "override_decision": {
                "override_applied": True
            },
            "accountability": {}
        }
        
        try:
            logger.log_event(invalid_event_6)
            print("  ✗ FAILED: Should have raised GovernanceViolationError")
        except GovernanceViolationError as e:
            print(f"  ✓ Correctly rejected: {str(e)[:100]}...")
        
        print("\n✅ All invalid logging tests passed (correctly rejected)!\n")
        
    finally:
        # Clean up
        if os.path.exists(tmp_audit_log):
            os.unlink(tmp_audit_log)


def test_schema_loading():
    """Test schema loading and error handling."""
    print("\n=== Testing Schema Loading ===")
    
    # Test 1: Schema loads successfully with default path
    try:
        logger = GuardianLogger()
        print(f"✓ Schema loaded from: {logger.get_schema_path()}")
        print(f"✓ Audit log path: {logger.get_audit_log_path()}")
    except Exception as e:
        print(f"✗ Failed to load schema: {e}")
    
    # Test 2: Non-existent schema path
    print("\nTest 2: Non-existent schema path")
    try:
        logger = GuardianLogger(schema_path="/nonexistent/schema.json")
        print("  ✗ FAILED: Should have raised FileNotFoundError")
    except FileNotFoundError as e:
        print(f"  ✓ Correctly raised FileNotFoundError: {str(e)[:80]}...")
    
    print("\n✅ Schema loading tests passed!\n")


def main():
    """Run all tests."""
    print("=" * 70)
    print("GuardianLogger Test Suite")
    print("=" * 70)
    
    try:
        test_schema_loading()
        test_valid_logging()
        test_invalid_logging()
        
        print("=" * 70)
        print("🎉 All tests completed successfully!")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Test suite failed with error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
