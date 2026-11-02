"""
Model Router — единая точка входа для любого LLM.
Поддерживает: OpenAI, Anthropic, Ollama, vLLM, OpenRouter.
"""

from __future__ import annotations

import os
import asyncio
import logging
from enum import Enum
from dataclasses import dataclass, field
from typing import AsyncIterator, Optional, Any

import litellm

logger = logging.getLogger("nexus.router")


class Provider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    OLLAMA = "ollama"
    VLLM = "vllm"
    OPENROUTER = "openrouter"
    AZURE = "azure"


@dataclass
class ModelConfig:
    """Конфигурация модели."""
    model_id: str
    provider: Provider
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    max_tokens: int = 4096
    temperature: float = 0.7
    context_window: int = 128_000
    fallback_models: list[str] = field(default_factory=list)
    input_cost: float = 0.0  # USD per 1M tokens
    output_cost: float = 0.0

    @property
    def litellm_model(self) -> str:
        """Формирует строку модели для LiteLLM."""
        prefix_map = {
            Provider.OPENAI: "",
            Provider.ANTHROPIC: "anthropic/",
            Provider.OLLAMA: "ollama/",
            Provider.VLLM: "openai/",
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
    """

    def __init__(self, configs: dict[str, ModelConfig]):
        self.configs = configs
        self.default_model: str = next(iter(configs), "default")
        self._session_cost: float = 0.0
        self._setup_api_keys()

    def _setup_api_keys(self) -> None:
        """Настраивает API-ключи из env или конфигов."""
        for config in self.configs.values():
            if config.api_key:
                env_key = f"{config.provider.value.upper()}_API_KEY"
                os.environ.setdefault(env_key, config.api_key)
            if config.base_url:
                env_key = f"{config.provider.value.upper()}_BASE_URL"
                os.environ.setdefault(env_key, config.base_url)

    async def complete(
        self,
        messages: list[dict],
        model: Optional[str] = None,
        tools: Optional[list[dict]] = None,
        stream: bool = True,
        **kwargs,
    ) -> AsyncIterator[StreamChunk]:
        """
        Основной метод для получения ответа от LLM.
        Возвращает async-генератор стриминговых чанков.
        """
        model_name = model or self.default_model
        config = self.configs.get(model_name)
        
        if not config:
            raise ValueError(f"Unknown model: {model_name}. Available: {list(self.configs.keys())}")

        params = {
            "model": config.litellm_model,
            "messages": messages,
            "max_tokens": config.max_tokens,
            "temperature": config.temperature,
            "stream": stream,
            **kwargs,
        }

        if tools:
            params["tools"] = tools
            params["tool_choice"] = "auto"

        # Fallback chain
        models_to_try = [config] + [
            self.configs[fb] for fb in config.fallback_models 
            if fb in self.configs
        ]

        last_error = None
        for i, model_config in enumerate(models_to_try):
            try:
                params["model"] = model_config.litellm_model
                logger.info(f"Calling model: {model_config.litellm_model}")
                
                response = await litellm.acompletion(**params)
                
                if stream:
                    return self._stream_response(response, model_config)
                else:
                    self._track_cost(response, model_config)
                    return response

            except Exception as e:
                last_error = e
                logger.warning(
                    f"Model {model_config.model_id} failed: {e}. "
                    f"Trying fallback ({i+1}/{len(models_to_try)})"
                )
                if i < len(models_to_try) - 1:
                    await asyncio.sleep(2 ** i)

        raise RuntimeError(f"All models failed. Last error: {last_error}")

    async def _stream_response(
        self, response, config: ModelConfig
    ) -> AsyncIterator[StreamChunk]:
        """Стриминговый ответ с обработкой tool_calls."""
        tool_calls_buffer: dict[int, dict] = {}
        
        async for chunk in response:
            if not chunk.choices:
                continue
                
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

    def _track_cost(self, response, config: ModelConfig) -> None:
        """Отслеживает стоимость использования модели."""
        if hasattr(response, "usage") and response.usage:
            input_tokens = response.usage.prompt_tokens
            output_tokens = response.usage.completion_tokens
            cost = (
                (input_tokens / 1_000_000) * config.input_cost +
                (output_tokens / 1_000_000) * config.output_cost
            )
            self._session_cost += cost

    @property
    def session_cost(self) -> float:
        return self._session_cost
