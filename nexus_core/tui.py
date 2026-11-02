"""
TUI — Terminal User Interface на Textual.
Красивый интерфейс с markdown-рендерингом и стримингом.
"""

from __future__ import annotations

from textual.app import App, ComposeResult
from textual.containers import Container, Horizontal, Vertical
from textual.widgets import Header, Footer, Static, Input, Markdown
from textual.reactive import reactive
from textual.binding import Binding

from ..agent import NexusAgent, AgentEvent


class NexusTUI(App):
    """NexusAI Terminal UI Application."""
    
    CSS = """
    Screen {
        background: $surface;
    }
    
    #main-container {
        layout: vertical;
        height: 100%;
    }
    
    #output-area {
        height: 1fr;
        border: solid $primary;
        padding: 1;
    }
    
    #input-area {
        dock: bottom;
        height: 3;
        padding: 0 1;
    }
    
    #status-bar {
        dock: bottom;
        height: 1;
        background: $primary-background;
        color: $text-muted;
        padding: 0 1;
    }
    
    .thinking {
        color: $warning;
    }
    
    .action {
        color: $success;
    }
    
    .error {
        color: $error;
    }
    """
    
    BINDINGS = [
        Binding("ctrl+q", "quit", "Quit"),
        Binding("ctrl+l", "clear", "Clear"),
        Binding("ctrl+m", "switch_model", "Model"),
    ]
    
    current_model: reactive[str] = reactive("claude-sonnet-4-20250514")
    status_text: reactive[str] = reactive("Ready")
    
    def __init__(self, agent: NexusAgent, **kwargs):
        super().__init__(**kwargs)
        self.agent = agent
        self.output_lines: list[str] = []
    
    def compose(self) -> ComposeResult:
        """Создаёт UI-компоненты."""
        yield Header()
        with Container(id="main-container"):
            yield Static(id="output-area")
            yield Input(placeholder="Type your request...", id="input-area")
            yield Static(id="status-bar")
        yield Footer()
    
    def on_mount(self) -> None:
        """Вызывается при запуске приложения."""
        self.update_status()
        self.query_one("#input-area", Input).focus()
        
        # Приветственное сообщение
        self.append_output("🚀 NexusAI Ready")
        self.append_output(f"   Model: {self.current_model}")
        self.append_output(f"   Tools: {len(self.agent.skills.skills)} available")
        self.append_output("")
    
    async def on_input_submitted(self, event: Input.Submitted) -> None:
        """Обрабатывает ввод пользователя."""
        user_input = event.value.strip()
        if not user_input:
            return
        
        event.input.clear()
        
        # Показываем запрос пользователя
        self.append_output(f"\n[cyan]you ›[/cyan] {user_input}")
        
        # Запускаем агента
        self.status_text = "Thinking..."
        
        try:
            async for agent_event in self.agent.run(user_input):
                self.handle_agent_event(agent_event)
        except Exception as e:
            self.append_output(f"[red]Error:[/red] {e}")
        
        self.status_text = "Ready"
    
    def handle_agent_event(self, event: AgentEvent) -> None:
        """Обрабатывает событие от агента."""
        if event.type == "content":
            self.append_output(event.data, end="")
        elif event.type == "action":
            tool = event.data.get("tool", "unknown")
            self.append_output(f"\n[green]🔧 {tool}[/green]")
        elif event.type == "observation":
            obs = str(event.data)[:200]
            self.append_output(f"[dim]👁  {obs}...[/dim]")
        elif event.type == "error":
            self.append_output(f"[red]❌ {event.data}[/red]")
    
    def append_output(self, text: str, end: str = "\n") -> None:
        """Добавляет текст в область вывода."""
        output = self.query_one("#output-area", Static)
        self.output_lines.append(text + end)
        
        # Показываем последние 100 строк
        display_text = "".join(self.output_lines[-100:])
        output.update(display_text)
    
    def update_status(self) -> None:
        """Обновляет статус-бар."""
        status = self.query_one("#status-bar", Static)
        cost = self.agent.router.session_cost
        status.update(f"Model: {self.current_model} | Cost: ${cost:.4f} | {self.status_text}")
    
    def action_clear(self) -> None:
        """Очищает вывод."""
        self.output_lines.clear()
        output = self.query_one("#output-area", Static)
        output.update("")
    
    def action_switch_model(self) -> None:
        """Переключает модель."""
        models = list(self.agent.router.configs.keys())
        current_idx = models.index(self.agent.router.default_model)
        next_idx = (current_idx + 1) % len(models)
        self.agent.router.default_model = models[next_idx]
        self.current_model = models[next_idx]
        self.append_output(f"\n[yellow]Switched to model: {self.current_model}[/yellow]")
        self.update_status()


def run_tui(agent: NexusAgent) -> None:
    """Запускает TUI-приложение."""
    app = NexusTUI(agent)
    app.run()
