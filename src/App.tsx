import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Copy,
  Check,
  GitBranch,
  Github,
  Rocket,
  Key,
  Play,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Globe,
  Package,
  Shield,
  Settings,
  Code2,
  Download,
  ExternalLink,
  ChevronDown,
  Info,
  AlertCircle,
  Zap,
  Server,
  Cloud,
  FileCode,
  Users,
  Star,
  GitPullRequest,
  GitCommit,
  GitMerge,
  FolderTree,
  Circle,
} from 'lucide-react';

// ─── Копируемый блок команд ─────────────────────────────────────────────────
interface CmdBlockProps {
  commands: string[];
  title?: string;
  comment?: string;
  output?: string[];
}

const CmdBlock: React.FC<CmdBlockProps> = ({ commands, title, comment, output }) => {
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
        {output && output.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800">
            {output.map((line, i) => (
              <div key={i} className="text-slate-500 text-xs">{line}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── GitHub UI Mock ─────────────────────────────────────────────────────────
const GitHubRepoMock: React.FC<{ username: string }> = ({ username }) => (
  <div className="rounded-xl border border-slate-700/50 bg-[#0d1117] overflow-hidden shadow-xl">
    {/* GitHub header */}
    <div className="flex items-center gap-3 px-4 py-3 bg-[#161b22] border-b border-slate-700/40">
      <Github className="w-5 h-5 text-white" />
      <span className="text-sm text-slate-300">
        <span className="text-blue-400 hover:underline cursor-pointer">{username}</span>
        <span className="text-slate-500"> / </span>
        <span className="text-blue-400 hover:underline cursor-pointer font-semibold">nexus-core</span>
      </span>
      <span className="ml-2 px-2 py-0.5 text-xs border border-slate-600 rounded-full text-slate-400">Public</span>
    </div>
    {/* Tabs */}
    <div className="flex gap-4 px-4 py-2 bg-[#161b22] border-b border-slate-700/40 text-sm">
      <span className="flex items-center gap-1.5 text-white border-b-2 border-orange-500 pb-2 -mb-2 px-1">
        <Code2 className="w-3.5 h-3.5" /> Code
      </span>
      <span className="flex items-center gap-1.5 text-slate-400 px-1">
        <GitPullRequest className="w-3.5 h-3.5" /> Pull requests
      </span>
      <span className="flex items-center gap-1.5 text-slate-400 px-1">
        <Circle className="w-3.5 h-3.5" /> Actions
      </span>
      <span className="flex items-center gap-1.5 text-slate-400 px-1">
        <Shield className="w-3.5 h-3.5" /> Security
      </span>
    </div>
    {/* Clone button */}
    <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-slate-700/40">
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-300 font-mono">main</span>
        <ChevronDown className="w-3 h-3 text-slate-500" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Clone</span>
        <div className="flex items-center gap-1 px-3 py-1.5 bg-[#21262d] border border-slate-600 rounded-md text-xs font-mono text-slate-300">
          https://github.com/{username}/nexus-core.git
        </div>
      </div>
    </div>
    {/* File list */}
    <div className="divide-y divide-slate-800">
      {[
        { icon: <FolderTree className="w-4 h-4" />, name: 'nexus_core', type: 'folder', desc: 'Core agent code' },
        { icon: <FolderTree className="w-4 h-4" />, name: 'skills', type: 'folder', desc: 'YAML skill definitions' },
        { icon: <FolderTree className="w-4 h-4" />, name: 'tests', type: 'folder', desc: 'Test suite' },
        { icon: <FileCode className="w-4 h-4" />, name: 'install.sh', type: 'file', desc: 'Installer script' },
        { icon: <FileCode className="w-4 h-4" />, name: 'pyproject.toml', type: 'file', desc: 'Package config' },
        { icon: <FileCode className="w-4 h-4" />, name: 'README.md', type: 'file', desc: 'Documentation' },
        { icon: <FileCode className="w-4 h-4" />, name: 'LICENSE', type: 'file', desc: 'MIT License' },
      ].map(f => (
        <div key={f.name} className="flex items-center gap-3 px-4 py-2 hover:bg-[#161b22]">
          <span className="text-slate-400">{f.icon}</span>
          <span className="text-sm text-blue-400 hover:underline cursor-pointer min-w-[140px]">{f.name}</span>
          <span className="text-xs text-slate-500 flex-1">{f.desc}</span>
        </div>
      ))}
    </div>
    {/* README preview */}
    <div className="border-t border-slate-700/40 p-4">
      <div className="flex items-center gap-2 mb-3">
        <FileCode className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-300 font-medium">README.md</span>
      </div>
      <div className="rounded-lg border border-slate-700/50 bg-[#161b22] p-4">
        <h1 className="text-xl font-bold text-white mb-2">NexusAI Core</h1>
        <p className="text-sm text-slate-300 mb-3">
          Terminal AI Agent — Model-agnostic, modular, secure
        </p>
        <div className="flex gap-2">
          <span className="px-2 py-0.5 text-xs bg-blue-900/30 text-blue-300 rounded">python 3.11+</span>
          <span className="px-2 py-0.5 text-xs bg-green-900/30 text-green-300 rounded">license: MIT</span>
          <span className="px-2 py-0.5 text-xs bg-orange-900/30 text-orange-300 rounded">status: beta</span>
        </div>
      </div>
    </div>
  </div>
);

// ─── Step Card ──────────────────────────────────────────────────────────────
interface StepProps {
  number: number;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
  done?: boolean;
}

const Step: React.FC<StepProps> = ({ number, title, subtitle, icon, color, children, done }) => {
  const colorMap: Record<string, { border: string; bg: string; text: string; iconBg: string; numBg: string }> = {
    emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-900/10', text: 'text-emerald-300', iconBg: 'bg-emerald-600/20 border-emerald-500/30', numBg: 'bg-emerald-600' },
    violet: { border: 'border-violet-500/30', bg: 'bg-violet-900/10', text: 'text-violet-300', iconBg: 'bg-violet-600/20 border-violet-500/30', numBg: 'bg-violet-600' },
    cyan: { border: 'border-cyan-500/30', bg: 'bg-cyan-900/10', text: 'text-cyan-300', iconBg: 'bg-cyan-600/20 border-cyan-500/30', numBg: 'bg-cyan-600' },
    amber: { border: 'border-amber-500/30', bg: 'bg-amber-900/10', text: 'text-amber-300', iconBg: 'bg-amber-600/20 border-amber-500/30', numBg: 'bg-amber-600' },
    rose: { border: 'border-rose-500/30', bg: 'bg-rose-900/10', text: 'text-rose-300', iconBg: 'bg-rose-600/20 border-rose-500/30', numBg: 'bg-rose-600' },
    blue: { border: 'border-blue-500/30', bg: 'bg-blue-900/10', text: 'text-blue-300', iconBg: 'bg-blue-600/20 border-blue-500/30', numBg: 'bg-blue-600' },
    pink: { border: 'border-pink-500/30', bg: 'bg-pink-900/10', text: 'text-pink-300', iconBg: 'bg-pink-600/20 border-pink-500/30', numBg: 'bg-pink-600' },
  };
  const c = colorMap[color] || colorMap.emerald;

  return (
    <div className={`relative rounded-xl border ${c.border} ${c.bg} p-6`}>
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl border ${c.iconBg}`}>
            {done ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : icon}
          </div>
          <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full ${c.numBg} flex items-center justify-center text-xs font-bold text-white shadow-lg`}>
            {number}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-xl font-bold mb-1 ${c.text}`}>{title}</h3>
          {subtitle && <p className="text-sm text-slate-400 mb-4">{subtitle}</p>}
          <div className="space-y-4">{children}</div>
        </div>
      </div>
    </div>
  );
};

// ─── Progress Tracker ───────────────────────────────────────────────────────
const ProgressTracker: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div className="flex items-center gap-2">
    {Array.from({ length: total }, (_, i) => (
      <React.Fragment key={i}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
          i < current
            ? 'bg-emerald-600 text-white'
            : i === current
            ? 'bg-violet-600 text-white ring-4 ring-violet-500/20'
            : 'bg-slate-700/50 text-slate-500'
        }`}>
          {i < current ? <Check className="w-4 h-4" /> : i + 1}
        </div>
        {i < total - 1 && (
          <div className={`flex-1 h-0.5 ${i < current ? 'bg-emerald-600' : 'bg-slate-700/50'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ─── Main App ───────────────────────────────────────────────────────────────
type Section = 'github' | 'push' | 'install' | 'keys' | 'run' | 'curl' | 'pypi' | 'next';

const App: React.FC = () => {
  const [section, setSection] = useState<Section>('github');
  const [username, setUsername] = useState('your-username');
  const [usernameInput, setUsernameInput] = useState('');

  const sections: { id: Section; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'github', label: '1. Репозиторий', icon: <Github className="w-4 h-4" />, color: 'violet' },
    { id: 'push', label: '2. Пуш кода', icon: <GitBranch className="w-4 h-4" />, color: 'cyan' },
    { id: 'install', label: '3. Установка', icon: <Download className="w-4 h-4" />, color: 'emerald' },
    { id: 'keys', label: '4. API ключи', icon: <Key className="w-4 h-4" />, color: 'amber' },
    { id: 'run', label: '5. Запуск', icon: <Play className="w-4 h-4" />, color: 'rose' },
    { id: 'curl', label: '6. curl-установка', icon: <Terminal className="w-4 h-4" />, color: 'blue' },
    { id: 'pypi', label: '7. PyPI', icon: <Package className="w-4 h-4" />, color: 'pink' },
    { id: 'next', label: '8. Что дальше', icon: <Rocket className="w-4 h-4" />, color: 'violet' },
  ];

  const currentIndex = sections.findIndex(s => s.id === section);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* ─── Шапка ──────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b border-slate-800/50">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 via-transparent to-emerald-600/5" />
        <div className="absolute inset-0">
          <div className="absolute top-10 right-1/4 w-72 h-72 bg-violet-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-emerald-500 shadow-lg shadow-violet-500/20">
              <Github className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Код на GitHub — что дальше?
              </h1>
              <p className="text-sm text-slate-400">Пошаговый гайд: от репозитория до работающего агента</p>
            </div>
          </div>

          {/* Username input */}
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 max-w-xl">
            <label className="text-sm text-slate-400">Твой GitHub username:</label>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-slate-500 font-mono text-sm">@</span>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                onBlur={() => usernameInput && setUsername(usernameInput)}
                placeholder="your-username"
                className="flex-1 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white font-mono text-sm focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 placeholder:text-slate-600"
              />
              <button
                onClick={() => usernameInput && setUsername(usernameInput)}
                className="px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
              >
                OK
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Замени <code className="bg-slate-800 px-1 rounded text-violet-300">{username}</code> в командах ниже на свой username
          </p>

          {/* Progress */}
          <div className="mt-6">
            <ProgressTracker current={currentIndex} total={sections.length} />
          </div>
        </div>
      </header>

      {/* ─── Навигация ──────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  section === s.id
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ─── Контент ────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="space-y-8">
          {/* ═══ 1. РЕПОЗИТОРИЙ ═══ */}
          {section === 'github' && (
            <>
              <Step
                number={1}
                title="Создай репозиторий на GitHub"
                subtitle="Это будет дом для твоего NexusAI — тут хранится код, install.sh, и все файлы"
                icon={<Github className="w-6 h-6 text-violet-400" />}
                color="violet"
              >
                <div className="rounded-lg border border-violet-500/20 bg-violet-900/10 p-4">
                  <p className="text-sm text-violet-200 flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Если ты ещё не создал репозиторий — сделай это прямо сейчас.
                      Если уже создал и запушил код — переходи к шагу 2.
                    </span>
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
                    <span className="text-violet-400">A.</span> На сайте GitHub
                  </h4>
                  <ol className="space-y-2 text-sm text-slate-300 ml-6 list-decimal">
                    <li>Зайди на <a href="https://github.com/new" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">github.com/new <ExternalLink className="w-3 h-3" /></a></li>
                    <li>Repository name: <code className="bg-slate-800 px-1.5 rounded text-violet-300">nexus-core</code></li>
                    <li>Description: <em>Terminal AI Agent</em></li>
                    <li>Выбери <strong>Public</strong> (чтобы install.sh работал)</li>
                    <li>✅ Add a README file</li>
                    <li>✅ Add .gitignore → выбери <strong>Python</strong></li>
                    <li>Choose a license → <strong>MIT</strong></li>
                    <li>Нажми <strong className="text-emerald-300">Create repository</strong></li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
                    <span className="text-violet-400">B.</span> Или через GitHub CLI
                  </h4>
                  <CmdBlock
                    title="Терминал"
                    commands={[
                        '# Установи GitHub CLI если ещё нет:',
                        '# macOS:',
                        'brew install gh',
                        '# Linux:',
                        'sudo apt install gh   # или dnf install gh',
                        '',
                        '# Залогинься:',
                        'gh auth login',
                        '',
                        '# Создай репозиторий:',
                        'gh repo create nexus-core --public --clone',
                        'cd nexus-core',
                    ]}
                  />
                </div>

                {/* GitHub UI mock */}
                <div>
                  <h4 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                    <span className="text-violet-400">C.</span> Так будет выглядеть репозиторий:
                  </h4>
                  <GitHubRepoMock username={username} />
                </div>
              </Step>

              <div className="flex justify-end">
                <button
                  onClick={() => setSection('push')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
                >
                  Дальше: Пуш кода <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* ═══ 2. ПУШ КОДА ═══ */}
          {section === 'push' && (
            <>
              <Step
                number={2}
                title="Запушь код в репозиторий"
                subtitle="Теперь нужно загрузить все файлы из предыдущих шагов в GitHub"
                icon={<GitBranch className="w-6 h-6 text-cyan-400" />}
                color="cyan"
              >
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-900/10 p-4">
                  <p className="text-sm text-cyan-200">
                    <strong>📁 Структура проекта должна быть такой:</strong>
                  </p>
                  <div className="mt-2 font-mono text-xs text-slate-400 bg-slate-900/50 rounded-lg p-3">
                    <div>nexus-core/</div>
                    <div className="ml-4">├── nexus_core/</div>
                    <div className="ml-8">├── __init__.py</div>
                    <div className="ml-8">├── main.py <span className="text-slate-600">← из шага Architecture</span></div>
                    <div className="ml-8">├── agent.py</div>
                    <div className="ml-8">├── model_router.py</div>
                    <div className="ml-8">├── skill_manager.py</div>
                    <div className="ml-8">├── context_manager.py</div>
                    <div className="ml-8">└── security.py</div>
                    <div className="ml-4">├── skills/</div>
                    <div className="ml-8">└── deployment.yaml</div>
                    <div className="ml-4">├── tests/</div>
                    <div className="ml-8">└── test_agent.py</div>
                    <div className="ml-4">├── install.sh <span className="text-emerald-500">← из public/install.sh</span></div>
                    <div className="ml-4">├── pyproject.toml <span className="text-emerald-500">← из public/pyproject.toml</span></div>
                    <div className="ml-4">└── README.md <span className="text-emerald-500">← из public/README.md</span></div>
                  </div>
                </div>

                <CmdBlock
                  title="Терминал — Пушим код"
                  comment="Если репозиторий уже создан на GitHub"
                  commands={[
                    '# Перейди в папку с кодом',
                    'cd nexus-core',
                    '',
                    '# Инициализируй git (если ещё не)',
                    'git init',
                    'git branch -M main',
                    '',
                    '# Добавь все файлы',
                    'git add .',
                    '',
                    '# Первый коммит',
                    'git commit -m "Initial commit: NexusAI core"',
                    '',
                    '# Подключи GitHub репозиторий',
                    `git remote add origin https://github.com/${username}/nexus-core.git`,
                    '',
                    '# Запушь!',
                    'git push -u origin main',
                  ]}
                  output={[
                    'Enumerating objects: 42, done.',
                    'Counting objects: 100% (42/42), done.',
                    'Writing objects: 100% (42/42), 128.5 KiB, done.',
                    `To https://github.com/${username}/nexus-core.git`,
                    ' * [new branch]      main -> main',
                    'Branch \'main\' set up to track remote branch \'main\' from \'origin\'.',
                  ]}
                />

                <div className="rounded-lg border border-emerald-500/20 bg-emerald-900/10 p-4">
                  <p className="text-sm text-emerald-200 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>Готово!</strong> Зайди на <code className="bg-slate-800 px-1 rounded">github.com/{username}/nexus-core</code> —
                      ты должен увидеть все свои файлы.
                    </span>
                  </p>
                </div>

                <div className="rounded-lg border border-amber-500/20 bg-amber-900/10 p-4">
                  <p className="text-sm text-amber-200">
                    <strong>💡 Совет:</strong> Не забудь добавить <code className="bg-slate-800 px-1 rounded">.env</code> в .gitignore!
                    Там будут твои API ключи — их нельзя публиковать.
                  </p>
                  <CmdBlock
                    title=".gitignore"
                    commands={[
                      '# Добавь в .gitignore:',
                      '.env',
                      '.venv/',
                      '__pycache__/',
                      '*.pyc',
                      '.nexus/',
                      'dist/',
                      '*.egg-info/',
                    ]}
                  />
                </div>
              </Step>

              <div className="flex justify-between">
                <button
                  onClick={() => setSection('github')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" /> Назад
                </button>
                <button
                  onClick={() => setSection('install')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors"
                >
                  Дальше: Установка <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* ═══ 3. УСТАНОВКА ═══ */}
          {section === 'install' && (
            <>
              <Step
                number={3}
                title="Установи NexusAI на свою машину"
                subtitle="Теперь когда код на GitHub — можно установить его как настоящий Python-пакет"
                icon={<Download className="w-6 h-6 text-emerald-400" />}
                color="emerald"
              >
                <CmdBlock
                  title="Терминал — Установка"
                  comment="Клонируем и устанавливаем"
                  commands={[
                    '# Клонируем репозиторий',
                    `git clone https://github.com/${username}/nexus-core.git`,
                    'cd nexus-core',
                    '',
                    '# Создаём виртуальное окружение',
                    'python3 -m venv .venv',
                    'source .venv/bin/activate',
                    '',
                    '# Устанавливаем пакет в режиме разработки',
                    'pip install -e ".[full]"',
                  ]}
                  output={[
                    'Obtaining file:///Users/you/nexus-core',
                    'Installing build dependencies ... done',
                    'Successfully installed litellm-1.24.0 nexus-core-1.0.0 ...',
                  ]}
                />

                <div className="rounded-lg border border-emerald-500/20 bg-emerald-900/10 p-4">
                  <p className="text-sm text-emerald-200">
                    <strong>🎉 Что произошло:</strong>
                  </p>
                  <ul className="mt-2 text-sm text-slate-300 space-y-1 ml-4">
                    <li>✓ Создано виртуальное окружение <code className="bg-slate-800 px-1 rounded">.venv</code></li>
                    <li>✓ Установлены все зависимости (litellm, pyyaml, rich, textual...)</li>
                    <li>✓ Команда <code className="bg-slate-800 px-1 rounded text-emerald-300">nexus</code> теперь доступна глобально</li>
                  </ul>
                </div>

                <CmdBlock
                  title="Терминал — Проверка"
                  commands={[
                    '# Проверь что всё работает:',
                    'nexus --version',
                    '# → NexusAI Core v1.0.0',
                    '',
                    'nexus doctor',
                    '# → ✓ Python 3.12.1',
                    '# → ✓ LiteLLM 1.24.0',
                    '# → ✓ Все проверки пройдены ✓',
                  ]}
                />
              </Step>

              <div className="flex justify-between">
                <button
                  onClick={() => setSection('push')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" /> Назад
                </button>
                <button
                  onClick={() => setSection('keys')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
                >
                  Дальше: API ключи <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* ═══ 4. API КЛЮЧИ ═══ */}
          {section === 'keys' && (
            <>
              <Step
                number={4}
                title="Добавь API ключи"
                subtitle="Без ключей агент не сможет общаться с AI-моделями. Нужен хотя бы один."
                icon={<Key className="w-6 h-6 text-amber-400" />}
                color="amber"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <a
                    href="https://console.anthropic.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-violet-500/20 bg-violet-900/10 p-4 hover:border-violet-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-violet-200">Anthropic</span>
                      <span className="px-2 py-0.5 text-xs bg-violet-600 text-white rounded-full">Рекомендуем</span>
                    </div>
                    <p className="text-xs text-slate-400">Claude Sonnet 4</p>
                    <p className="text-xs text-slate-500 mt-1">console.anthropic.com</p>
                  </a>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-emerald-500/20 bg-emerald-900/10 p-4 hover:border-emerald-500/40 transition-colors"
                  >
                    <span className="font-semibold text-emerald-200">OpenAI</span>
                    <p className="text-xs text-slate-400 mt-1">GPT-4o</p>
                    <p className="text-xs text-slate-500 mt-1">platform.openai.com</p>
                  </a>
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-cyan-500/20 bg-cyan-900/10 p-4 hover:border-cyan-500/40 transition-colors"
                  >
                    <span className="font-semibold text-cyan-200">OpenRouter</span>
                    <p className="text-xs text-slate-400 mt-1">Любая модель</p>
                    <p className="text-xs text-slate-500 mt-1">openrouter.ai</p>
                  </a>
                </div>

                <CmdBlock
                  title="Терминал — Создаём .env файл"
                  comment="Создай файл ~/.nexus/.env и добавь ключи"
                  commands={[
                    '# Создай папку если её нет',
                    'mkdir -p ~/.nexus',
                    '',
                    '# Создай .env файл',
                    'nano ~/.nexus/.env',
                  ]}
                />

                <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 font-mono text-sm">
                  <div className="text-slate-500 mb-2"># ~/.nexus/.env — содержимое файла:</div>
                  <div className="text-slate-300">ANTHROPIC_API_KEY=<span className="text-amber-300">sk-ant-твой_ключ_сюда</span></div>
                  <div className="text-slate-300">OPENAI_API_KEY=<span className="text-amber-300">sk-твой_ключ_сюда</span></div>
                </div>

                <div className="rounded-lg border border-rose-500/20 bg-rose-900/10 p-3">
                  <p className="text-xs text-rose-200">
                    <strong>⚠️ Важно:</strong> Никогда не публикуй .env файл! Он должен быть в .gitignore.
                  </p>
                </div>
              </Step>

              <div className="flex justify-between">
                <button
                  onClick={() => setSection('install')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" /> Назад
                </button>
                <button
                  onClick={() => setSection('run')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors"
                >
                  Дальше: Запуск <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* ═══ 5. ЗАПУСК ═══ */}
          {section === 'run' && (
            <>
              <Step
                number={5}
                title="Первый запуск!"
                subtitle="Всё готово — запускаем агента и пробуем"
                icon={<Play className="w-6 h-6 text-rose-400" />}
                color="rose"
              >
                <CmdBlock
                  title="Терминал"
                  comment="Перейди в любой проект и запусти агента"
                  commands={[
                    'cd ~/my-project',
                    'nexus',
                  ]}
                />

                <div className="rounded-xl border border-slate-700/50 bg-[#0d1117] overflow-hidden shadow-2xl">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 border-b border-slate-700/40">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-xs text-slate-500 font-mono ml-2">nexus — первый запуск</span>
                  </div>
                  <div className="p-5 font-mono text-sm space-y-2">
                    <div className="text-emerald-400">🚀 NexusAI v1.0.0</div>
                    <div className="text-slate-500">   Model: claude-sonnet-4-20250514</div>
                    <div className="text-slate-500">   Tools: 8 available</div>
                    <div className="text-slate-500">   Cost:  $0.0000</div>
                    <div className="text-slate-500 mt-3">Type your request (or 'quit' to exit):</div>
                    <div className="flex gap-2 mt-3">
                      <span className="text-cyan-400">ты ›</span>
                      <span className="text-white">Привет! Расскажи что ты умеешь</span>
                    </div>
                    <div className="text-violet-400 mt-2">🧠 Анализирую запрос...</div>
                    <div className="text-slate-300 mt-1">
                      Привет! Я NexusAI — твой AI-помощник в терминале. Вот что я умею:
                    </div>
                    <div className="text-slate-400 ml-2 mt-1">
                      <div>• Читать и писать файлы в проекте</div>
                      <div>• Выполнять команды (с твоего разрешения)</div>
                      <div>• Искать по коду и в интернете</div>
                      <div>• Анализировать и рефакторить код</div>
                      <div>• Запускать тесты и проверять результат</div>
                    </div>
                    <div className="text-slate-300 mt-2">
                      Просто опиши задачу — я разберусь! 🎯
                    </div>
                    <div className="flex gap-2 mt-3">
                      <span className="text-cyan-400">ты ›</span>
                      <span className="text-white animate-pulse">▊</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-500/20 bg-emerald-900/10 p-4">
                  <p className="text-sm text-emerald-200 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>🎉 Поздравляю!</strong> Если ты видишь такое — всё работает!
                      NexusAI установлен и готов к использованию.
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-700/50 bg-slate-800/20 p-4">
                    <h4 className="font-semibold text-slate-200 mb-2">Попробуй:</h4>
                    <ul className="text-sm text-slate-400 space-y-1 font-mono">
                      <li>• "Покажи структуру проекта"</li>
                      <li>• "Найди все TODO в коде"</li>
                      <li>• "Добавь тесты для utils.py"</li>
                      <li>• "Объясни что делает main.py"</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-slate-700/50 bg-slate-800/20 p-4">
                    <h4 className="font-semibold text-slate-200 mb-2">Горячие клавиши:</h4>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Палитра команд</span>
                        <kbd className="px-2 py-0.5 text-xs bg-slate-700/50 rounded text-slate-300">Ctrl+K</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Сменить модель</span>
                        <kbd className="px-2 py-0.5 text-xs bg-slate-700/50 rounded text-slate-300">Ctrl+M</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Выйти</span>
                        <kbd className="px-2 py-0.5 text-xs bg-slate-700/50 rounded text-slate-300">Ctrl+D</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </Step>

              <div className="flex justify-between">
                <button
                  onClick={() => setSection('keys')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" /> Назад
                </button>
                <button
                  onClick={() => setSection('curl')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors"
                >
                  Бонус: curl-установка <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* ═══ 6. CURL-УСТАНОВКА ═══ */}
          {section === 'curl' && (
            <>
              <Step
                number={6}
                title="Сделай curl-установку рабочей"
                subtitle="Чтобы друзья могли установить одной командой: curl ... | bash"
                icon={<Terminal className="w-6 h-6 text-blue-400" />}
                color="blue"
              >
                <div className="rounded-lg border border-blue-500/20 bg-blue-900/10 p-4">
                  <p className="text-sm text-blue-200">
                    <strong>💡 Идея:</strong> Чтобы работала команда <code className="bg-slate-800 px-1 rounded">curl ... | bash</code>,
                    нужен публичный URL к файлу <code className="bg-slate-800 px-1 rounded">install.sh</code>.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-200 mb-2">Вариант A: Raw URL с GitHub (самый простой)</h4>
                  <p className="text-sm text-slate-400 mb-3">
                    GitHub автоматически даёт raw-ссылку на любой файл:
                  </p>
                  <CmdBlock
                    title="Терминал — Установка через GitHub raw"
                    comment="Эта команда работает сразу после пуша install.sh"
                    commands={[
                      `curl -fsSL https://raw.githubusercontent.com/${username}/nexus-core/main/install.sh | bash`,
                    ]}
                  />
                  <div className="mt-3 text-sm text-slate-400">
                    <p>Где взять эту ссылку:</p>
                    <ol className="ml-4 mt-1 space-y-1 list-decimal text-slate-500">
                      <li>Зайди в свой репозиторий на GitHub</li>
                      <li>Открой файл <code className="bg-slate-800 px-1 rounded">install.sh</code></li>
                      <li>Нажми кнопку <strong>Raw</strong> (справа вверху)</li>
                      <li>Скопируй URL из адресной строки</li>
                    </ol>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-200 mb-2">Вариант B: Свой домен (красиво)</h4>
                  <p className="text-sm text-slate-400 mb-3">
                    Если хочешь короткую ссылку типа <code className="bg-slate-800 px-1 rounded">nexusai.dev/install.sh</code>:
                  </p>
                  <CmdBlock
                    title="Терминал — Настройка домена"
                    comment="Вариант 1: GitHub Pages"
                    commands={[
                        '# В репозитории создай папку docs/ или .github/pages/',
                        '# Положи туда install.sh',
                        '# В Settings → Pages → включи GitHub Pages',
                        '# Получишь URL: https://username.github.io/nexus-core/install.sh',
                        '',
                        '# Вариант 2: Cloudflare Redirect',
                        '# Купи домен (например nexusai.dev за ~$30/год)',
                        '# Настрой CNAME на raw.githubusercontent.com',
                        '# Или используй Cloudflare Workers для редиректа',
                    ]}
                  />
                </div>

                <div>
                  <h4 className="font-semibold text-slate-200 mb-2">Вариант C: Gist (быстрый тест)</h4>
                  <CmdBlock
                    title="Терминал"
                    commands={[
                        '# Создай gist на gist.github.com с install.sh',
                        '# Получишь ссылку типа:',
                        '# https://gist.githubusercontent.com/username/hash/raw/install.sh',
                        '',
                        '# Проверь что работает:',
                        `curl -fsSL https://gist.githubusercontent.com/${username}/.../raw/install.sh | bash`,
                    ]}
                  />
                </div>
              </Step>

              <div className="flex justify-between">
                <button
                  onClick={() => setSection('run')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" /> Назад
                </button>
                <button
                  onClick={() => setSection('pypi')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                >
                  Бонус: PyPI <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* ═══ 7. PYPI ═══ */}
          {section === 'pypi' && (
            <>
              <Step
                number={7}
                title="Опубликуй на PyPI (опционально)"
                subtitle="Чтобы можно было установить через pip install nexus-core"
                icon={<Package className="w-6 h-6 text-pink-400" />}
                color="pink"
              >
                <div className="rounded-lg border border-pink-500/20 bg-pink-900/10 p-4">
                  <p className="text-sm text-pink-200">
                    <strong>💡 Зачем:</strong> После публикации на PyPI, любой сможет установить одной командой:
                    <code className="bg-slate-800 px-1.5 rounded mx-1">pip install nexus-core</code>
                  </p>
                </div>

                <CmdBlock
                  title="Терминал — Публикация на PyPI"
                  comment="Шаг 1: Установи инструменты сборки"
                  commands={[
                    'pip install build twine',
                  ]}
                />

                <CmdBlock
                  title="Терминал"
                  comment="Шаг 2: Собери пакет"
                  commands={[
                    'python -m build',
                  ]}
                  output={[
                    'Successfully built nexus-core-1.0.0.tar.gz',
                    'Successfully built nexus_core-1.0.0-py3-none-any.whl',
                  ]}
                />

                <CmdBlock
                  title="Терминал"
                  comment="Шаг 3: Загрузи на PyPI (нужна регистрация на pypi.org)"
                  commands={[
                    '# Зарегистрируйся на https://pypi.org/account/register/',
                    '# Создай API token в настройках аккаунта',
                    '',
                    '# Загрузи пакет:',
                    'twine upload dist/*',
                    '',
                    '# Введи:',
                    '#   username: __token__',
                    '#   password: pypi-xxxxxxxxxxxxx  (твой токен)',
                  ]}
                />

                <CmdBlock
                  title="Терминал"
                  comment="Шаг 4: Проверь что работает"
                  commands={[
                    '# В новом окружении:',
                    'pip install nexus-core',
                    'nexus --version',
                    '# → NexusAI Core v1.0.0',
                  ]}
                />

                <div className="rounded-lg border border-amber-500/20 bg-amber-900/10 p-4">
                  <p className="text-sm text-amber-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>Важно:</strong> Имя пакета на PyPI должно быть уникальным.
                      Если <code className="bg-slate-800 px-1 rounded">nexus-core</code> занято — выбери другое,
                      например <code className="bg-slate-800 px-1 rounded">nexusai-core</code> или <code className="bg-slate-800 px-1 rounded">nexus-agent</code>.
                    </span>
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-200 mb-2">Автоматическая публикация через GitHub Actions</h4>
                  <CmdBlock
                    title=".github/workflows/publish.yml"
                    comment="Создай этот файл — пакет будет публиковаться автоматически при создании release"
                    commands={[
                        'name: Publish to PyPI',
                        '',
                        'on:',
                        '  release:',
                        '    types: [published]',
                        '',
                        'jobs:',
                        '  deploy:',
                        '    runs-on: ubuntu-latest',
                        '    steps:',
                        '      - uses: actions/checkout@v4',
                        '      - uses: actions/setup-python@v5',
                        '        with:',
                        '          python-version: "3.12"',
                        '      - name: Install build tools',
                        '        run: pip install build twine',
                        '      - name: Build package',
                        '        run: python -m build',
                        '      - name: Publish to PyPI',
                        '        env:',
                        '          TWINE_USERNAME: __token__',
                        '          TWINE_PASSWORD: ${{ secrets.PYPI_TOKEN }}',
                        '        run: twine upload dist/*',
                    ]}
                  />
                </div>
              </Step>

              <div className="flex justify-between">
                <button
                  onClick={() => setSection('curl')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" /> Назад
                </button>
                <button
                  onClick={() => setSection('next')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-medium transition-colors"
                >
                  Что дальше? <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* ═══ 8. ЧТО ДАЛЬШЕ ═══ */}
          {section === 'next' && (
            <>
              <Step
                number={8}
                title="Что дальше? Развитие проекта"
                subtitle="Идеи как сделать NexusAI ещё круче"
                icon={<Rocket className="w-6 h-6 text-violet-400" />}
                color="violet"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-cyan-500/20 bg-cyan-900/10 p-4">
                    <div className="text-cyan-400 mb-2"><Users className="w-5 h-5" /></div>
                    <h4 className="font-semibold text-cyan-200 mb-1">Добавь TUI-интерфейс</h4>
                    <p className="text-xs text-slate-400">Реализуй красивый терминальный UI на Textual с markdown-рендерингом, diff-превью и стримингом</p>
                  </div>
                  <div className="rounded-lg border border-violet-500/20 bg-violet-900/10 p-4">
                    <div className="text-violet-400 mb-2"><Server className="w-5 h-5" /></div>
                    <h4 className="font-semibold text-violet-200 mb-1">Локальный RAG</h4>
                    <p className="text-xs text-slate-400">Добавь tree-sitter индексацию и ChromaDB для семантического поиска по кодовой базе</p>
                  </div>
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-900/10 p-4">
                    <div className="text-emerald-400 mb-2"><GitPullRequest className="w-5 h-5" /></div>
                    <h4 className="font-semibold text-emerald-200 mb-1">GitHub интеграция</h4>
                    <p className="text-xs text-slate-400">Автоматическое создание PR, чтение issues, review кода прямо из агента</p>
                  </div>
                  <div className="rounded-lg border border-amber-500/20 bg-amber-900/10 p-4">
                    <div className="text-amber-400 mb-2"><Cloud className="w-5 h-5" /></div>
                    <h4 className="font-semibold text-amber-200 mb-1">Skill Marketplace</h4>
                    <p className="text-xs text-slate-400">Сделай репозиторий готовых скиллов, которые можно устанавливать одной командой</p>
                  </div>
                  <div className="rounded-lg border border-rose-500/20 bg-rose-900/10 p-4">
                    <div className="text-rose-400 mb-2"><Zap className="w-5 h-5" /></div>
                    <h4 className="font-semibold text-rose-200 mb-1">Multi-Agent режим</h4>
                    <p className="text-xs text-slate-400">Запуск нескольких агентов параллельно с разными ролями (Architect, Coder, Reviewer)</p>
                  </div>
                  <div className="rounded-lg border border-blue-500/20 bg-blue-900/10 p-4">
                    <div className="text-blue-400 mb-2"><Star className="w-5 h-5" /></div>
                    <h4 className="font-semibold text-blue-200 mb-1">Community</h4>
                    <p className="text-xs text-slate-400">Discord-сервер, документация на ReadTheDocs, туториалы на YouTube</p>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-500/30 bg-emerald-900/10 p-6 mt-6">
                  <h3 className="text-lg font-bold text-emerald-200 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Итого: что ты получил
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span>Полноценное ядро AI-агента на Python (model_router, skill_manager, agent loop)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span>Рабочий install.sh скрипт для автоматической установки</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span>pyproject.toml для публикации на PyPI</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span>README.md с полной документацией</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span>GitHub-репозиторий с CI/CD для авто-публикации</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span>Понимание как развивать проект дальше</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-6 mt-6">
                  <h3 className="text-lg font-bold text-slate-200 mb-3">📚 Полезные ссылки</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <a href="https://docs.litellm.ai" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:underline">
                      <ExternalLink className="w-3 h-3" /> LiteLLM документация
                    </a>
                    <a href="https://textual.textualize.io" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:underline">
                      <ExternalLink className="w-3 h-3" /> Textual (TUI framework)
                    </a>
                    <a href="https://tree-sitter.github.io" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:underline">
                      <ExternalLink className="w-3 h-3" /> Tree-sitter
                    </a>
                    <a href="https://docs.trychroma.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:underline">
                      <ExternalLink className="w-3 h-3" /> ChromaDB
                    </a>
                    <a href="https://packaging.python.org" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:underline">
                      <ExternalLink className="w-3 h-3" /> Python Packaging Guide
                    </a>
                    <a href="https://docs.github.com/en/actions" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:underline">
                      <ExternalLink className="w-3 h-3" /> GitHub Actions
                    </a>
                  </div>
                </div>
              </Step>

              <div className="flex justify-between">
                <button
                  onClick={() => setSection('pypi')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" /> Назад
                </button>
                <a
                  href="https://github.com/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-emerald-600 hover:from-violet-500 hover:to-emerald-500 text-white font-medium transition-colors shadow-lg"
                >
                  <Github className="w-4 h-4" /> Создать репозиторий <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ─── Футер ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/50 py-8 mt-10">
        <div className="max-w-5xl mx-auto px-6 text-center text-sm text-slate-500">
          <p>NexusAI Core — от прототипа до production</p>
          <p className="mt-1 text-xs">Шаг за шагом: GitHub → Push → Install → Keys → Run → 🚀</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
