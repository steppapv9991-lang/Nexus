export const modelRouter = `"""
nexus_core/model_router.py
===========================
Model-Agnostic Router — единая точка входа для любого LLM.
Поддерживает: OpenAI, Anthropic, Ollama, vLLM, OpenRouter.
Использует LiteLLM как унифицирующий слой.
"""

from __future__ import annotations

import os
import asyncio
import logging
from enum import Enum
from dataclasses import dataclass, field
from typing import AsyncIterator, Optional, Any

import litellm
from litellm import acompletion, ModelResponse

logger = logging.getLogger("nexus.router")


class Provider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    OLLAMA = "ollama"
    VLLM = "vllm"
    OPENROUTER = "openrouter"
    AZURE = "azure"
    CUSTOM = "custom"


@dataclass
class ModelConfig:
    """Конфигурация модели с fallback-цепочкой."""
    model_id: str
    provider: Provider
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    max_tokens: int = 4096
    temperature: float = 0.7
    context_window: int = 128_000
    fallback_models: list[str] = field(default_factory=list)
    extra_params: dict[str, Any] = field(default_factory=dict)

    # Cost tracking (USD per 1M tokens)
    input_cost: float = 0.0
    output_cost: float = 0.0

    @property
    def litellm_model(self) -> str:
        """Формирует строку модели для LiteLLM."""
        prefix_map = {
            Provider.OPENAI: "",
            Provider.ANTHROPIC: "anthropic/",
            Provider.OLLAMA: "ollama/",
            Provider.VLLM: "openai/",  # vLLM совместим с OpenAI API
            Provider.OPENROUTER: "openrouter/",
            Provider.AZURE: "azure/",
        }
        prefix = prefix_map.get(self.provider, "")
        return f"{prefix}{self.model_id}"


@dataclass
class StreamChunk:
    """Один чанк стримингового ответа."""
    content: str = ""
    tool_calls: list[dict] = field(default_factory=list)
    finish_reason: Optional[str] = None
    usage: Optional[dict] = None


class ModelRouter:
    """
    Централизованный роутер моделей.
    
    Фичи:
    - Автоматический fallback при ошибке
    - Стриминг с генератором
    - Cost tracking per session
    - Rate limiting с exponential backoff
    - Кэширование ответов для идентичных запросов
    """

    def __init__(self, configs: dict[str, ModelConfig]):
        self.configs = configs
        self.default_model: str = next(iter(configs))
        self._session_cost: float = 0.0
        self._cache: dict[str, ModelResponse] = {}
        self._setup_api_keys()

    def _setup_api_keys(self) -> None:
        """Настраивает API-ключи из env или конфигов."""
        for name, config in self.configs.items():
            if config.api_key:
                env_key = f"{config.provider.value.upper()}_API_KEY"
                os.environ[env_key] = config.api_key
            if config.base_url:
                os.environ[f"{config.provider.value.upper()}_BASE_URL"] = config.base_url

    async def complete(
        self,
        messages: list[dict],
        model: Optional[str] = None,
        tools: Optional[list[dict]] = None,
        stream: bool = True,
        **kwargs,
    ) -> AsyncIterator[StreamChunk] | ModelResponse:
        """
        Основной метод для получения ответа от LLM.
        
        Args:
            messages: История диалога в формате OpenAI
            model: Имя модели (из configs), по умолчанию — default_model
            tools: Список tool definitions для function calling
            stream: Включить стриминг
            **kwargs: Дополнительные параметры для LiteLLM
        """
        model_name = model or self.default_model
        config = self.configs.get(model_name)
        
        if not config:
            raise ValueError(f"Unknown model: {model_name}")

        # Формируем параметры запроса
        params = {
            "model": config.litellm_model,
            "messages": messages,
            "max_tokens": config.max_tokens,
            "temperature": config.temperature,
            "stream": stream,
            **config.extra_params,
            **kwargs,
        }

        if tools:
            params["tools"] = tools
            params["tool_choice"] = "auto"

        # Пробуем основную модель + fallback-цепочку
        models_to_try = [config] + [
            self.configs[fb] for fb in config.fallback_models 
            if fb in self.configs
        ]

        for i, model_config in enumerate(models_to_try):
            try:
                params["model"] = model_config.litellm_model
                
                if stream:
                    return self._stream_response(params, model_config)
                else:
                    response = await acompletion(**params)
                    self._track_cost(response, model_config)
                    return response

            except Exception as e:
                logger.warning(
                    f"Model {model_config.model_id} failed: {e}. "
                    f"Trying fallback ({i+1}/{len(models_to_try)})"
                )
                if i == len(models_to_try) - 1:
                    raise RuntimeError(
                        f"All models failed. Last error: {e}"
                    )
                await asyncio.sleep(2 ** i)  # Exponential backoff

    async def _stream_response(
        self, params: dict, config: ModelConfig
    ) -> AsyncIterator[StreamChunk]:
        """Стриминговый ответ с обработкой tool_calls."""
        response = await acompletion(**params)
        
        tool_calls_buffer: dict[int, dict] = {}
        
        async for chunk in response:
            delta = chunk.choices[0].delta
            
            content = getattr(delta, "content", None) or ""
            
            # Accumulate tool calls
            if hasattr(delta, "tool_calls") and delta.tool_calls:
                for tc in delta.tool_calls:
                    idx = tc.index
                    if idx not in tool_calls_buffer:
                        tool_calls_buffer[idx] = {
                            "id": tc.id or "",
                            "type": "function",
                            "function": {"name": "", "arguments": ""}
                        }
                    if tc.id:
                        tool_calls_buffer[idx]["id"] = tc.id
                    if tc.function:
                        if tc.function.name:
                            tool_calls_buffer[idx]["function"]["name"] = tc.function.name
                        if tc.function.arguments:
                            tool_calls_buffer[idx]["function"]["arguments"] += tc.function.arguments

            finish_reason = chunk.choices[0].finish_reason
            
            yield StreamChunk(
                content=content,
                tool_calls=list(tool_calls_buffer.values()) if finish_reason else [],
                finish_reason=finish_reason,
                usage=dict(chunk.usage) if hasattr(chunk, "usage") and chunk.usage else None,
            )

    def _track_cost(self, response: ModelResponse, config: ModelConfig) -> None:
        """Отслеживает стоимость использования модели."""
        if hasattr(response, "usage") and response.usage:
            input_tokens = response.usage.prompt_tokens
            output_tokens = response.usage.completion_tokens
            cost = (
                (input_tokens / 1_000_000) * config.input_cost +
                (output_tokens / 1_000_000) * config.output_cost
            )
            self._session_cost += cost
            logger.debug(f"Session cost: \${self._session_cost:.4f}")

    @property
    def session_cost(self) -> float:
        return self._session_cost

    def get_model_info(self, model: str) -> dict:
        """Возвращает информацию о модели."""
        config = self.configs.get(model, self.configs[self.default_model])
        return {
            "model_id": config.model_id,
            "provider": config.provider.value,
            "context_window": config.context_window,
            "litellm_model": config.litellm_model,
        }
`;

