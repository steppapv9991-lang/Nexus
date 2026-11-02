"""Tests for NexusAgent."""

import pytest
from unittest.mock import AsyncMock, MagicMock

from nexus_core.agent import NexusAgent, AgentState, AgentStep, AgentEvent
from nexus_core.model_router import ModelRouter, ModelConfig, Provider
from nexus_core.skill_manager import SkillManager
from nexus_core.context_manager import ContextManager


@pytest.fixture
def mock_router():
    config = {
        "test": ModelConfig(
            model_id="gpt-4o-mini",
            provider=Provider.OPENAI,
        )
    }
    return ModelRouter(config)


@pytest.fixture
def skill_manager():
    return SkillManager()


@pytest.fixture
def context_manager():
    return ContextManager()


@pytest.fixture
def agent(mock_router, skill_manager, context_manager):
    return NexusAgent(
        router=mock_router,
        skill_manager=skill_manager,
        context_manager=context_manager,
    )


def test_agent_initialization(agent):
    """Test agent initializes correctly."""
    assert agent.state == AgentState.IDLE
    assert agent.max_steps == 25
    assert agent.steps == []


def test_agent_state_enum():
    """Test AgentState enum values."""
    assert AgentState.IDLE == "idle"
    assert AgentState.THINKING == "thinking"
    assert AgentState.ACTING == "acting"
    assert AgentState.DONE == "done"


def test_agent_step():
    """Test AgentStep dataclass."""
    step = AgentStep(
        step_number=1,
        thought="Let me analyze this",
        action="read_file",
        action_input={"path": "test.py"},
    )
    assert step.step_number == 1
    assert step.thought == "Let me analyze this"
    assert step.action == "read_file"


def test_agent_event():
    """Test AgentEvent dataclass."""
    event = AgentEvent(
        type="content",
        data="Hello world",
        step=1,
    )
    assert event.type == "content"
    assert event.data == "Hello world"
    assert event.step == 1


def test_get_session_summary(agent):
    """Test session summary generation."""
    summary = agent.get_session_summary()
    
    assert "total_steps" in summary
    assert "tools_used" in summary
    assert "total_cost" in summary
    assert "state" in summary
    assert summary["state"] == "idle"
