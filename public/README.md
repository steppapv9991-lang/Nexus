# NexusAI Core

**Терминальный AI-агент нового поколения** — model-agnostic, модульный, безопасный.

![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-beta-orange.svg)

## 🚀 Возможности

- **Model-Agnostic** — работает с Claude, GPT-4, Gemini, локальными моделями (Ollama, vLLM)
- **Модульные скиллы** — инструменты загружаются из YAML, можно добавлять свои
- **Auto-tool-selection** — агент сам выбирает нужные инструменты для задачи
- **Локальный RAG** — поиск по кодовой базе через tree-sitter + векторный поиск
- **Умный контекст** — автоматическое сжатие истории при переполнении
- **Безопасность** — песочница для shell-команд, whitelist для путей
- **ReAct Loop** — прозрачный цикл Think → Act → Observe

## 📦 Установка

### Способ 1: Из исходников (рекомендуется)

```bash
# Клонируй репозиторий
git clone https://github.com/ТВОЙ_ЮЗЕР/nexus-core.git
cd nexus-core

# Создай виртуальное окружение
python3 -m venv .venv
source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate   # Windows

# Установи зависимости
pip install -e ".[full]"

# Запусти!
nexus
```

### Способ 2: Через install.sh

```bash
curl -fsSL https://raw.githubusercontent.com/ТВОЙ_ЮЗЕР/nexus-core/main/install.sh | bash
```

### Способ 3: Docker

```bash
docker pull nexusai/nexus:latest
docker run -it -v $(pwd):/workspace nexusai/nexus:latest
```

## 🔑 Настройка API ключей

Создай файл `~/.nexus/.env`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

Или экспортируй в терминале:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
```

## 🎯 Использование

### Интерактивный режим

```bash
cd ~/my-project
nexus
```

Затем пиши задачи на русском или английском:

```
ты › Добавь обработку ошибок в API endpoints
ты › Объясни что делает этот код
ты › Найди все баги в src/
ты › Напиши тесты для routes/api.ts
```

### Один запрос

```bash
nexus -q "Объясни архитектуру этого проекта"
```

### С конкретной моделью

```bash
nexus --profile fast          # Быстрая дешёвая модель
nexus --profile local         # Локальная модель (Ollama)
nexus --model gpt-4o          # Конкретная модель
```

## ⌨️ Горячие клавиши

| Клавиша | Действие |
|---------|----------|
| `Ctrl+K` | Палитра команд |
| `Ctrl+L` | Очистить экран |
| `Ctrl+C` | Отменить операцию |
| `Ctrl+D` | Выйти |
| `Ctrl+Z` | Отменить изменение файла |
| `Ctrl+M` | Переключить модель |
| `Ctrl+P` | Переключить профиль |
| `Tab` | Автодополнение |

## 🛠️ Скиллы (инструменты)

### Встроенные скиллы

- `read_file` — чтение файлов
- `write_file` — запись файлов
- `list_directory` — список файлов
- `search_code` — поиск по коду
- `run_command` — выполнение shell-команд
- `web_search` — поиск в интернете
- `git_diff` — git diff
- `rag_query` — запрос к локальному RAG

### Установка дополнительных скиллов

```bash
nexus skills list                    # Список установленных
nexus skills install devops-pack     # Установить набор
nexus skills new my-skill            # Создать свой
```

### Пример YAML-скилла

```yaml
# skills/deployment.yaml
skills:
  - name: "deploy_docker"
    description: "Build and deploy Docker container"
    category: "devops"
    risk_level: "high"
    requires_approval: true
    parameters:
      - name: "service_name"
        type: "string"
        description: "Name of the service"
        required: true
      - name: "tag"
        type: "string"
        description: "Docker image tag"
        default: "latest"
    handler_module: "skills.devops"
    handler_function: "deploy_docker"
```

## 🔒 Безопасность

NexusAI использует песочницу для безопасности:

```yaml
# ~/.nexus/config.yaml
security:
  sandbox:
    enabled: true
    allowed_paths:
      - "."              # текущая папка
      - "/tmp/nexus-*"
    blocked_paths:
      - "/etc/**"
      - "~/.ssh/**"
      - "~/.aws/**"
  shell:
    allowed_commands:
      - "ls" - "cat" - "grep" - "git"
    require_approval:
      - "rm" - "mv" - "sudo"
```

## 📊 Профили

```yaml
# ~/.nexus/config.yaml
profiles:
  default:
    model: "claude-sonnet-4-20250514"
    provider: "anthropic"
    max_tokens: 8192
    
  fast:
    model: "gpt-4o-mini"
    provider: "openai"
    max_tokens: 4096
    
  local:
    model: "codellama:34b"
    provider: "ollama"
    base_url: "http://localhost:11434"
```

Переключай на лету:

```bash
nexus --profile fast
nexus --profile local
```

## 🐛 Troubleshooting

### 'nexus: command not found'

```bash
# Добавь в PATH
export PATH="$HOME/.local/bin:$PATH"

# Или активируй venv
source ~/.nexus/venv/bin/activate
```

### API key errors

```bash
# Проверь что ключи установлены
nexus doctor

# Или установи вручную
export ANTHROPIC_API_KEY="sk-ant-..."
```

### Ollama не подключается

```bash
# Запусти Ollama
ollama serve

# Скачай модель
ollama pull codellama:34b
```

## 📚 Документация

- [Wiki](https://github.com/nexusai/nexus-core/wiki)
- [Примеры скиллов](https://github.com/nexusai/nexus-core/tree/main/examples/skills)
- [API Reference](https://github.com/nexusai/nexus-core/wiki/API)

## 🤝 Contributing

Приветствуется! Смотри [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 Лицензия

MIT © NexusAI Team

---

**Сделано с ❤️ для разработчиков, которые любят терминал**