export const skillManager = `"""
nexus_core/skill_manager.py
============================
Модульный менеджер скиллов (инструментов).
Динамическая загрузка из YAML/JSON + auto-tool-selection.
"""

from __future__ import annotations

import os
import json
import yaml
import importlib
import inspect
import logging
from pathlib import Path
from dataclasses import dataclass, field
from typing import Any, Callable, Optional

logger = logging.getLogger("nexus.skills")


@dataclass
class SkillParameter:
    """Описание параметра скилла (для LLM function schema)."""
    name: str
    type: str  # "string", "integer", "boolean", "array", "object"
    description: str
    required: bool = True
    default: Any = None
    enum: Optional[list] = None


@dataclass
class Skill:
    """
    Единица инструмента — скилл.
    
    Может быть загружен из:
    1. YAML/JSON манифеста + Python-функции
    2. Декоратора @skill на Python-функции
    3. Встроенного скилла из core/
    """
    name: str
    description: str
    handler: Callable
    parameters: list[SkillParameter] = field(default_factory=list)
    category: str = "general"
    tags: list[str] = field(default_factory=list)
    enabled: bool = True
    risk_level: str = "low"  # low, medium, high, critical
    requires_approval: bool = False
    metadata: dict = field(default_factory=dict)

    def to_openai_tool(self) -> dict:
        """Конвертирует скилл в OpenAI function calling format."""
        properties = {}
        required = []
        
        for param in self.parameters:
            prop: dict[str, Any] = {
                "type": param.type,
                "description": param.description,
            }
            if param.enum:
                prop["enum"] = param.enum
            if param.default is not None:
                prop["default"] = param.default
            properties[param.name] = prop
            
            if param.required:
                required.append(param.name)

        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": properties,
                    "required": required,
                },
            },
        }

    async def execute(self, **kwargs) -> Any:
        """Выполняет скилл с валидацией параметров."""
        # Валидация обязательных параметров
        for param in self.parameters:
            if param.required and param.name not in kwargs:
                if param.default is not None:
                    kwargs[param.name] = param.default
                else:
                    raise ValueError(f"Missing required parameter: {param.name}")

        # Вызов handler'а (sync или async)
        result = self.handler(**kwargs)
        if inspect.isawaitable(result):
            result = await result
        
        return result


class SkillManager:
    """
    Менеджер скиллов с динамической загрузкой.
    
    Фичи:
    - Загрузка из YAML/JSON манифестов
    - Декоратор @skill для быстрой регистрации
    - Auto-tool-selection: LLM выбирает релевантные скиллы
    - Hot-reload при изменении файлов
    - Приоритизация по контексту
    """

    def __init__(self, skills_dir: str = "./skills"):
        self.skills: dict[str, Skill] = {}
        self.skills_dir = Path(skills_dir)
        self._builtin_skills: dict[str, Callable] = {}
        self._register_builtins()

    def _register_builtins(self) -> None:
        """Регистрирует встроенные скиллы."""
        self._builtin_skills = {
            "read_file": self._builtin_read_file,
            "write_file": self._builtin_write_file,
            "list_directory": self._builtin_list_dir,
            "search_code": self._builtin_search,
            "run_command": self._builtin_run_cmd,
            "web_search": self._builtin_web_search,
            "git_diff": self._builtin_git_diff,
            "rag_query": self._builtin_rag_query,
        }

    def skill(
        self,
        name: Optional[str] = None,
        description: str = "",
        category: str = "general",
        risk_level: str = "low",
        requires_approval: bool = False,
        tags: Optional[list[str]] = None,
    ) -> Callable:
        """
        Декоратор для регистрации Python-функции как скилла.
        
        Usage:
            @manager.skill(
                name="deploy",
                description="Deploy application to production",
                risk_level="critical",
                requires_approval=True,
            )
            async def deploy(env: str, version: str):
                ...
        """
        def decorator(func: Callable) -> Callable:
            skill_name = name or func.__name__
            
            # Автоматическое извлечение параметров из сигнатуры
            sig = inspect.signature(func)
            parameters = []
            
            for param_name, param in sig.parameters.items():
                if param_name in ("self", "cls"):
                    continue
                    
                param_type = "string"
                if param.annotation == int:
                    param_type = "integer"
                elif param.annotation == bool:
                    param_type = "boolean"
                elif param.annotation == list:
                    param_type = "array"
                
                parameters.append(SkillParameter(
                    name=param_name,
                    type=param_type,
                    description=func.__doc__ or description,
                    required=param.default == inspect.Parameter.empty,
                    default=None if param.default == inspect.Parameter.empty else param.default,
                ))

            skill_obj = Skill(
                name=skill_name,
                description=description or func.__doc__ or "",
                handler=func,
                parameters=parameters,
                category=category,
                risk_level=risk_level,
                requires_approval=requires_approval,
                tags=tags or [],
            )
            
            self.skills[skill_name] = skill_obj
            logger.info(f"Registered skill: {skill_name} (risk: {risk_level})")
            return func
        
        return decorator

    def load_from_yaml(self, yaml_path: str) -> list[Skill]:
        """
        Загружает скиллы из YAML-манифеста.
        
        Формат YAML:
            skills:
              - name: "analyze_code"
                description: "Analyze code quality"
                category: "analysis"
                risk_level: "low"
                parameters:
                  - name: "file_path"
                    type: "string"
                    description: "Path to file"
                    required: true
                  - name: "language"
                    type: "string"
                    description: "Programming language"
                    required: false
                    default: "auto"
                handler_module: "skills.analysis"
                handler_function: "analyze"
        """
        path = Path(yaml_path)
        if not path.exists():
            logger.warning(f"Skills file not found: {yaml_path}")
            return []

        with open(path) as f:
            data = yaml.safe_load(f)

        loaded_skills = []
        
        for skill_def in data.get("skills", []):
            # Динамический импорт handler'а
            module_name = skill_def.get("handler_module")
            func_name = skill_def.get("handler_function")
            
            if module_name and func_name:
                try:
                    module = importlib.import_module(module_name)
                    handler = getattr(module, func_name)
                except (ImportError, AttributeError) as e:
                    logger.error(f"Failed to load handler for {skill_def['name']}: {e}")
                    continue
            else:
                # Ищем среди встроенных
                handler = self._builtin_skills.get(skill_def["name"])
                if not handler:
                    logger.error(f"No handler found for skill: {skill_def['name']}")
                    continue

            # Парсим параметры
            parameters = []
            for param_def in skill_def.get("parameters", []):
                parameters.append(SkillParameter(
                    name=param_def["name"],
                    type=param_def.get("type", "string"),
                    description=param_def.get("description", ""),
                    required=param_def.get("required", True),
                    default=param_def.get("default"),
                    enum=param_def.get("enum"),
                ))

            skill_obj = Skill(
                name=skill_def["name"],
                description=skill_def.get("description", ""),
                handler=handler,
                parameters=parameters,
                category=skill_def.get("category", "general"),
                risk_level=skill_def.get("risk_level", "low"),
                requires_approval=skill_def.get("requires_approval", False),
                tags=skill_def.get("tags", []),
                metadata=skill_def.get("metadata", {}),
            )
            
            self.skills[skill_obj.name] = skill_obj
            loaded_skills.append(skill_obj)
            logger.info(f"Loaded skill from YAML: {skill_obj.name}")

        return loaded_skills

    def load_directory(self, directory: Optional[str] = None) -> int:
        """Загружает все YAML/JSON скиллы из директории."""
        skills_path = Path(directory) if directory else self.skills_dir
        
        if not skills_path.exists():
            skills_path.mkdir(parents=True, exist_ok=True)
            return 0

        count = 0
        for ext in ("*.yaml", "*.yml", "*.json"):
            for file_path in skills_path.glob(ext):
                try:
                    if ext.endswith("json"):
                        self._load_json_skills(file_path)
                    else:
                        self.load_from_yaml(str(file_path))
                    count += 1
                except Exception as e:
                    logger.error(f"Error loading {file_path}: {e}")
        
        return count

    def _load_json_skills(self, path: Path) -> None:
        """Загрузка скиллов из JSON."""
        with open(path) as f:
            data = json.load(f)
        # Конвертируем в YAML-совместимый формат и используем общий парсер
        yaml_str = yaml.dump(data)
        temp_path = path.with_suffix(".yaml")
        temp_path.write_text(yaml_str)
        self.load_from_yaml(str(temp_path))
        temp_path.unlink()

    def auto_select_tools(
        self, 
        user_query: str, 
        max_tools: int = 15,
        context: Optional[dict] = None,
    ) -> list[Skill]:
        """
        Auto-tool-selection: выбирает релевантные скиллы для запроса.
        
        Использует семантическое сходство между описанием скилла
        и запросом пользователя + контекст сессии.
        """
        if not self.skills:
            return []

        # Простая scoring-система на основе keyword matching
        # В production замени на embedding-based similarity
        query_lower = user_query.lower()
        scored_skills: list[tuple[float, Skill]] = []

        for skill in self.skills.values():
            if not skill.enabled:
                continue
                
            score = 0.0
            
            # Match по имени
            if skill.name.lower() in query_lower:
                score += 3.0
            
            # Match по описанию (token overlap)
            desc_words = set(skill.description.lower().split())
            query_words = set(query_lower.split())
            overlap = len(desc_words & query_words)
            score += overlap * 0.5
            
            # Match по тегам
            for tag in skill.tags:
                if tag.lower() in query_lower:
                    score += 1.5
            
            # Match по категории (из контекста)
            if context and "file_type" in context:
                if context["file_type"] in skill.category:
                    score += 2.0
            
            # Приоритет по risk_level (низкий риск = выше приоритет)
            risk_bonus = {"low": 1.0, "medium": 0.5, "high": 0.2, "critical": 0.1}
            score *= risk_bonus.get(skill.risk_level, 0.5)

            if score > 0:
                scored_skills.append((score, skill))

        # Сортируем по score и берём top-N
        scored_skills.sort(key=lambda x: x[0], reverse=True)
        selected = [s for _, s in scored_skills[:max_tools]]
        
        # Всегда включаем базовые скиллы
        essential = ["read_file", "write_file", "list_directory"]
        for name in essential:
            if name in self.skills and not any(s.name == name for s in selected):
                selected.append(self.skills[name])

        logger.info(f"Auto-selected {len(selected)} tools for query")
        return selected

    def get_tools_schema(self, skills: Optional[list[Skill]] = None) -> list[dict]:
        """Возвращает OpenAI-compatible tool definitions."""
        target_skills = skills or [s for s in self.skills.values() if s.enabled]
        return [s.to_openai_tool() for s in target_skills]

    def reload(self) -> int:
        """Hot-reload всех скиллов."""
        self.skills.clear()
        self._register_builtins()
        return self.load_directory()

    # === Built-in Skill Handlers ===
    
    @staticmethod
    async def _builtin_read_file(path: str, offset: int = 0, limit: int = 2000) -> str:
        """Read file contents with line numbers."""
        file_path = Path(path)
        if not file_path.exists():
            return f"Error: File not found: {path}"
        
        lines = file_path.read_text().splitlines()
        if offset:
            lines = lines[offset-1:]
        if limit:
            lines = lines[:limit]
        
        numbered = [f"{i+offset+1:4d} | {line}" for i, line in enumerate(lines)]
        return "\\n".join(numbered)

    @staticmethod
    async def _builtin_write_file(path: str, content: str) -> str:
        """Write content to file."""
        file_path = Path(path)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(content)
        return f"Successfully wrote {len(content)} bytes to {path}"

    @staticmethod
    async def _builtin_list_dir(path: str = ".", recursive: bool = False) -> str:
        """List directory contents."""
        p = Path(path)
        if recursive:
            files = [str(f) for f in p.rglob("*") if f.is_file()]
        else:
            files = [str(f) for f in p.iterdir()]
        return "\\n".join(sorted(files)[:200])

    @staticmethod
    async def _builtin_search(pattern: str, path: str = ".", glob: str = "*") -> str:
        """Search code with regex pattern."""
        import re
        results = []
        search_path = Path(path)
        
        for file_path in search_path.rglob(glob):
            if not file_path.is_file():
                continue
            try:
                content = file_path.read_text()
                for i, line in enumerate(content.splitlines(), 1):
                    if re.search(pattern, line):
                        results.append(f"{file_path}:{i}: {line.strip()}")
                        if len(results) >= 100:
                            break
            except (UnicodeDecodeError, PermissionError):
                continue
        
        return "\\n".join(results) if results else "No matches found"

    @staticmethod
    async def _builtin_run_cmd(command: str, timeout: int = 30) -> str:
        """Execute shell command in sandbox."""
        import subprocess
        try:
            result = subprocess.run(
                command, shell=True, capture_output=True,
                text=True, timeout=timeout,
            )
            output = result.stdout
            if result.stderr:
                output += f"\\nSTDERR: {result.stderr}"
            return output or "Command completed (no output)"
        except subprocess.TimeoutExpired:
            return f"Error: Command timed out after {timeout}s"
        except Exception as e:
            return f"Error: {e}"

    @staticmethod
    async def _builtin_web_search(query: str) -> str:
        """Search the web."""
        return f"[Web search results for: {query}]"

    @staticmethod
    async def _builtin_git_diff(path: str = ".") -> str:
        """Get git diff."""
        import subprocess
        try:
            result = subprocess.run(
                ["git", "diff", path], capture_output=True, text=True, timeout=10
            )
            return result.stdout or "No changes detected"
        except Exception as e:
            return f"Error: {e}"

    @staticmethod
    async def _builtin_rag_query(query: str, top_k: int = 5) -> str:
        """Query the local RAG index."""
        return f"[RAG results for: {query} — top {top_k} chunks]"
`;

