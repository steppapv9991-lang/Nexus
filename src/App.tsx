import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Package,
  Shield,
  Zap,
  GitBranch,
  Cpu,
  Globe,
  Settings,
  Play,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Download,
  Key,
  Rocket,
  BookOpen,
  ExternalLink,
  ChevronDown,
  Info,
  Lightbulb,
  HelpCircle,
  FolderOpen,
  Code2,
  Layers,
  Eye,
  MousePointer,
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
    navigator.clipboard.writeText(commands.join('\n'));
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
          const isOutput = cmd.startsWith('# →') || cmd.startsWith('#');
          const isEmpty = cmd === '';
          return (
            <div key={i} className={`flex gap-2 ${isEmpty ? 'h-3' : ''}`}>
              {!isEmpty && !isOutput && <span className="text-emerald-400 select-none shrink-0">$</span>}
              <span className={isOutput ? 'text-slate-500' : 'text-slate-200'}>{cmd}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Карточка шага ──────────────────────────────────────────────────────────
interface StepCardProps {
  number: number;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  color?: string;
}

const StepCard: React.FC<StepCardProps> = ({ number, title, icon, children, color = 'emerald' }) => {
  const colorMap: Record<string, { border: string; bg: string; text: string; iconBg: string }> = {
    emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-900/10', text: 'text-emerald-300', iconBg: 'bg-emerald-600/20 border-emerald-500/30' },
    violet: { border: 'border-violet-500/30', bg: 'bg-violet-900/10', text: 'text-violet-300', iconBg: 'bg-violet-600/20 border-violet-500/30' },
    cyan: { border: 'border-cyan-500/30', bg: 'bg-cyan-900/10', text: 'text-cyan-300', iconBg: 'bg-cyan-600/20 border-cyan-500/30' },
    amber: { border: 'border-amber-500/30', bg: 'bg-amber-900/10', text: 'text-amber-300', iconBg: 'bg-amber-600/20 border-amber-500/30' },
    rose: { border: 'border-rose-500/30', bg: 'bg-rose-900/10', text: 'text-rose-300', iconBg: 'bg-rose-600/20 border-rose-500/30' },
    blue: { border: 'border-blue-500/30', bg: 'bg-blue-900/10', text: 'text-blue-300', iconBg: 'bg-blue-600/20 border-blue-500/30' },
  };
  const c = colorMap[color] || colorMap.emerald;

  return (
    <div className={`relative rounded-xl border ${c.border} ${c.bg} p-6`}>
      <div className="flex items-start gap-4">
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 border ${c.iconBg}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-mono ${c.text}`}>Шаг {number}</span>
          </div>
          <h3 className={`text-lg font-semibold mb-3 ${c.text}`}>{title}</h3>
          {children}
        </div>
      </div>
    </div>
  );
};

// ─── Аккордеон ──────────────────────────────────────────────────────────────
interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-800/20 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 text-left text-sm font-medium text-slate-200 hover:bg-slate-700/20 transition-colors"
      >
        {title}
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
};

// ─── Анимация печати ────────────────────────────────────────────────────────
const TypeWriter: React.FC<{ text: string; speed?: number }> = ({ text, speed = 35 }) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && <span className="animate-pulse text-emerald-400">▊</span>}
    </span>
  );
};

// ─── Табы ───────────────────────────────────────────────────────────────────
type TabId = 'intro' | 'install' | 'config' | 'keys' | 'first-run' | 'faq';

// ─── Главный компонент ──────────────────────────────────────────────────────
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('intro');
  const [installMethod, setInstallMethod] = useState<'quick' | 'pip' | 'source' | 'docker'>('quick');

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'intro', label: 'Что это?', icon: <Info className="w-4 h-4" /> },
    { id: 'install', label: 'Установка', icon: <Download className="w-4 h-4" /> },
    { id: 'keys', label: 'API ключи', icon: <Key className="w-4 h-4" /> },
    { id: 'config', label: 'Настройка', icon: <Settings className="w-4 h-4" /> },
    { id: 'first-run', label: 'Первый запуск', icon: <Rocket className="w-4 h-4" /> },
    { id: 'faq', label: 'Проблемы', icon: <HelpCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* ─── Шапка ──────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b border-slate-800/50">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-transparent to-violet-600/5" />
        <div className="absolute inset-0">
          <div className="absolute top-10 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-violet-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-14">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                NexusAI — Инструкция по установке
              </h1>
              <p className="text-sm text-slate-400">Терминальный AI-агент • Настройка за 5 минут</p>
            </div>
          </div>

          {/* Анимированный терминал */}
          <div className="mt-6 rounded-xl border border-slate-700/50 bg-[#0d1117] overflow-hidden shadow-2xl max-w-2xl">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 border-b border-slate-700/40">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs text-slate-500 font-mono ml-2">терминал — установка</span>
            </div>
            <div className="p-5 font-mono text-sm space-y-1.5 min-h-[160px]">
              <div className="flex gap-2">
                <span className="text-emerald-400 select-none">❯</span>
                <TypeWriter text="curl -fsSL https://nexusai.dev/install.sh | bash" speed={30} />
              </div>
              <div className="text-slate-500 text-xs mt-3 space-y-1">
                <div>✓ Проверяю систему...</div>
                <div>✓ Python 3.12 найден</div>
                <div>✓ Устанавливаю nexus-core...</div>
                <div>✓ Создаю конфигурацию в ~/.nexus/</div>
                <div>✓ Загружаю базовые скиллы...</div>
                <div className="text-emerald-400">✓ NexusAI установлен! Запустите <span className="text-white font-semibold">nexus</span> для начала работы.</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Навигация ──────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto py-3">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ─── Контент ────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* ═══ ВКЛАДКА: ЧТО ЭТО? ═══ */}
        {activeTab === 'intro' && (
          <div className="space-y-8">
            <div className="rounded-xl border border-violet-500/20 bg-violet-900/10 p-6">
              <h2 className="text-2xl font-bold text-violet-200 mb-3">Что такое NexusAI?</h2>
              <p className="text-slate-300 leading-relaxed">
                <strong className="text-white">NexusAI</strong> — это терминальный AI-агент, который работает прямо в вашем терминале.
                Он может читать и писать файлы, выполнять команды, искать по коду, запускать тесты — и всё это
                управляется искусственным интеллектом. Вы просто описываете задачу на русском или английском языке,
                а агент сам разбирается, какие инструменты использовать.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-900/10 p-5">
                <div className="text-cyan-400 mb-2"><Globe className="w-5 h-5" /></div>
                <h3 className="font-semibold text-cyan-200 mb-1">Любая модель</h3>
                <p className="text-sm text-slate-400">Работает с Claude, GPT-4, Gemini, локальными моделями через Ollama. Переключайте одной командой.</p>
              </div>
              <div className="rounded-xl border border-violet-500/20 bg-violet-900/10 p-5">
                <div className="text-violet-400 mb-2"><Layers className="w-5 h-5" /></div>
                <h3 className="font-semibold text-violet-200 mb-1">Модульные скиллы</h3>
                <p className="text-sm text-slate-400">Инструменты загружаются из YAML-файлов. Можно добавлять свои или скачивать готовые наборы.</p>
              </div>
              <div className="rounded-xl border border-rose-500/20 bg-rose-900/10 p-5">
                <div className="text-rose-400 mb-2"><Shield className="w-5 h-5" /></div>
                <h3 className="font-semibold text-rose-200 mb-1">Безопасность</h3>
                <p className="text-sm text-slate-400">Песочница для команд, whitelist для путей, запрос подтверждения перед опасными операциями.</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-6">
              <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                Как это работает? Простыми словами
              </h3>
              <div className="space-y-4">
                {[
                  { step: '1', text: 'Вы пишете задачу в терминале, например: "Добавь обработку ошибок в API"', emoji: '💬' },
                  { step: '2', text: 'Агент анализирует ваш проект — читает файлы, ищет нужные места', emoji: '🔍' },
                  { step: '3', text: 'Думает, какие инструменты использовать (чтение файлов, поиск, запись)', emoji: '🧠' },
                  { step: '4', text: 'Показывает вам изменения (diff) и спрашивает подтверждение', emoji: '👀' },
                  { step: '5', text: 'После вашего "ОК" — применяет изменения', emoji: '✅' },
                ].map(s => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-700/50 text-sm font-bold text-slate-300 shrink-0">
                      {s.step}
                    </div>
                    <p className="text-sm text-slate-300 pt-0.5">
                      <span className="mr-2">{s.emoji}</span>{s.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setActiveTab('install')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors shadow-lg shadow-emerald-500/20"
              >
                Понятно, давай устанавливать!
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ═══ ВКЛАДКА: УСТАНОВКА ═══ */}
        {activeTab === 'install' && (
          <div className="space-y-8">
            {/* Требования */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-amber-400" />
                Что нужно перед установкой
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Python', value: '3.11 или новее', hint: 'Проверь: python3 --version' },
                  { label: 'ОС', value: 'Linux или macOS', hint: 'Windows через WSL2' },
                  { label: 'Память', value: '4 ГБ минимум', hint: 'Для локальных моделей — 16+' },
                  { label: 'Диск', value: '~500 МБ', hint: 'С RAG и моделями больше' },
                ].map(req => (
                  <div key={req.label} className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs text-slate-500">{req.label}</span>
                    </div>
                    <div className="text-sm font-medium text-slate-200">{req.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{req.hint}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Выбор метода */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-400" />
                Выбери способ установки
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { id: 'quick' as const, label: 'Быстрая', icon: <Zap className="w-4 h-4" />, time: '30 сек', desc: 'Одной командой' },
                  { id: 'pip' as const, label: 'Через pip', icon: <Package className="w-4 h-4" />, time: '2 мин', desc: 'Стандартный способ' },
                  { id: 'source' as const, label: 'Из исходников', icon: <GitBranch className="w-4 h-4" />, time: '5 мин', desc: 'Для разработчиков' },
                  { id: 'docker' as const, label: 'Docker', icon: <Download className="w-4 h-4" />, time: '3 мин', desc: 'В контейнере' },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setInstallMethod(m.id)}
                    className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border transition-all ${
                      installMethod === m.id
                        ? 'border-emerald-500/40 bg-emerald-900/15 shadow-lg shadow-emerald-500/5'
                        : 'border-slate-700/50 bg-slate-800/20 hover:border-slate-600/50'
                    }`}
                  >
                    <span className={installMethod === m.id ? 'text-emerald-400' : 'text-slate-400'}>{m.icon}</span>
                    <span className={`text-sm font-medium ${installMethod === m.id ? 'text-emerald-300' : 'text-slate-300'}`}>{m.label}</span>
                    <span className="text-xs text-slate-500">{m.time}</span>
                    <span className="text-xs text-slate-600">{m.desc}</span>
                  </button>
                ))}
              </div>

              {/* Команды для выбранного метода */}
              <div className="space-y-4">
                {installMethod === 'quick' && (
                  <>
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-900/10 p-4 mb-4">
                      <p className="text-sm text-emerald-200">
                        <strong>💡 Самый простой способ</strong> — одна команда делает всё автоматически:
                        проверяет систему, устанавливает пакет, создаёт конфигурацию.
                      </p>
                    </div>
                    <CmdBlock
                      title="Терминал"
                      comment="Скопируй и вставь в терминал"
                      commands={['curl -fsSL https://nexusai.dev/install.sh | bash']}
                    />
                    <div className="text-sm text-slate-400 mt-3">
                      <p className="mb-2">Что делает этот скрипт:</p>
                      <ul className="space-y-1 text-slate-500">
                        <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" /> Проверяет, что Python 3.11+ установлен</li>
                        <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" /> Устанавливает <code className="text-emerald-300 bg-slate-800 px-1 rounded">nexus-core</code> через pip</li>
                        <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" /> Создаёт папку <code className="text-emerald-300 bg-slate-800 px-1 rounded">~/.nexus/</code> с настройками</li>
                        <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" /> Добавляет команду <code className="text-emerald-300 bg-slate-800 px-1 rounded">nexus</code> в PATH</li>
                      </ul>
                    </div>
                  </>
                )}

                {installMethod === 'pip' && (
                  <>
                    <div className="rounded-lg border border-blue-500/20 bg-blue-900/10 p-4 mb-4">
                      <p className="text-sm text-blue-200">
                        <strong>💡 Стандартный способ</strong> — установка через Python-менеджер пакетов pip.
                        Рекомендуется использовать виртуальное окружение.
                      </p>
                    </div>
                    <CmdBlock
                      title="Терминал"
                      comment="Шаг 1: Создаём виртуальное окружение (чтобы не засорять систему)"
                      commands={[
                        'python3 -m venv ~/.nexus/venv',
                        'source ~/.nexus/venv/bin/activate',
                      ]}
                    />
                    <CmdBlock
                      title="Терминал"
                      comment="Шаг 2: Устанавливаем NexusAI"
                      commands={[
                        '# Базовая установка',
                        'pip install nexus-core',
                        '',
                        '# Или полная версия (со всеми фичами)',
                        'pip install "nexus-core[full]"',
                      ]}
                    />
                    <CmdBlock
                      title="Терминал"
                      comment="Шаг 3: Инициализация — создаёт конфиг и папку скиллов"
                      commands={['nexus init']}
                    />
                    <div className="rounded-lg border border-amber-500/20 bg-amber-900/10 p-4">
                      <p className="text-sm text-amber-200">
                        <strong>📦 Что входит в [full]:</strong>
                      </p>
                      <ul className="text-xs text-slate-400 mt-2 space-y-1">
                        <li>• <code className="text-amber-200 bg-slate-800 px-1 rounded">[rag]</code> — tree-sitter + ChromaDB для поиска по коду</li>
                        <li>• <code className="text-amber-200 bg-slate-800 px-1 rounded">[tui]</code> — красивый интерфейс в терминале</li>
                        <li>• <code className="text-amber-200 bg-slate-800 px-1 rounded">[all-providers]</code> — поддержка всех LLM-провайдеров</li>
                      </ul>
                    </div>
                  </>
                )}

                {installMethod === 'source' && (
                  <>
                    <div className="rounded-lg border border-violet-500/20 bg-violet-900/10 p-4 mb-4">
                      <p className="text-sm text-violet-200">
                        <strong>💡 Для разработчиков</strong> — клонируешь репозиторий и можешь менять код.
                        Удобно если хочешь добавить свои скиллы или модифицировать агента.
                      </p>
                    </div>
                    <CmdBlock
                      title="Терминал"
                      commands={[
                        '# Клонируем репозиторий',
                        'git clone https://github.com/nexusai/nexus-core.git',
                        'cd nexus-core',
                        '',
                        '# Создаём виртуальное окружение',
                        'python3 -m venv .venv',
                        'source .venv/bin/activate',
                        '',
                        '# Устанавливаем в режиме разработки',
                        'pip install -e ".[full]"',
                        '',
                        '# Проверяем что тесты проходят',
                        'pytest tests/ -v',
                        '',
                        '# Инициализация',
                        'nexus init',
                      ]}
                    />
                  </>
                )}

                {installMethod === 'docker' && (
                  <>
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-900/10 p-4 mb-4">
                      <p className="text-sm text-cyan-200">
                        <strong>💡 Изолированный запуск</strong> — всё работает в контейнере, не засоряет систему.
                        Твой проект монтируется внутрь контейнера.
                      </p>
                    </div>
                    <CmdBlock
                      title="Терминал"
                      commands={[
                        '# Скачиваем образ',
                        'docker pull nexusai/nexus:latest',
                        '',
                        '# Запускаем с твоим проектом',
                        'docker run -it \\',
                        '  -v $(pwd):/workspace \\',
                        '  -v ~/.nexus:/root/.nexus \\',
                        '  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \\',
                        '  nexusai/nexus:latest',
                      ]}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Проверка */}
            <StepCard number={0} title="Проверь что всё установилось" icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />} color="emerald">
              <p className="text-sm text-slate-400 mb-3">
                Выполни эти команды — если всё хорошо, увидишь версию и статус всех компонентов:
              </p>
              <CmdBlock
                title="Терминал"
                commands={[
                  'nexus --version',
                  '# → NexusAI Core v1.0.0',
                  '',
                  'nexus doctor',
                  '# → ✓ Python 3.12.1',
                  '# → ✓ LiteLLM 1.24.0',
                  '# → ✓ Tree-sitter OK',
                  '# → ✓ Конфиг: ~/.nexus/config.yaml',
                  '# → ✓ 8 скиллов загружено',
                  '# → Все проверки пройдены ✓',
                ]}
              />
            </StepCard>
          </div>
        )}

        {/* ═══ ВКЛАДКА: API КЛЮЧИ ═══ */}
        {activeTab === 'keys' && (
          <div className="space-y-8">
            <div className="rounded-xl border border-amber-500/20 bg-amber-900/10 p-6">
              <h2 className="text-xl font-bold text-amber-200 mb-2 flex items-center gap-2">
                <Key className="w-5 h-5" />
                Зачем нужны API ключи?
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                API ключ — это как пароль для доступа к AI-моделям. Когда NexusAI отправляет запрос к Claude или GPT-4,
                он использует этот ключ для авторизации. Ключи дают провайдеры (Anthropic, OpenAI и т.д.).
                <strong className="text-amber-200"> Без хотя бы одного ключа агент не сможет работать.</strong>
              </p>
            </div>

            <StepCard number={1} title="Получи API ключ" icon={<Key className="w-5 h-5 text-amber-400" />} color="amber">
              <p className="text-sm text-slate-400 mb-4">
                Зарегистрируйся на сайте провайдера и создай ключ. Вот самые популярные:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg border border-violet-500/20 bg-violet-900/10 p-4 relative">
                  <div className="absolute -top-2 right-3 px-2 py-0.5 text-xs bg-violet-600 text-white rounded-full">
                    Рекомендуется
                  </div>
                  <h4 className="font-semibold text-violet-200 mb-1">Anthropic (Claude)</h4>
                  <p className="text-xs text-slate-400 mb-1">Модель: Claude Sonnet 4</p>
                  <p className="text-xs text-slate-500 mb-2">$3 / $15 за 1M токенов</p>
                  <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1">
                    console.anthropic.com <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-900/10 p-4">
                  <h4 className="font-semibold text-emerald-200 mb-1">OpenAI (GPT)</h4>
                  <p className="text-xs text-slate-400 mb-1">Модель: GPT-4o</p>
                  <p className="text-xs text-slate-500 mb-2">$2.5 / $10 за 1M токенов</p>
                  <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1">
                    platform.openai.com <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-900/10 p-4">
                  <h4 className="font-semibold text-cyan-200 mb-1">OpenRouter</h4>
                  <p className="text-xs text-slate-400 mb-1">Модель: Любая модель</p>
                  <p className="text-xs text-slate-500 mb-2">Зависит от модели</p>
                  <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1">
                    openrouter.ai <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
                <p className="text-xs text-slate-400">
                  <strong className="text-slate-300">🏠 Локальные модели (бесплатно):</strong> Если у тебя мощная видеокарта (16GB+ VRAM),
                  можешь использовать Ollama для запуска моделей локально. Ключ не нужен!
                </p>
              </div>
            </StepCard>

            <StepCard number={2} title="Сохрани ключ в NexusAI" icon={<Settings className="w-5 h-5 text-violet-400" />} color="violet">
              <p className="text-sm text-slate-400 mb-3">
                Создай файл <code className="text-violet-300 bg-slate-800 px-1.5 rounded">~/.nexus/.env</code> и добавь туда ключи:
              </p>
              <CmdBlock
                title="Терминал"
                comment="Создаём файл с ключами"
                commands={[
                  '# Открываем файл в редакторе',
                  'nano ~/.nexus/.env',
                  '',
                  '# Или одной командой (замени на свой ключ):',
                  'echo "ANTHROPIC_API_KEY=sk-ant-твой_ключ_сюда" >> ~/.nexus/.env',
                ]}
              />
              <div className="mt-3 rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 font-mono text-sm">
                <div className="text-slate-500 mb-2"># Содержимое ~/.nexus/.env:</div>
                <div className="text-slate-300">ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxx</div>
                <div className="text-slate-300">OPENAI_API_KEY=sk-xxxxxxxxxxxx</div>
                <div className="text-slate-500 mt-2"># Можно добавить несколько — NexusAI сам выберет</div>
              </div>
              <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-900/10 p-3">
                <p className="text-xs text-rose-200">
                  <strong>⚠️ Важно:</strong> Никогда не коммить файл .env в git! Он уже добавлен в .gitignore.
                  Не публикуй свои ключи в интернете.
                </p>
              </div>
            </StepCard>

            <StepCard number={3} title="Проверь что ключ работает" icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />} color="emerald">
              <CmdBlock
                title="Терминал"
                commands={[
                  'nexus doctor',
                  '# → ✓ ANTHROPIC_API_KEY установлен',
                  '# → ✓ Подключение к API работает',
                  '# → ✓ Модель claude-sonnet-4-20250514 доступна',
                ]}
              />
            </StepCard>
          </div>
        )}

        {/* ═══ ВКЛАДКА: НАСТРОЙКА ═══ */}
        {activeTab === 'config' && (
          <div className="space-y-8">
            <div className="rounded-xl border border-violet-500/20 bg-violet-900/10 p-6">
              <h2 className="text-xl font-bold text-violet-200 mb-2 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Настройка NexusAI
              </h2>
              <p className="text-slate-300 text-sm">
                Главный файл настроек — <code className="text-violet-300 bg-slate-800 px-1.5 rounded">~/.nexus/config.yaml</code>.
                Тут указывается какая модель по умолчанию, какие скиллы загружать, настройки безопасности и т.д.
              </p>
            </div>

            <StepCard number={1} title="Выбери модель по умолчанию" icon={<Globe className="w-5 h-5 text-cyan-400" />} color="cyan">
              <p className="text-sm text-slate-400 mb-3">
                Открой конфиг в редакторе и укажи какую модель использовать:
              </p>
              <CmdBlock
                title="Терминал"
                commands={[
                  '# Открываем конфиг в редакторе',
                  'nexus config edit',
                  '',
                  '# Или напрямую:',
                  'nano ~/.nexus/config.yaml',
                ]}
              />
              <div className="mt-3 rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 font-mono text-sm">
                <div className="text-slate-500 mb-2"># Найди секцию profiles и измени:</div>
                <div><span className="text-violet-400">profiles:</span></div>
                <div><span className="text-cyan-400">  default:</span></div>
                <div className="text-slate-300">    model: <span className="text-emerald-300">"claude-sonnet-4-20250514"</span></div>
                <div className="text-slate-300">    provider: <span className="text-emerald-300">"anthropic"</span></div>
                <div className="text-slate-300">    max_tokens: <span className="text-amber-300">8192</span></div>
              </div>
              <div className="mt-3 text-sm text-slate-400">
                <p className="mb-2">Можно создать несколько профилей и переключаться между ними:</p>
                <CmdBlock
                  title="Терминал"
                  commands={[
                    '# Использовать быстрый профиль (дешевле)',
                    'nexus --profile fast',
                    '',
                    '# Использовать локальную модель (бесплатно)',
                    'nexus --profile local',
                  ]}
                />
              </div>
            </StepCard>

            <StepCard number={2} title="Настрой безопасность" icon={<Shield className="w-5 h-5 text-rose-400" />} color="rose">
              <p className="text-sm text-slate-400 mb-3">
                Укажи, что агенту разрешено делать, а что нет. Это важно — защищает твою систему:
              </p>
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 font-mono text-xs leading-relaxed">
                <div className="text-slate-500"># В ~/.nexus/config.yaml найди секцию security:</div>
                <div className="text-rose-400">security:</div>
                <div className="text-rose-400">  sandbox:</div>
                <div className="text-slate-300">    enabled: <span className="text-emerald-300">true</span></div>
                <div className="text-slate-300">    allowed_paths:</div>
                <div className="text-emerald-300">      - "."              <span className="text-slate-500"># текущая папка проекта</span></div>
                <div className="text-emerald-300">      - "/tmp/nexus-*"   <span className="text-slate-500"># временные файлы</span></div>
                <div className="text-slate-300">    blocked_paths:</div>
                <div className="text-rose-300">      - "/etc/**"          <span className="text-slate-500"># системные файлы</span></div>
                <div className="text-rose-300">      - "~/.ssh/**"        <span className="text-slate-500"># SSH ключи</span></div>
                <div className="text-rose-300">      - "~/.aws/**"        <span className="text-slate-500"># AWS креды</span></div>
                <div className="text-slate-300">    require_approval:</div>
                <div className="text-amber-300">      - "rm"             <span className="text-slate-500"># спросит перед удалением</span></div>
                <div className="text-amber-300">      - "mv"             <span className="text-slate-500"># спросит перед перемещением</span></div>
              </div>
              <div className="mt-3 rounded-lg border border-blue-500/20 bg-blue-900/10 p-3">
                <p className="text-xs text-blue-200">
                  <strong>💡 Совет:</strong> Для начала оставь настройки по умолчанию — они достаточно строгие.
                  Ослабляй только если агенту нужно работать с дополнительными папками.
                </p>
              </div>
            </StepCard>

            <StepCard number={3} title="Установи скиллы (доп. возможности)" icon={<Package className="w-5 h-5 text-emerald-400" />} color="emerald">
              <p className="text-sm text-slate-400 mb-3">
                Скиллы — это дополнительные инструменты для агента. Базовые уже встроены (чтение файлов, поиск, команды),
                но можно добавить специализированные:
              </p>
              <CmdBlock
                title="Терминал"
                commands={[
                  '# Посмотреть какие скиллы уже есть',
                  'nexus skills list',
                  '',
                  '# Установить набор для DevOps',
                  'nexus skills install nexusai/skill-pack-devops',
                  '',
                  '# Установить набор для тестирования',
                  'nexus skills install nexusai/skill-pack-testing',
                  '',
                  '# Создать свой скилл',
                  'nexus skills new мой-скилл',
                ]}
              />
            </StepCard>
          </div>
        )}

        {/* ═══ ВКЛАДКА: ПЕРВЫЙ ЗАПУСК ═══ */}
        {activeTab === 'first-run' && (
          <div className="space-y-8">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-900/10 p-6">
              <h2 className="text-xl font-bold text-emerald-200 mb-2 flex items-center gap-2">
                <Rocket className="w-5 h-5" />
                Первый запуск
              </h2>
              <p className="text-slate-300 text-sm">
                Всё готово! Давай запустим агента и попробуем что-нибудь сделать.
              </p>
            </div>

            <StepCard number={1} title="Перейди в папку проекта" icon={<FolderOpen className="w-5 h-5 text-amber-400" />} color="amber">
              <CmdBlock
                title="Терминал"
                comment="NexusAI работает с текущей папкой — перейди в свой проект"
                commands={[
                  'cd ~/my-project',
                  '',
                  '# Или создай тестовую папку:',
                  'mkdir ~/test-nexus && cd ~/test-nexus',
                ]}
              />
            </StepCard>

            <StepCard number={2} title="Запусти NexusAI" icon={<Play className="w-5 h-5 text-emerald-400" />} color="emerald">
              <CmdBlock
                title="Терминал"
                commands={['nexus']}
              />
              <p className="text-sm text-slate-400 mt-3">
                Ты увидишь приветствие агента с информацией о модели и загруженных инструментах.
              </p>
            </StepCard>

            <StepCard number={3} title="Попробуй задачу" icon={<MousePointer className="w-5 h-5 text-violet-400" />} color="violet">
              <p className="text-sm text-slate-400 mb-3">
                Вот несколько примеров что можно попросить:
              </p>
              <div className="rounded-xl border border-slate-700/50 bg-[#0d1117] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/60 border-b border-slate-700/40">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                  </div>
                  <span className="text-xs text-slate-500 font-mono ml-2">сессия nexus</span>
                </div>
                <div className="p-4 font-mono text-sm space-y-3">
                  <div className="text-slate-500">🚀 NexusAI v1.0.0 | Модель: claude-sonnet | 8 инструментов</div>
                  <div className="text-slate-500">────────────────────────────────────────────────</div>

                  <div className="flex gap-2">
                    <span className="text-cyan-400 shrink-0">ты ›</span>
                    <span className="text-white">Покажи структуру этого проекта и объясни что он делает</span>
                  </div>

                  <div className="text-violet-400">🧠 Анализирую... выбрал 3 инструмента</div>
                  <div className="text-slate-400">📂 list_directory(".")</div>
                  <div className="text-slate-400">📂 read_file("README.md")</div>
                  <div className="text-slate-400">📂 read_file("package.json")</div>

                  <div className="text-slate-200 mt-2">
                    Это Node.js приложение для управления задачами. Структура:
                  </div>
                  <div className="text-slate-400 text-xs ml-2">
                    <div>├── src/</div>
                    <div>│   ├── app.ts — главный файл</div>
                    <div>│   ├── routes/ — API endpoints</div>
                    <div>│   └── models/ — модели данных</div>
                    <div>├── tests/ — тесты</div>
                    <div>└── package.json — зависимости</div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <span className="text-cyan-400 shrink-0">ты ›</span>
                    <span className="text-white">Добавь тесты для routes/api.ts</span>
                  </div>

                  <div className="text-violet-400">🧠 Пишу тесты...</div>
                  <div className="text-amber-400 mt-1">⚡ Предлагаю создать файл tests/api.test.ts</div>
                  <div className="text-amber-400">⚡ [a] принять | [r] посмотреть diff | [e] изменить</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'Объясни что делает этот код',
                  'Найди все баги в src/',
                  'Напиши документацию для API',
                  'Добавь обработку ошибок',
                  'Оптимизируй этот SQL запрос',
                  'Создай unit-тесты',
                ].map(example => (
                  <div key={example} className="rounded-lg border border-slate-700/50 bg-slate-800/20 px-3 py-2 text-sm text-slate-300 font-mono">
                    <span className="text-cyan-500 mr-1">›</span> {example}
                  </div>
                ))}
              </div>
            </StepCard>

            <StepCard number={4} title="Горячие клавиши" icon={<Code2 className="w-5 h-5 text-blue-400" />} color="blue">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { keys: 'Ctrl + K', action: 'Палитра команд (быстрый поиск)' },
                  { keys: 'Ctrl + L', action: 'Очистить экран' },
                  { keys: 'Ctrl + C', action: 'Отменить текущую операцию' },
                  { keys: 'Ctrl + D', action: 'Выйти из NexusAI' },
                  { keys: 'Ctrl + Z', action: 'Отменить последнее изменение файла' },
                  { keys: 'Ctrl + M', action: 'Переключить модель' },
                  { keys: 'Ctrl + P', action: 'Переключить профиль' },
                  { keys: 'Tab', action: 'Автодополнение' },
                ].map(kb => (
                  <div key={kb.keys} className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/20 px-3 py-2">
                    <span className="text-sm text-slate-300">{kb.action}</span>
                    <kbd className="px-2 py-0.5 text-xs font-mono bg-slate-700/50 border border-slate-600/50 rounded text-slate-300">
                      {kb.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </StepCard>
          </div>
        )}

        {/* ═══ ВКЛАДКА: ПРОБЛЕМЫ ═══ */}
        {activeTab === 'faq' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-amber-500/20 bg-amber-900/10 p-6">
              <h2 className="text-xl font-bold text-amber-200 mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Если что-то не работает
              </h2>
              <p className="text-slate-300 text-sm">
                Вот самые частые проблемы и их решения. Нажми на проблему чтобы увидеть подробности.
              </p>
            </div>

            <div className="space-y-3">
              <Accordion title="❌ Команда 'nexus' не найдена" defaultOpen>
                <div className="text-sm text-slate-300 space-y-3">
                  <p><strong>Причина:</strong> Папка с Python-программами не добавлена в PATH.</p>
                  <p><strong>Решение:</strong> Добавь её в настройки терминала:</p>
                  <CmdBlock commands={[
                    '# Для Bash (Linux)',
                    'echo \'export PATH="$HOME/.local/bin:$PATH"\' >> ~/.bashrc',
                    'source ~/.bashrc',
                    '',
                    '# Для Zsh (macOS)',
                    'echo \'export PATH="$HOME/.local/bin:$PATH"\' >> ~/.zshrc',
                    'source ~/.zshrc',
                    '',
                    '# Если использовал venv — активируй его:',
                    'source ~/.nexus/venv/bin/activate',
                  ]} />
                </div>
              </Accordion>

              <Accordion title="❌ Ошибка 'ModuleNotFoundError: No module named litellm'">
                <div className="text-sm text-slate-300 space-y-3">
                  <p><strong>Причина:</strong> Зависимости не установились или установились в другое окружение.</p>
                  <CmdBlock commands={[
                    '# Переустанови пакет',
                    'pip install --upgrade nexus-core',
                    '',
                    '# Если используешь venv — проверь что он активирован:',
                    'which python  # должно показывать путь к venv',
                    'source ~/.nexus/venv/bin/activate',
                    'pip install "nexus-core[full]"',
                  ]} />
                </div>
              </Accordion>

              <Accordion title="❌ Ошибка 401 / 'Invalid API key'">
                <div className="text-sm text-slate-300 space-y-3">
                  <p><strong>Причина:</strong> API ключ не установлен или неправильный.</p>
                  <CmdBlock commands={[
                    '# Проверь что ключ установлен:',
                    'nexus doctor',
                    '',
                    '# Или вручную:',
                    'echo $ANTHROPIC_API_KEY',
                    '',
                    '# Если пусто — установи:',
                    'export ANTHROPIC_API_KEY="sk-ant-твой_ключ"',
                    '',
                    '# Или добавь в ~/.nexus/.env:',
                    'echo "ANTHROPIC_API_KEY=sk-ant-..." >> ~/.nexus/.env',
                  ]} />
                  <p className="text-xs text-slate-500">
                    💡 Проверь что ключ правильный — зайди на сайт провайдера и скопируй заново.
                  </p>
                </div>
              </Accordion>

              <Accordion title="❌ Ollama не подключается (Connection refused)">
                <div className="text-sm text-slate-300 space-y-3">
                  <p><strong>Причина:</strong> Ollama не запущен или модель не скачана.</p>
                  <CmdBlock commands={[
                    '# Запусти Ollama:',
                    'ollama serve',
                    '',
                    '# Скачай модель:',
                    'ollama pull codellama:34b',
                    '',
                    '# Проверь что работает:',
                    'curl http://localhost:11434/api/tags',
                    '',
                    '# Запусти NexusAI с локальным профилем:',
                    'nexus --profile local',
                  ]} />
                </div>
              </Accordion>

              <Accordion title="❌ 'Permission denied' при записи файла">
                <div className="text-sm text-slate-300 space-y-3">
                  <p><strong>Причина:</strong> Песочница безопасности блокирует путь.</p>
                  <p><strong>Решение:</strong> Добавь папку в whitelist:</p>
                  <CmdBlock commands={[
                    '# Открой конфиг:',
                    'nexus config edit',
                    '',
                    '# Найди security.sandbox.allowed_paths и добавь:',
                    '#   - "/home/user/my-project"',
                    '',
                    '# Или (НЕ рекомендуется) отключи песочницу:',
                    '#   security.sandbox.enabled: false',
                  ]} />
                </div>
              </Accordion>

              <Accordion title="❌ Tree-sitter / RAG не работает">
                <div className="text-sm text-slate-300 space-y-3">
                  <p><strong>Причина:</strong> Не установлены опциональные зависимости для RAG.</p>
                  <CmdBlock commands={[
                    '# Установи RAG-компоненты:',
                    'pip install "nexus-core[rag]"',
                    '',
                    '# Перестрой индекс кода:',
                    'nexus rag rebuild',
                    '',
                    '# Проверь статус:',
                    'nexus rag status',
                  ]} />
                </div>
              </Accordion>

              <Accordion title="💡 Ничего не помогло?">
                <div className="text-sm text-slate-300 space-y-3">
                  <p>Попробуй полную диагностику:</p>
                  <CmdBlock commands={[
                    '# Подробная диагностика:',
                    'nexus doctor --verbose',
                    '',
                    '# Сброс конфига:',
                    'nexus init --force',
                    '',
                    '# Полная переустановка:',
                    'pip uninstall nexus-core -y',
                    'pip cache purge',
                    'pip install "nexus-core[full]"',
                  ]} />
                  <p className="mt-3">
                    Если проблема осталась — создай issue на GitHub:{' '}
                    <a href="#" className="text-blue-400 hover:underline inline-flex items-center gap-1">
                      github.com/nexusai/nexus-core/issues <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                </div>
              </Accordion>
            </div>

            {/* Полезные команды */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                Шпаргалка команд
              </h3>
              <CmdBlock
                title="Все команды NexusAI"
                commands={[
                  'nexus                    # Запустить агента',
                  'nexus -q "запрос"        # Один запрос без интерактива',
                  'nexus --profile fast     # Использовать быстрый профиль',
                  'nexus --model gpt-4o     # Выбрать конкретную модель',
                  'nexus --cwd ./проект     # Работать в указанной папке',
                  'nexus init               # Создать конфиг заново',
                  'nexus doctor             # Проверить установку',
                  'nexus skills list        # Список скиллов',
                  'nexus skills install X   # Установить набор скиллов',
                  'nexus config edit        # Редактировать конфиг',
                  'nexus config show        # Показать текущий конфиг',
                  'nexus session export     # Сохранить сессию в Markdown',
                  'nexus session resume     # Продолжить прошлую сессию',
                  'nexus cost               # Сколько денег потрачено',
                  'nexus update             # Обновить до последней версии',
                ]}
              />
            </div>
          </div>
        )}
      </main>

      {/* ─── Футер ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/50 py-8 mt-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-slate-500" />
              <span className="text-sm text-slate-500">NexusAI Core v1.0.0 • Инструкция на русском</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-slate-300 transition-colors inline-flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> Документация
              </a>
              <a href="#" className="hover:text-slate-300 transition-colors inline-flex items-center gap-1">
                <GitBranch className="w-3.5 h-3.5" /> GitHub
              </a>
              <a href="#" className="hover:text-slate-300 transition-colors inline-flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Discord
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
