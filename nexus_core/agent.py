"""
Agent — основной ReAct-цикл агента.
Think → Act → Observe loop с function calling.
"""

from __future__ import annotations

import json
import time
import asyncio
import logging
from enum import Enum
from dataclasses import dataclass, field
from typing import Any, Optional, AsyncIterator, Callable

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
        self._approval_callback: Optional[Callable] = None

    def set_approval_callback(self, callback: Callable) -> None:
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
        selected_skills = self.skills.auto_select_tools(user_input)
        tools_schema = self.skills.get_tools_schema(selected_skills)
        
        yield AgentEvent(type="content", data=f"🧠 Analyzing request and selecting tools...")
        yield AgentEvent(type="content", data=f"📦 Loaded {len(selected_skills)} relevant tools")
        
        # === ReAct Loop ===
        for step_num in range(1, self.max_steps + 1):
            step = AgentStep(step_number=step_num)
            self.steps.append(step)
            
            yield AgentEvent(type="content", data=f"\n--- Step {step_num} ---", step=step_num)
            
            try:
                # Get LLM response
                self.state = AgentState.THINKING
                
                response_text = ""
                tool_calls = []
                
                stream = await self.router.complete(
                    messages=messages,
                    tools=tools_schema if tools_schema else None,
                    stream=True,
                )
                
                async for chunk in stream:
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
                        data="\n✅ Task completed.",
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