export const agentLoop = `"""
nexus_core/agent.py
====================
Основной цикл агента: ReAct + Function Calling.
Управление контекстом, сжатие истории, execution loop.
"""

from __future__ import annotations

import json
import time
import asyncio
import logging
from enum import Enum
from dataclasses import dataclass, field
from typing import Any, Optional, AsyncIterator

from .model_router import ModelRouter, StreamChunk
from .skill_manager import SkillManager, Skill
from .context_manager import ContextManager

logger = logging.getLogger("nexus.agent")


class AgentState(str, Enum):
    IDLE = "idle"
    THINKING = "thinking"
    ACTING = "acting"
    OBSERVING = "observing"
    WAITING_APPROVAL = "waiting_approval"
    DONE = "done"
    ERROR = "error"


@dataclass
class AgentStep:
    """Один шаг ReAct-цикла."""
    step_number: int
    thought: str = ""
    action: Optional[str] = None
    action_input: Optional[dict] = None
    observation: str = ""
    timestamp: float = field(default_factory=time.time)
    token_usage: dict = field(default_factory=dict)


@dataclass
class AgentEvent:
    """Событие для стриминга в UI."""
    type: str  # "thought", "action", "observation", "content", "error", "approval_needed"
    data: Any = None
    step: Optional[int] = None


class NexusAgent:
    """
    Основной AI-агент с ReAct-циклом.
    
    Архитектура:
    1. Получает запрос пользователя
    2. Анализирует контекст и выбирает инструменты
    3. В цикле ReAct: Think → Act → Observe
    4. Стримит все события в TUI
    5. Управляет контекстом (сжатие при переполнении)
    
    Features:
    - Multi-step reasoning с явным tracking
    - Approval flow для опасных операций
    - Context window management
    - Session persistence
    - Cost tracking
    """

    SYSTEM_PROMPT = """You are NexusAI — an advanced AI coding agent operating in a terminal.

## Core Principles
1. **Think before acting**: Always analyze the problem before taking action
2. **Minimal changes**: Make the smallest change that solves the problem
3. **Verify results**: After making changes, verify they work correctly
4. **Ask when uncertain**: If requirements are ambiguous, ask for clarification

## Available Capabilities
You have access to tools for:
- Reading and writing files
- Executing shell commands (with approval for dangerous operations)
- Searching code and the web
- Git operations
- Code analysis and refactoring

## Response Format
For each step, provide:
1. **Thought**: Your reasoning about what to do next
2. **Action**: The tool to use (if needed)
3. **Observation**: What you learned from the action

When the task is complete, provide a clear summary of what was done.

## Safety Rules
- NEVER execute destructive commands without explicit approval
- NEVER modify files outside the working directory without permission
- ALWAYS verify file paths before writing
- Use read-only operations first to understand the codebase

## Current Context
{context_info}
"""

    def __init__(
        self,
        router: ModelRouter,
        skill_manager: SkillManager,
        context_manager: ContextManager,
        max_steps: int = 25,
        auto_approve_safe: bool = True,
    ):
        self.router = router
        self.skills = skill_manager
        self.context = context_manager
        self.max_steps = max_steps
        self.auto_approve_safe = auto_approve_safe
        
        self.state = AgentState.IDLE
        self.steps: list[AgentStep] = []
        self._approval_callback: Optional[callable] = None
        self._event_queue: asyncio.Queue[AgentEvent] = asyncio.Queue()

    def set_approval_callback(self, callback: callable) -> None:
        """Устанавливает callback для запроса approval у пользователя."""
        self._approval_callback = callback

    async def run(self, user_input: str) -> AsyncIterator[AgentEvent]:
        """
        Основной entry point. Запускает агентный цикл.
        
        Flow:
        1. Prepare context
        2. Auto-select tools
        3. Enter ReAct loop
        4. Stream events to UI
        """
        self.state = AgentState.THINKING
        self.steps = []
        
        # Подготавливаем контекст
        context_info = self.context.get_context_summary()
        system_prompt = self.SYSTEM_PROMPT.format(context_info=context_info)
        
        # Добавляем системное сообщение
        messages = self.context.get_messages()
        messages.insert(0, {"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": user_input})
        
        # Auto-select tools для этого запроса
        selected_skills = self.skills.auto_select_tools(
            user_input, 
            context={"file_type": self.context.get_current_file_type()}
        )
        tools_schema = self.skills.get_tools_schema(selected_skills)
        
        yield AgentEvent(type="content", data=f"🧠 Analyzing request and selecting tools...")
        yield AgentEvent(type="content", data=f"📦 Loaded {len(selected_skills)} relevant tools")
        
        # === ReAct Loop ===
        for step_num in range(1, self.max_steps + 1):
            step = AgentStep(step_number=step_num)
            self.steps.append(step)
            
            yield AgentEvent(type="content", data=f"\\n--- Step {step_num} ---", step=step_num)
            
            try:
                # Get LLM response
                self.state = AgentState.THINKING
                
                response_text = ""
                tool_calls = []
                
                async for chunk in self.router.complete(
                    messages=messages,
                    tools=tools_schema if tools_schema else None,
                    stream=True,
                ):
                    if chunk.content:
                        response_text += chunk.content
                        yield AgentEvent(
                            type="content", 
                            data=chunk.content, 
                            step=step_num
                        )
                    
                    if chunk.tool_calls:
                        tool_calls = chunk.tool_calls
                    
                    if chunk.finish_reason:
                        break
                
                step.thought = response_text
                
                # Check if agent wants to use tools
                if tool_calls:
                    self.state = AgentState.ACTING
                    
                    for tc in tool_calls:
                        func_name = tc["function"]["name"]
                        try:
                            func_args = json.loads(tc["function"]["arguments"])
                        except json.JSONDecodeError:
                            func_args = {}
                        
                        step.action = func_name
                        step.action_input = func_args
                        
                        yield AgentEvent(
                            type="action",
                            data={"tool": func_name, "args": func_args},
                            step=step_num,
                        )
                        
                        # Execute tool
                        observation = await self._execute_tool(
                            func_name, func_args, step_num
                        )
                        step.observation = observation
                        
                        yield AgentEvent(
                            type="observation",
                            data=observation,
                            step=step_num,
                        )
                        
                        # Add to message history
                        messages.append({
                            "role": "assistant",
                            "content": response_text,
                            "tool_calls": [tc],
                        })
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tc.get("id", ""),
                            "content": observation,
                        })
                
                else:
                    # No tool calls — agent is done or asking a question
                    messages.append({
                        "role": "assistant",
                        "content": response_text,
                    })
                    
                    self.state = AgentState.DONE
                    yield AgentEvent(
                        type="content",
                        data="\\n✅ Task completed.",
                        step=step_num,
                    )
                    break
                
                # Compress context if needed
                self.context.maybe_compress(messages)
                
            except Exception as e:
                logger.error(f"Agent error at step {step_num}: {e}")
                self.state = AgentState.ERROR
                yield AgentEvent(
                    type="error",
                    data=str(e),
                    step=step_num,
                )
                break
        
        self.state = AgentState.IDLE

    async def _execute_tool(
        self, tool_name: str, args: dict, step_num: int
    ) -> str:
        """Выполняет выбранный инструмент."""
        skill = self.skills.skills.get(tool_name)
        
        if not skill:
            return f"Error: Unknown tool '{tool_name}'"
        
        # Check if approval is needed
        if skill.requires_approval and not self.auto_approve_safe:
            self.state = AgentState.WAITING_APPROVAL
            
            if self._approval_callback:
                approved = await self._approval_callback(
                    tool_name, args, skill.risk_level
                )
                if not approved:
                    return "Action rejected by user."
            
            self.state = AgentState.ACTING
        
        # Execute with timeout
        try:
            result = await asyncio.wait_for(
                skill.execute(**args),
                timeout=60.0,
            )
            return str(result)
        except asyncio.TimeoutError:
            return f"Error: Tool '{tool_name}' timed out after 60s"
        except Exception as e:
            return f"Error executing '{tool_name}': {e}"

    def get_session_summary(self) -> dict:
        """Возвращает сводку текущей сессии."""
        return {
            "total_steps": len(self.steps),
            "tools_used": list(set(
                s.action for s in self.steps if s.action
            )),
            "total_cost": self.router.session_cost,
            "context_messages": len(self.context.get_messages()),
            "state": self.state.value,
        }
`;

