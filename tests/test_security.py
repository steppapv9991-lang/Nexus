"""Tests for Security Sandbox."""

import pytest
import tempfile
from pathlib import Path

from nexus_core.security import Sandbox, SecurityPolicy, SecurityViolation, ApprovalRequired


@pytest.fixture
def sandbox():
    policy = SecurityPolicy(
        allowed_paths=["."],
        blocked_paths=["/etc/**", "~/.ssh/**"],
        allowed_commands=["ls", "cat", "grep", "git"],
        blocked_commands=["rm -rf /", "sudo"],
        require_approval=["rm", "mv"],
    )
    return Sandbox(policy)


def test_validate_path_allowed(sandbox):
    """Test that allowed paths pass validation."""
    with tempfile.TemporaryDirectory() as tmpdir:
        # This should pass
        result = sandbox.validate_path(tmpdir, "read")
        assert result is True


def test_validate_path_blocked(sandbox):
    """Test that blocked paths raise SecurityViolation."""
    with pytest.raises(SecurityViolation):
        sandbox.validate_path("/etc/passwd", "read")


def test_validate_command_allowed(sandbox):
    """Test that allowed commands pass validation."""
    is_safe, reason = sandbox.validate_command("ls -la")
    assert is_safe is True


def test_validate_command_blocked(sandbox):
    """Test that blocked commands raise SecurityViolation."""
    with pytest.raises(SecurityViolation):
        sandbox.validate_command("sudo rm -rf /")


def test_validate_command_requires_approval(sandbox):
    """Test that commands requiring approval raise ApprovalRequired."""
    with pytest.raises(ApprovalRequired):
        sandbox.validate_command("rm file.txt")


def test_sanitize_output(sandbox):
    """Test output sanitization."""
    output = "API_KEY=secret123 email: test@example.com"
    sanitized = sandbox.sanitize_output(output)
    
    assert "secret123" not in sanitized
    assert "test@example.com" not in sanitized
    assert "[REDACTED]" in sanitized
    assert "[EMAIL]" in sanitized


def test_audit_log(sandbox):
    """Test that violations are logged."""
    try:
        sandbox.validate_path("/etc/passwd", "read")
    except SecurityViolation:
        pass
    
    log = sandbox.get_audit_log()
    assert len(log) > 0
    assert "violation" in log[0]
