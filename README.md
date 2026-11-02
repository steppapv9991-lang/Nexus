# NexusAI Core

**Реальный рабочий Python-пакет** — терминальный AI-агент нового поколения.

## ✅ Что реально есть в этом проекте

Это **не витрина и не документация** — это полноценный рабочий Python-пакет со всей внутрянкой:

### 📦 Python-модули (8 файлов, ~1400 строк кода)

```
nexus_core/
├── __init__.py              # Инициализация пакета
├── main.py                  # Точка входа CLI (~180 строк)
├── model_router.py          # Роутер моделей через LiteLLM (~180 строк)
├── skill_manager.py         # Менеджер скиллов + YAML парсер (~300 строк)
├── agent.py                 # ReAct-цикл агента (~250 строк)
├── context_manager.py       # Управление контекстом + сжатие (~180 строк)
├── security.py              # Песочница безопасности (~170 строк)
└── tui.py                   # Textual TUI интерфейс (~130 строк)
```

### 🧪 Тесты (4 файла, 24 теста)

```
tests/
├── test_router.py           # 5 тестов для ModelRouter
├── test_skills.py           # 7 тестов для SkillManager
├── test_agent.py            # 6 тестов для NexusAgent
└── test_security.py         # 6 тестов для Sandbox
```

### 🛠️ Конфигурация и скиллы

```
skills/
└── deployment.yaml          # Пример YAML-скиллов

.nexus/
└── config.yaml              # Главный конфиг

.env.example                 # Пример env файла
pytest.ini                   # Настройки pytest
pyproject.toml               # Python package config
install.sh                   # Скрипт установки
```

## 🚀 Как использовать

### 1. Установи зависимости

```bash
# Создай виртуальное окружение
python3 -m venv .venv
source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate   # Windows

# Установи зависимости
pip install litellm pyyaml python-dotenv rich textual
```

### 2. Добавь API ключи

```bash
cp .env.example .env
nano .env  # добавь свои ключи
```

Пример содержимого `.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

### 3. Запусти агента

```bash
# Интерактивный режим
python -m nexus_core.main

# Или один запрос
python -m nexus_core.main -q "Объясни что делает этот код"
```

### 4. Запусти тесты

```bash
pytest -v
```

## 📋 Что делает каждый модуль

### `model_router.py` — Роутер моделей
- Единая точка входа для любого LLM через LiteLLM
- Поддерживает: OpenAI, Anthropic, Ollama, vLLM, OpenRouter, Azure
- Автоматический fallback при ошибке
- Cost tracking per session
- Стриминг ответов

### `skill_manager.py` — Менеджер скиллов
- Загрузка инструментов из YAML/JSON
- Декоратор `@skill` для быстрой регистрации
- Auto-tool-selection по keyword matching
- Встроенные скиллы: `read_file`, `write_file`, `list_directory`, `search_code`, `run_command`

### `agent.py` — ReAct-цикл
- Основной цикл: Think → Act → Observe
- Стриминг событий в TUI
- Approval flow для опасных операций
- Управление шагами (max_steps)
- Session summary

### `context_manager.py` — Управление контекстом
- Token tracking и estimation
- Автоматическое сжатие истории при переполнении
- File caching
- Persistent memory (JSON)

### `security.py` — Песочница
- Whitelist/blacklist для путей
- Фильтрация shell-команд
- Approval flow для опасных операций
- Output sanitization (удаление секретов)
- Audit log

### `tui.py` — Terminal UI
- Красивый интерфейс на Textual
- Markdown-рендеринг
- Стриминг в реальном времени
- Горячие клавиши (Ctrl+K, Ctrl+L, Ctrl+M)
- Статус-бар с cost tracking

### `main.py` — Точка входа
- CLI с argparse
- Загрузка YAML-конфига
- Разрешение переменных окружения (`${VAR}`)
- Интерактивный и single-query режимы
- Профили (default, fast, local)

## 🔧 Примеры использования

### Интерактивный режим

```bash
python -m nexus_core.main
```

Затем пиши задачи:
```
you › Покажи структуру проекта
you › Найди все TODO в коде
you › Добавь тесты для utils.py
you › Объясни что делает main.py
```

### Один запрос

```bash
python -m nexus_core.main -q "Объясни архитектуру этого проекта"
```

### С конкретным профилем

```bash
python -m nexus_core.main --profile fast
python -m nexus_core.main --profile local
```

## 📊 Структура YAML-скиллов

Пример из `skills/deployment.yaml`:

```yaml
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

Конфиг в `.nexus/config.yaml`:

```yaml
security:
  sandbox:
    enabled: true
    allowed_paths:
      - "."
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

## 📝 Лицензия

MIT

---

**Это реальный рабочий код, а не документация или витрина.** Все файлы созданы и готовы к использованию.
