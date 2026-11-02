"""
Security — песочница для shell-команд и файловых операций.
Whitelist/Blacklist система с approval flow.
"""

from __future__ import annotations

import re
import time
import logging
from pathlib import Path
from dataclasses import dataclass, field
from fnmatch import fnmatch

logger = logging.getLogger("nexus.security")


@dataclass
class SecurityPolicy:
    """Политика безопасности."""
    allowed_paths: list[str] = field(default_factory=lambda: ["."])
    blocked_paths: list[str] = field(default_factory=lambda: [
        "/etc/**", "/usr/**", "~/.ssh/**", "~/.aws/**"
    ])
    allowed_commands: list[str] = field(default_factory=lambda: [
        "ls", "cat", "grep", "find", "git", "npm", "python", "node"
    ])
    blocked_commands: list[str] = field(default_factory=lambda: [
        "rm -rf /", "sudo", "chmod 777", "curl | sh"
    ])
    require_approval: list[str] = field(default_factory=lambda: [
        "rm", "mv", "dd", "mkfs"
    ])
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    max_output_size: int = 1 * 1024 * 1024  # 1MB


class SecurityViolation(Exception):
    """Исключение при нарушении политики безопасности."""
    def __init__(self, message: str, severity: str = "high"):
        self.severity = severity
        super().__init__(message)


class ApprovalRequired(Exception):
    """Требуется подтверждение пользователя."""
    def __init__(self, action: str, details: str):
        self.action = action
        self.details = details
        super().__init__(f"Approval required: {action} — {details}")


class Sandbox:
    """
    Песочница для безопасного выполнения операций.
    
    Проверяет:
    1. Пути файлов (whitelist/blacklist)
    2. Shell-команды (разрешённые/запрещённые)
    3. Размеры файлов и вывода
    """

    def __init__(self, policy: Optional[SecurityPolicy] = None):
        self.policy = policy or SecurityPolicy()
        self._audit_log: list[dict] = []

    def validate_path(self, path: str, operation: str = "read") -> bool:
        """Проверяет, разрешён ли путь."""
        resolved = str(Path(path).resolve())
        
        # Проверяем blacklist
        for pattern in self.policy.blocked_paths:
            if fnmatch(resolved, pattern) or fnmatch(path, pattern):
                self._log_violation(f"Blocked path: {path} (matches {pattern})")
                raise SecurityViolation(
                    f"Path '{path}' is blocked by security policy",
                    severity="critical"
                )
        
        # Проверяем whitelist
        allowed = False
        for pattern in self.policy.allowed_paths:
            base = str(Path(pattern).resolve())
            if resolved.startswith(base):
                allowed = True
                break
        
        if not allowed:
            self._log_violation(f"Path not in whitelist: {path}")
            raise SecurityViolation(
                f"Path '{path}' is outside allowed directories",
                severity="high"
            )
        
        # Для write операций — дополнительные проверки
        if operation == "write":
            if Path(path).exists():
                size = Path(path).stat().st_size
                if size > self.policy.max_file_size:
                    raise SecurityViolation(
                        f"File too large to modify: {size} bytes",
                        severity="medium"
                    )
        
        return True

    def validate_command(self, command: str) -> tuple[bool, str]:
        """Проверяет shell-команду."""
        # Извлекаем базовую команду
        cmd_parts = command.strip().split()
        if not cmd_parts:
            return False, "Empty command"
        
        base_cmd = cmd_parts[0]
        
        # Проверяем blocked commands
        for blocked in self.policy.blocked_commands:
            if blocked in command:
                self._log_violation(f"Blocked command: {command}")
                raise SecurityViolation(
                    f"Command contains blocked pattern: '{blocked}'",
                    severity="critical"
                )
        
        # Проверяем require_approval
        for approval_cmd in self.policy.require_approval:
            if base_cmd == approval_cmd or base_cmd.startswith(approval_cmd):
                raise ApprovalRequired(
                    action=command,
                    details=f"Command '{base_cmd}' requires user approval"
                )
        
        # Проверяем whitelist
        is_allowed = any(
            base_cmd == allowed or base_cmd.startswith(allowed)
            for allowed in self.policy.allowed_commands
        )
        
        if not is_allowed:
            raise ApprovalRequired(
                action=command,
                details=f"Command '{base_cmd}' is not in allowed list"
            )
        
        return True, "OK"

    def sanitize_output(self, output: str) -> str:
        """Очищает вывод от потенциально опасных данных."""
        # Удаляем возможные секреты
        patterns = [
            (r'(?:api[_-]?key|secret|token|password)\s*[:=]\s*\S+', '[REDACTED]'),
            (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]'),
        ]
        
        result = output
        for pattern, replacement in patterns:
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
        
        # Обрезаем если слишком длинный
        if len(result) > self.policy.max_output_size:
            result = result[:self.policy.max_output_size]
            result += "\n... [output truncated]"
        
        return result

    def _log_violation(self, message: str) -> None:
        """Логирует нарушение безопасности."""
        self._audit_log.append({
            "timestamp": time.time(),
            "violation": message,
        })
        logger.warning(f"SECURITY: {message}")

    def get_audit_log(self) -> list[dict]:
        """Возвращает лог нарушений."""
        return self._audit_log.copy()
