"""
NexusAI Core — Terminal AI Agent
=================================
Model-agnostic, modular, secure AI agent for the terminal.
"""

__version__ = "1.0.0"
__author__ = "NexusAI Team"

from .model_router import ModelRouter, ModelConfig, Provider
from .skill_manager import SkillManager, Skill
from .context_manager import ContextManager
from .agent import NexusAgent
from .security import Sandbox, SecurityPolicy

__all__ = [
    "ModelRouter",
    "ModelConfig",
    "Provider",
    "SkillManager",
    "Skill",
    "ContextManager",
    "NexusAgent",
    "Sandbox",
    "SecurityPolicy",
]