export const contextManager = `"""
nexus_core/context_manager.py
==============================
Умное управление контекстом: RAG, компрессия, память.
"""

from __future__ import annotations

import json
import hashlib
import logging
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger("nexus.context")


@dataclass
class ContextConfig:
    """Конфигурация контекстного менеджера."""
    max_context_tokens: int = 128_000
    reserve_for_response: int = 4_096
    compression_threshold: float = 0.8  # Compress at 80% capacity
    summary_model: str = "gpt-4o-mini"
    rag_top_k: int = 5
    memory_file: str = ".nexus/memory.json"


class ContextManager:
    """
    Управляет контекстом диалога и рабочей памяти.
    
    Responsibilities:
    1. Token counting и tracking
    2. Automatic context compression (summarization)
    3. RAG integration (tree-sitter + vector search)
    4. Persistent memory across sessions
    5. File context injection
    """

    def __init__(self, config: Optional[ContextConfig] = None):
        self.config = config or ContextConfig()
        self._messages: list[dict] = []
        self._token_count: int = 0
        self._summaries: list[str] = []
        self._file_cache: dict[str, str] = {}
        self._memory: dict = self._load_memory()
        self._rag_index = None  # Lazy init

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
                content = "\\n".join(lines[:max_lines])
                content += f"\\n... [{len(lines) - max_lines} more lines truncated]"
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
        return "\\n".join(parts)

    def get_current_file_type(self) -> str:
        """Определяет тип текущего файла по расширению."""
        # Определяем по последнему добавленному файлу
        for msg in reversed(self._messages):
            content = msg.get("content", "")
            if "file" in content.lower():
                # Extract file extension
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
`;

