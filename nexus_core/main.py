"""
Main — точка входа CLI и TUI.
"""

from __future__ import annotations

import os
import sys
import asyncio
import argparse
import logging
from pathlib import Path

import yaml
from dotenv import load_dotenv

from .model_router import ModelRouter, ModelConfig, Provider
from .skill_manager import SkillManager
from .context_manager import ContextManager, ContextConfig
from .agent import NexusAgent, AgentEvent

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
    """Оркестратор — собирает все компоненты вместе."""

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

        # Разрешаем переменные окружения
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
        
        # Если нет моделей в конфиге — создаём дефолтную
        if not model_configs:
            model_configs["default"] = ModelConfig(
                model_id=os.getenv("DEFAULT_MODEL", "gpt-4o-mini"),
                provider=Provider(os.getenv("DEFAULT_PROVIDER", "openai")),
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
        """Рекурсивно заменяет ${VAR_NAME} на значения из окружения."""
        import re
        
        def resolve(value):
            if isinstance(value, str):
                pattern = r'\$\{(\w+)\}'
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

    async def start_interactive(self) -> None:
        """Запускает интерактивный цикл агента."""
        logger.info("NexusAI Core initialized")
        logger.info(f"Models: {list(self.router.configs.keys())}")
        logger.info(f"Skills: {len(self.skill_manager.skills)} loaded")
        
        print("\n🚀 NexusAI Agent Ready")
        print(f"   Model: {self.router.default_model}")
        print(f"   Tools: {len(self.skill_manager.skills)} available")
        print(f"   Cost:  ${self.router.session_cost:.4f}")
        print("\nType your request (or 'quit' to exit):\n")
        
        while True:
            try:
                user_input = input("you › ").strip()
                
                if not user_input:
                    continue
                
                if user_input.lower() in ("quit", "exit", "q"):
                    print("\nGoodbye! 👋")
                    break
                
                if user_input.startswith("/"):
                    # Handle commands
                    cmd = user_input[1:].split()
                    if cmd[0] == "cost":
                        print(f"\nSession cost: ${self.router.session_cost:.4f}")
                    elif cmd[0] == "tools":
                        print(f"\nAvailable tools: {list(self.skill_manager.skills.keys())}")
                    elif cmd[0] == "model":
                        if len(cmd) > 1:
                            self.router.default_model = cmd[1]
                            print(f"\nSwitched to model: {cmd[1]}")
                        else:
                            print(f"\nCurrent model: {self.router.default_model}")
                    continue
                
                # Run agent
                async for event in self.agent.run(user_input):
                    if event.type == "content":
                        print(event.data, end="", flush=True)
                    elif event.type == "action":
                        print(f"\n🔧 {event.data}")
                    elif event.type == "observation":
                        print(f"\n👁  {event.data[:200]}...")
                    elif event.type == "error":
                        print(f"\n❌ {event.data}")
                
                print()  # New line after response
                
            except KeyboardInterrupt:
                print("\n\nInterrupted. Type 'quit' to exit.")
            except EOFError:
                break


async def run_query(query: str, config: str, profile: str) -> None:
    """Выполняет один запрос и выходит."""
    core = NexusCore.from_config(config, profile)
    
    async for event in core.agent.run(query):
        if event.type == "content":
            print(event.data, end="", flush=True)
        elif event.type == "action":
            print(f"\n🔧 {event.data}")
        elif event.type == "error":
            print(f"\n❌ {event.data}")
    
    print()


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="NexusAI — Terminal AI Agent",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  nexus                         Start interactive mode
  nexus -q "explain this code"  Single query mode
  nexus --profile fast          Use fast profile
  nexus --model gpt-4o          Override model
        """
    )
    
    parser.add_argument("--config", default=".nexus/config.yaml", help="Config file path")
    parser.add_argument("--profile", default="default", help="Profile to use")
    parser.add_argument("--model", help="Override default model")
    parser.add_argument("-q", "--query", help="Single query mode")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    parser.add_argument("--version", action="version", version="NexusAI Core v1.0.0")
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    if args.query:
        asyncio.run(run_query(args.query, args.config, args.profile))
    else:
        core = NexusCore.from_config(args.config, args.profile)
        
        if args.model:
            core.router.default_model = args.model
        
        asyncio.run(core.start_interactive())


if __name__ == "__main__":
    main()
