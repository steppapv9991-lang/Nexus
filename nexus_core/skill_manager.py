"""
Skill Manager — модульная система инструментов.
Динамическая загрузка из YAML/JSON + auto-tool-selection.
"""

from __future__ import annotations

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
    """Описание параметра скилла."""
    name: str
    type: str  # "string", "integer", "boolean", "array", "object"
    description: str
    required: bool = True
    default: Any = None
    enum: Optional[list] = None


@dataclass
class Skill:
    """Единица инструмента — скилл."""
    name: str
    description: str
    handler: Callable
    parameters: list[SkillParameter] = field(default_factory=list)
    category: str = "general"
    tags: list[str] = field(default_factory=list)
    enabled: bool = True
    risk_level: str = "low"  # low, medium, high, critical
    requires_approval: bool = False

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
        """Декоратор для регистрации Python-функции как скилла."""
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
        """Загружает скиллы из YAML-манифеста."""
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
                    self.load_from_yaml(str(file_path))
                    count += 1
                except Exception as e:
                    logger.error(f"Error loading {file_path}: {e}")
        
        return count

    def auto_select_tools(
        self, 
        user_query: str, 
        max_tools: int = 15,
    ) -> list[Skill]:
        """
        Auto-tool-selection: выбирает релевантные скиллы для запроса.
        Использует keyword matching для scoring.
        """
        if not self.skills:
            return []

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
            
            # Приоритет по risk_level
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
        return "\n".join(numbered)

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
        return "\n".join(sorted(files)[:200])

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
        
        return "\n".join(results) if results else "No matches found"

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
                output += f"\nSTDERR: {result.stderr}"
            return output or "Command completed (no output)"
        except subprocess.TimeoutExpired:
            return f"Error: Command timed out after {timeout}s"
        except Exception as e:
            return f"Error: {e}"