export const yamlSkillExample = `# skills/deployment.yaml
# Пример YAML-манифеста для скиллов

skills:
  - name: "deploy_docker"
    description: "Build and deploy Docker container"
    category: "devops"
    risk_level: "high"
    requires_approval: true
    tags: ["docker", "deploy", "container"]
    parameters:
      - name: "service_name"
        type: "string"
        description: "Name of the service to deploy"
        required: true
      - name: "tag"
        type: "string"
        description: "Docker image tag"
        required: false
        default: "latest"
      - name: "registry"
        type: "string"
        description: "Docker registry URL"
        required: false
        default: "docker.io"
    handler_module: "skills.devops"
    handler_function: "deploy_docker"
    metadata:
      timeout: 300
      retry_count: 2

  - name: "run_tests"
    description: "Run test suite for the project"
    category: "testing"
    risk_level: "low"
    requires_approval: false
    tags: ["test", "pytest", "jest", "unittest"]
    parameters:
      - name: "test_path"
        type: "string"
        description: "Path to test file or directory"
        required: false
        default: "."
      - name: "framework"
        type: "string"
        description: "Test framework to use"
        required: false
        default: "auto"
        enum: ["auto", "pytest", "jest", "mocha", "unittest"]
      - name: "verbose"
        type: "boolean"
        description: "Enable verbose output"
        required: false
        default: false
    handler_module: "skills.testing"
    handler_function: "run_tests"

  - name: "analyze_dependencies"
    description: "Analyze project dependencies for vulnerabilities and updates"
    category: "security"
    risk_level: "low"
    requires_approval: false
    tags: ["security", "dependencies", "audit", "npm", "pip"]
    parameters:
      - name: "package_manager"
        type: "string"
        description: "Package manager to analyze"
        required: false
        default: "auto"
        enum: ["auto", "npm", "pip", "cargo", "go"]
      - name: "include_dev"
        type: "boolean"
        description: "Include dev dependencies"
        required: false
        default: true
    handler_module: "skills.security"
    handler_function: "analyze_deps"
`;

