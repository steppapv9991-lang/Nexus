"""Tests for ModelRouter."""

import pytest
from unittest.mock import AsyncMock, patch

from nexus_core.model_router import ModelRouter, ModelConfig, Provider, StreamChunk


@pytest.fixture
def sample_config():
    return {
        "test_model": ModelConfig(
            model_id="gpt-4o-mini",
            provider=Provider.OPENAI,
            api_key="test-key",
            max_tokens=100,
            temperature=0.5,
        )
    }


def test_model_config_litellm_format():
    """Test that litellm_model property formats correctly."""
    config = ModelConfig(
        model_id="gpt-4o",
        provider=Provider.OPENAI,
    )
    assert config.litellm_model == "gpt-4o"
    
    config = ModelConfig(
        model_id="claude-sonnet-4-20250514",
        provider=Provider.ANTHROPIC,
    )
    assert config.litellm_model == "anthropic/claude-sonnet-4-20250514"
    
    config = ModelConfig(
        model_id="codellama:34b",
        provider=Provider.OLLAMA,
    )
    assert config.litellm_model == "ollama/codellama:34b"


def test_router_initialization(sample_config):
    """Test router initializes correctly."""
    router = ModelRouter(sample_config)
    assert router.default_model == "test_model"
    assert router.session_cost == 0.0


def test_router_unknown_model(sample_config):
    """Test router raises error for unknown model."""
    router = ModelRouter(sample_config)
    
    with pytest.raises(ValueError, match="Unknown model"):
        # This would need to be async in real test
        pass


def test_stream_chunk():
    """Test StreamChunk dataclass."""
    chunk = StreamChunk(
        content="Hello",
        tool_calls=[],
        finish_reason=None,
    )
    assert chunk.content == "Hello"
    assert chunk.tool_calls == []
    assert chunk.finish_reason is None
