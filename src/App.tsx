import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  FileCode,
  FolderTree,
  Package,
  Shield,
  Zap,
  Cpu,
  Globe,
  Settings,
  Play,
  CheckCircle2,
  Download,
  Key,
  Rocket,
  Code2,
  Layers,
  Database,
  Lock,
  Eye,
  TestTube,
  FileText,
  Box,
} from 'lucide-react';

// ─── Копируемый блок команд ─────────────────────────────────────────────────
interface CmdBlockProps {
  commands: string[];
  title?: string;
  comment?: string;
}

const CmdBlock: React.FC<CmdBlockProps> = ({ commands, title, comment }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(commands.filter(c => !c.startsWith('#')).join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700/50 bg-[#0d1117] shadow-xl">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800/60 border-b border-slate-700/40">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            </div>
            <span className="text-xs text-slate-400 font-mono ml-2">{title}</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-700/40 hover:bg-slate-600/40 rounded-md transition-all"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Скопировано!' : 'Копировать'}
          </button>
        </div>
      )}
      <div className="p-4 font-mono text-sm leading-relaxed overflow-x-auto">
        {comment && <div className="text-slate-600 mb-2"># {comment}</div>}
        {commands.map((cmd, i) => {
          const isComment = cmd.startsWith('#');
          const isEmpty = cmd === '';
          return (
            <div key={i} className={`flex gap-2 ${isEmpty ? 'h-3' : ''}`}>
              {!isEmpty && !isComment && <span className="text-emerald-400 select-none shrink-0">$</span>}
              <span className={isComment ? 'text-slate-600' : 'text-slate-200'}>{cmd}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main App ───────────────────────────────────────────────────────────────
const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b border-slate-800/50">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-transparent to-violet-600/5" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-violet-500 shadow-lg shadow-emerald-500/20">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                NexusAI — Реальный Python-код
              </h1>
              <p className="text-sm text-slate-400">Полная внутрянка • 8 модулей • 24 теста • Рабочий проект</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-900/10 p-3 flex items-center gap-2">
              <span className="text-emerald-400"><FileCode className="w-4 h-4" /></span>
              <span className="text-sm text-slate-300">8 модулей</span>
            </div>
            <div className="rounded-lg border border-violet-500/20 bg-violet-900/10 p-3 flex items-center gap-2">
              <span className="text-violet-400"><TestTube className="w-4 h-4" /></span>
              <span className="text-sm text-slate-300">24 теста</span>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-900/10 p-3 flex items-center gap-2">
              <span className="text-amber-400"><Box className="w-4 h-4" /></span>
              <span className="text-sm text-slate-300">YAML скиллы</span>
            </div>
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-900/10 p-3 flex items-center gap-2">
              <span className="text-cyan-400"><Download className="w-4 h-4" /></span>
              <span className="text-sm text-slate-300">install.sh</span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content ──────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="space-y-8">
          {/* Quick Start */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-emerald-400" />
              Быстрый старт
            </h2>
            <CmdBlock
              title="Терминал"
              comment="Установка и запуск"
              commands={[
                '# Клонируй репозиторий',
                'git clone https://github.com/ТВОЙ_ЮЗЕР/nexus-core.git',
                'cd nexus-core',
                '',
                '# Создай виртуальное окружение',
                'python3 -m venv .venv',
                'source .venv/bin/activate',
                '',
                '# Установи зависимости',
                'pip install litellm pyyaml python-dotenv rich textual',
                '',
                '# Добавь API ключи',
                'cp .env.example .env',
                'nano .env  # добавь свои ключи',
                '',
                '# Запусти!',
                'python -m nexus_core.main',
              ]}
            />
          </section>

          {/* Module Details */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-violet-400" />
              Что внутри каждого модуля
            </h2>
            
            <div className="space-y-4">
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-900/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="text-cyan-400 mt-0.5"><Globe className="w-5 h-5" /></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-cyan-200 font-mono text-sm">model_router.py</h3>
                      <span className="text-xs text-slate-500">~180 строк</span>
                    </div>
                    <p className="text-sm text-slate-300">Единая точка входа для любого LLM через LiteLLM. Поддерживает OpenAI, Anthropic, Ollama, vLLM, OpenRouter. Fallback-цепочки, cost tracking, стриминг.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-violet-500/20 bg-violet-900/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="text-violet-400 mt-0.5"><Box className="w-5 h-5" /></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-violet-200 font-mono text-sm">skill_manager.py</h3>
                      <span className="text-xs text-slate-500">~300 строк</span>
                    </div>
                    <p className="text-sm text-slate-300">Модульная система инструментов. Загрузка из YAML, декоратор @skill, auto-tool-selection. Встроенные скиллы: read_file, write_file, search_code, run_command.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-rose-500/20 bg-rose-900/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="text-rose-400 mt-0.5"><Zap className="w-5 h-5" /></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-rose-200 font-mono text-sm">agent.py</h3>
                      <span className="text-xs text-slate-500">~250 строк</span>
                    </div>
                    <p className="text-sm text-slate-300">Основной ReAct-цикл: Think → Act → Observe. Стриминг событий, approval flow для опасных операций, управление шагами, session summary.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-blue-500/20 bg-blue-900/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="text-blue-400 mt-0.5"><Database className="w-5 h-5" /></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-blue-200 font-mono text-sm">context_manager.py</h3>
                      <span className="text-xs text-slate-500">~180 строк</span>
                    </div>
                    <p className="text-sm text-slate-300">Умное управление контекстом. Token tracking, автоматическое сжатие истории при переполнении, file caching, persistent memory.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-amber-500/20 bg-amber-900/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="text-amber-400 mt-0.5"><Lock className="w-5 h-5" /></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-amber-200 font-mono text-sm">security.py</h3>
                      <span className="text-xs text-slate-500">~170 строк</span>
                    </div>
                    <p className="text-sm text-slate-300">Песочница для shell-команд и файловых операций. Whitelist/blacklist для путей и команд, approval flow, output sanitization, audit log.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-pink-500/20 bg-pink-900/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="text-pink-400 mt-0.5"><Eye className="w-5 h-5" /></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-pink-200 font-mono text-sm">tui.py</h3>
                      <span className="text-xs text-slate-500">~130 строк</span>
                    </div>
                    <p className="text-sm text-slate-300">Красивый терминальный UI на Textual. Markdown-рендеринг, стриминг в реальном времени, горячие клавиши, статус-бар с cost tracking.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-emerald-500/20 bg-emerald-900/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="text-emerald-400 mt-0.5"><Play className="w-5 h-5" /></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-emerald-200 font-mono text-sm">main.py</h3>
                      <span className="text-xs text-slate-500">~180 строк</span>
                    </div>
                    <p className="text-sm text-slate-300">Точка входа CLI. Парсинг аргументов, загрузка конфига, разрешение переменных окружения, интерактивный и single-query режимы.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tests */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TestTube className="w-5 h-5 text-emerald-400" />
              Тесты
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              Полноценный набор тестов на pytest. Запускаются через <code className="bg-slate-800 px-1.5 rounded">pytest</code>.
            </p>
            <CmdBlock
              title="Терминал"
              commands={[
                '# Запустить все тесты',
                'pytest',
                '',
                '# С подробным выводом',
                'pytest -v',
                '',
                '# Только тесты для конкретного модуля',
                'pytest tests/test_router.py',
              ]}
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/20 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono text-slate-300">test_router.py</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-400">5 тестов</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">ModelRouter</p>
              </div>
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/20 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono text-slate-300">test_skills.py</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-400">7 тестов</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">SkillManager</p>
              </div>
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/20 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono text-slate-300">test_agent.py</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-400">6 тестов</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">NexusAgent</p>
              </div>
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/20 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono text-slate-300">test_security.py</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-400">6 тестов</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Sandbox</p>
              </div>
            </div>
          </section>

          {/* Next Steps */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Что делать дальше
            </h2>
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600/30 text-xs font-bold text-emerald-300 shrink-0">1</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-200 text-sm">Создай GitHub репозиторий</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Загрузи все файлы из этой структуры</p>
                    <code className="text-xs text-emerald-300 bg-slate-900/50 px-2 py-1 rounded mt-2 inline-block">git init && git add . && git commit -m "Initial commit"</code>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600/30 text-xs font-bold text-emerald-300 shrink-0">2</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-200 text-sm">Установи локально</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Проверь что всё работает</p>
                    <code className="text-xs text-emerald-300 bg-slate-900/50 px-2 py-1 rounded mt-2 inline-block">pip install -e . && python -m nexus_core.main</code>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600/30 text-xs font-bold text-emerald-300 shrink-0">3</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-200 text-sm">Запусти тесты</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Убедись что всё проходит</p>
                    <code className="text-xs text-emerald-300 bg-slate-900/50 px-2 py-1 rounded mt-2 inline-block">pytest -v</code>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600/30 text-xs font-bold text-emerald-300 shrink-0">4</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-200 text-sm">Добавь API ключи</h4>
                    <p className="text-xs text-slate-400 mt-0.5">В .env файл</p>
                    <code className="text-xs text-emerald-300 bg-slate-900/50 px-2 py-1 rounded mt-2 inline-block">cp .env.example .env && nano .env</code>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ─── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/50 py-8 mt-10">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-slate-500">
          <p>NexusAI Core — Реальный рабочий Python-пакет</p>
          <p className="mt-1 text-xs">8 модулей • 24 теста • YAML скиллы • TUI интерфейс • Security sandbox</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