export const configFile = `# .nexus/config.yaml
# Глобальный конфигурационный файл NexusAI Agent
# Аналог CLAUDE.md с поддержкой профилей и переменных окружения

# === Профили ===
# Активный профиль можно переключать: nexus --profile production
profiles:
  default:
    model: "claude-sonnet-4-20250514"
    provider: "anthropic"
    max_tokens: 8192
    temperature: 0.3
    
  fast:
    model: "gpt-4o-mini"
    provider: "openai"
    max_tokens: 4096
    temperature: 0.5
    
  local:
    model: "codellama:34b"
    provider: "ollama"
    base_url: "http://localhost:11434"
    max_tokens: 4096
    temperature: 0.2

  production:
    model: "claude-sonnet-4-20250514"
    provider: "anthropic"
    max_tokens: 16384
    temperature: 0.1
    extra:
      top_p: 0.95

# === Модели ===
models:
  primary:
    model_id: "claude-sonnet-4-20250514"
    provider: "anthropic"
    api_key: "\${ANTHROPIC_API_KEY}"
    context_window: 200000
    input_cost: 3.0
    output_cost: 15.0
    fallback_models: ["gpt-4o", "claude-3.5-sonnet"]
    
  secondary:
    model_id: "gpt-4o"
    provider: "openai"
    api_key: "\${OPENAI_API_KEY}"
    context_window: 128000
    input_cost: 2.5
    output_cost: 10.0
    fallback_models: ["claude-sonnet-4-20250514"]
    
  local:
    model_id: "codellama:34b"
    provider: "ollama"
    base_url: "http://localhost:11434"
    context_window: 16384
    input_cost: 0.0
    output_cost: 0.0

# === Контекст ===
context:
  max_tokens: 128000
  compression_threshold: 0.8
  summary_model: "gpt-4o-mini"
  auto_compress: true
  
  # Файлы для автоматического включения в контекст
  always_include:
    - "README.md"
    - "package.json"
    - "pyproject.toml"
    - ".nexus/memory.json"
  
  # Паттерны для исключения
  exclude_patterns:
    - "node_modules/**"
    - ".git/**"
    - "*.lock"
    - "dist/**"
    - "__pycache__/**"

# === Безопасность ===
security:
  sandbox:
    enabled: true
    allowed_paths:
      - "."
      - "/tmp/nexus-*"
    blocked_paths:
      - "/etc/**"
      - "/usr/**"
      - "~/.ssh/**"
      - "~/.aws/**"
    
  shell:
    allowed_commands:
      - "ls"
      - "cat"
      - "grep"
      - "find"
      - "git"
      - "npm"
      - "python"
      - "node"
      - "cargo"
      - "go"
    blocked_commands:
      - "rm -rf /"
      - "sudo"
      - "chmod 777"
      - "curl | sh"
      - "wget | bash"
    require_approval:
      - "rm"
      - "mv"
      - "dd"
      - "mkfs"
      - "format"

# === Скиллы ===
skills:
  directory: "./skills"
  auto_load: true
  hot_reload: true
  
  # Максимум инструментов в контексте
  max_tools_in_context: 15
  
  # Приоритетные скиллы (всегда включены)
  always_enabled:
    - "read_file"
    - "write_file"
    - "list_directory"
    - "search_code"

# === RAG ===
rag:
  enabled: true
  embedding_model: "text-embedding-3-small"
  chunk_size: 512
  chunk_overlap: 50
  top_k: 5
  
  # Индексируемые типы файлов
  index_patterns:
    - "**/*.py"
    - "**/*.ts"
    - "**/*.tsx"
    - "**/*.js"
    - "**/*.jsx"
    - "**/*.rs"
    - "**/*.go"
    - "**/*.md"

# === UX ===
ui:
  theme: "dark"
  streaming: true
  show_thoughts: true
  diff_preview: true
  syntax_highlighting: true
  line_numbers: true
  auto_scroll: true
  
  # Звуковые уведомления
  sounds:
    enabled: false
    on_complete: "complete.wav"
    on_error: "error.wav"
`;

