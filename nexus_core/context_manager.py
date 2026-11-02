"""
Context Manager — умное управление контекстом.
Token tracking, автоматическое сжатие, file caching.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger("nexus.context")


@dataclass
class ContextConfig:
    """Конфигурация контекстного менеджера."""
    max_context_tokens: int = 128_000
    reserve_for_response: int = 4_096
    compression_threshold: float = 0.8  # Compress at 80% capacity
    memory_file: str = ".nexus/memory.json"


class ContextManager:
    """
    Управляет контекстом диалога и рабочей памятью.
    
    Responsibilities:
    1. Token counting и tracking
    2. Automatic context compression (summarization)
    3. File context injection
    4. Persistent memory across sessions
    """

    def __init__(self, config: Optional[ContextConfig] = None):
        self.config = config or ContextConfig()
        self._messages: list[dict] = []
        self._token_count: int = 0
        self._summaries: list[str] = []
        self._file_cache: dict[str, str] = {}
        self._memory: dict = self._load_memory()

    def get_messages(self) -> list[dict]:
        """Возвращает текущие сообщения."""
        return self._messages.copy()

    def add_message(self, role: str, content: str, **kwargs) -> None:
        """Добавляет сообщение и обновляет token count."""
        msg = {"role": role, "content": content, **kwargs}
        self._messages.append(msg)
        self._token_count += self._estimate_tokens(content)
        
        # Проверяем необходимость компрессии
        if self._token_count > self.config.max_context_tokens * self.config.compression_threshold:
            self._compress_context()

    def _compress_context(self) -> None:
        """
        Сжимает историю диалога.
        
        Стратегия:
        1. Суммаризирует старые сообщения (кроме последних N)
        2. Заменяет их одним summary-сообщением
        3. Сохраняет ключевые tool results
        """
        if len(self._messages) < 10:
            return

        # Разделяем на "старые" и "свежие" сообщения
        keep_recent = 6  # Последние 3 пары (user+assistant)
        old_messages = self._messages[:-keep_recent]
        recent_messages = self._messages[-keep_recent:]

        # Создаём summary старых сообщений
        summary_parts = []
        
        # Включаем предыдущие summaries
        if self._summaries:
            summary_parts.append("Previous context summary: " + self._summaries[-1])
        
        # Суммаризируем tool interactions
        tool_results = [
            m for m in old_messages 
            if m.get("role") == "tool"
        ]
        if tool_results:
            summary_parts.append(
                f"Performed {len(tool_results)} tool operations "
                f"(results preserved in recent context)"
            )
        
        # Суммаризируем диалог
        user_msgs = [m for m in old_messages if m.get("role") == "user"]
        assistant_msgs = [m for m in old_messages if m.get("role") == "assistant"]
        
        if user_msgs:
            summary_parts.append(
                f"User asked {len(user_msgs)} questions, "
                f"agent provided {len(assistant_msgs)} responses."
            )

        summary = " | ".join(summary_parts)
        self._summaries.append(summary)

        # Перестраиваем messages
        self._messages = [
            {"role": "system", "content": f"[Context Summary]: {summary}"},
            *recent_messages,
        ]
        
        # Пересчитываем токены
        self._token_count = sum(
            self._estimate_tokens(m.get("content", ""))
            for m in self._messages
        )
        
        logger.info(
            f"Context compressed: {len(old_messages)} messages → summary. "
            f"New token count: ~{self._token_count}"
        )

    def maybe_compress(self, messages: list[dict]) -> None:
        """Проверяет и выполняет компрессию если нужно."""
        total_tokens = sum(
            self._estimate_tokens(m.get("content", ""))
            for m in messages
        )
        if total_tokens > self.config.max_context_tokens * self.config.compression_threshold:
            self._compress_context()

    def inject_file_context(self, file_path: str, max_lines: int = 500) -> str:
        """
        Инжектирует содержимое файла в контекст.
        Кэширует для повторных обращений.
        """
        path = Path(file_path)
        if not path.exists():
            return f"[File not found: {file_path}]"

        cache_key = str(path.resolve())
        
        if cache_key not in self._file_cache:
            content = path.read_text(errors="replace")
            lines = content.splitlines()
            if len(lines) > max_lines:
                content = "\n".join(lines[:max_lines])
                content += f"\n... [{len(lines) - max_lines} more lines truncated]"
            self._file_cache[cache_key] = content

        return self._file_cache[cache_key]

    def get_context_summary(self) -> str:
        """Возвращает текстовое описание текущего контекста."""
        parts = [
            f"Working directory: {Path.cwd()}",
            f"Messages in context: {len(self._messages)}",
            f"Estimated tokens: ~{self._token_count}",
            f"Cached files: {len(self._file_cache)}",
        ]
        if self._summaries:
            parts.append(f"Previous summaries: {len(self._summaries)}")
        return "\n".join(parts)

    def get_current_file_type(self) -> str:
        """Определяет тип текущего файла по расширению."""
        for msg in reversed(self._messages):
            content = msg.get("content", "")
            if "file" in content.lower():
                for word in content.split():
                    if "." in word:
                        ext = word.split(".")[-1]
                        return ext
        return "unknown"

    def save_memory(self) -> None:
        """Сохраняет память в файл."""
        memory_path = Path(self.config.memory_file)
        memory_path.parent.mkdir(parents=True, exist_ok=True)
        with open(memory_path, "w") as f:
            json.dump(self._memory, f, indent=2)

    def _load_memory(self) -> dict:
        """Загружает память из файла."""
        memory_path = Path(self.config.memory_file)
        if memory_path.exists():
            with open(memory_path) as f:
                return json.load(f)
        return {"facts": [], "preferences": {}, "past_sessions": []}

    @staticmethod
    def _estimate_tokens(text: str) -> int:
        """Быстрая оценка количества токенов (≈4 символа на токен)."""
        return len(text) // 4