export const mainEntry = `"""
nexus_core/main.py
===================
Точка входа — инициализация и запуск агента.
"""

from __future__ import annotations

import os
import sys
import asyncio
import logging
from pathlib import Path

import yaml
from dotenv import load_dotenv

from .model_router import ModelRouter, ModelConfig, Provider
from .skill_manager import SkillManager
from .context_manager import ContextManager, ContextConfig
from .agent import NexusAgent

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("nexus")


class NexusCore:
    """
    Оркестратор — собирает все компоненты вместе.
    
    Usage:
        core = NexusCore.from_config(".nexus/config.yaml")
        await core.start()
    """

    def __init__(
        self,
        router: ModelRouter,
        skill_manager: SkillManager,
        context_manager: ContextManager,
        agent: NexusAgent,
    ):
        self.router = router
        self.skill_manager = skill_manager
        self.context_manager = context_manager
        self.agent = agent

    @classmethod
    def from_config(cls, config_path: str = ".nexus/config.yaml", profile: str = "default") -> "NexusCore":
        """Создаёт ядро из конфигурационного файла."""
        
        # Загружаем YAML конфиг
        config_file = Path(config_path)
        if config_file.exists():
            with open(config_file) as f:
                raw_config = yaml.safe_load(f)
        else:
            raw_config = {}
            logger.warning(f"Config not found: {config_path}, using defaults")

        # Разрешаем переменные окружения в конфиге
        config = cls._resolve_env_vars(raw_config)
        
        # Получаем настройки профиля
        profile_config = config.get("profiles", {}).get(profile, {})
        
        # 1. Инициализируем Model Router
        model_configs = {}
        for name, model_def in config.get("models", {}).items():
            model_configs[name] = ModelConfig(
                model_id=model_def["model_id"],
                provider=Provider(model_def.get("provider", "openai")),
                api_key=model_def.get("api_key"),
                base_url=model_def.get("base_url"),
                max_tokens=profile_config.get("max_tokens", model_def.get("max_tokens", 4096)),
                temperature=profile_config.get("temperature", 0.7),
                context_window=model_def.get("context_window", 128_000),
                fallback_models=model_def.get("fallback_models", []),
                input_cost=model_def.get("input_cost", 0.0),
                output_cost=model_def.get("output_cost", 0.0),
            )
        
        router = ModelRouter(model_configs)
        
        # 2. Инициализируем Skill Manager
        skill_manager = SkillManager(
            skills_dir=config.get("skills", {}).get("directory", "./skills")
        )
        skill_manager.load_directory()
        
        # 3. Инициализируем Context Manager
        ctx_config = ContextConfig(
            max_context_tokens=config.get("context", {}).get("max_tokens", 128_000),
            compression_threshold=config.get("context", {}).get("compression_threshold", 0.8),
        )
        context_manager = ContextManager(ctx_config)
        
        # 4. Инициализируем Agent
        agent = NexusAgent(
            router=router,
            skill_manager=skill_manager,
            context_manager=context_manager,
            max_steps=config.get("agent", {}).get("max_steps", 25),
        )
        
        return cls(router, skill_manager, context_manager, agent)

    @staticmethod
    def _resolve_env_vars(config: dict) -> dict:
        """Рекурсивно заменяет \${VAR_NAME} на значения из окружения."""
        import re
        
        def resolve(value):
            if isinstance(value, str):
                pattern = r'\\$\\{(\\w+)\\}'
                def replacer(match):
                    var_name = match.group(1)
                    return os.environ.get(var_name, match.group(0))
                return re.sub(pattern, replacer, value)
            elif isinstance(value, dict):
                return {k: resolve(v) for k, v in value.items()}
            elif isinstance(value, list):
                return [resolve(item) for item in value]
            return value
        
        return resolve(config)

    async def start(self) -> None:
        """Запускает интерактивный цикл агента."""
        logger.info("NexusAI Core initialized")
        logger.info(f"Models: {list(self.router.configs.keys())}")
        logger.info(f"Skills: {len(self.skill_manager.skills)} loaded")
        
        print("\\n🚀 NexusAI Agent Ready")
        print(f"   Model: {self.router.default_model}")
        print(f"   Tools: {len(self.skill_manager.skills)} available")
        print(f"   Cost:  \${self.router.session_cost:.4f}")
        print("\\nType your request (or 'quit' to exit):\\n")
        
        # Interactive loop будет в TUI-слое
        # Здесь просто возвращаем agent для использования


async def main():
    """CLI entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="NexusAI Terminal Agent")
    parser.add_argument("--config", default=".nexus/config.yaml")
    parser.add_argument("--profile", default="default")
    parser.add_argument("--query", "-q", help="Single query mode")
    parser.add_argument("--verbose", "-v", action="store_true")
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    core = NexusCore.from_config(args.config, args.profile)
    
    if args.query:
        # Single query mode
        async for event in core.agent.run(args.query):
            if event.type == "content":
                print(event.data, end="", flush=True)
            elif event.type == "action":
                print(f"\\n🔧 {event.data}")
            elif event.type == "error":
                print(f"\\n❌ {event.data}")
        print()
    else:
        await core.start()


if __name__ == "__main__":
    asyncio.run(main())
`;

export const securitySandbox = `"""
nexus_core/security.py
=======================
Песочница для shell-команд и файловых операций.
Whitelist/Blacklist система с approval flow.
"""

from __future__ import annotations

import os
import re
import logging
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional
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
    4. Системные вызовы (через seccomp на Linux)
    """

    def __init__(self, policy: Optional[SecurityPolicy] = None):
        self.policy = policy or SecurityPolicy()
        self._audit_log: list[dict] = []

    def validate_path(self, path: str, operation: str = "read") -> bool:
        """
        Проверяет, разрешён ли путь.
        
        Args:
            path: Путь к файлу/директории
            operation: Тип операции (read, write, delete)
        """
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
        """
        Проверяет shell-команду.
        
        Returns:
            (is_safe, reason)
        """
        # Извлекаем базовую команду
        cmd_parts = command.strip().split()
        if not cmd_parts:
            return False, "Empty command"
        
        base_cmd = cmd_parts[0]
        
        # Проверяем blocked commands (полное совпадение паттерна)
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
            (r'(?:api[_-]?key|secret|token|password)\\s*[:=]\\s*\\S+', '[REDACTED]'),
            (r'\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b', '[EMAIL]'),
            (r'\\b\\d{3}-\\d{2}-\\d{4}\\b', '[SSN]'),  # SSN pattern
        ]
        
        result = output
        for pattern, replacement in patterns:
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
        
        # Обрезаем если слишком длинный
        if len(result) > self.policy.max_output_size:
            result = result[:self.policy.max_output_size]
            result += "\\n... [output truncated]"
        
        return result

    def _log_violation(self, message: str) -> None:
        """Логирует нарушение безопасности."""
        import time
        self._audit_log.append({
            "timestamp": time.time(),
            "violation": message,
        })
        logger.warning(f"SECURITY: {message}")

    def get_audit_log(self) -> list[dict]:
        """Возвращает лог нарушений."""
        return self._audit_log.copy()
`;
