import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Copy,
  Check,
  ChevronRight,
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
  FolderOpen,
  Key,
  Rocket,
  BookOpen,
  ExternalLink,
  ChevronDown,
  Info,
} from 'lucide-react';

// ─── Terminal Line Component ────────────────────────────────────────────────
interface TermLineProps {
  prompt?: boolean;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

const TermLine: React.FC<TermLineProps> = ({ prompt, children, className = '' }) => (
  <div className={`flex gap-2 ${className}`}>
    {prompt && <span className="text-emerald-400 select-none shrink-0">❯</span>}
    <span className={prompt ? 'text-white' : 'text-slate-400'}>{children}</span>
  </div>
);

// ─── Copyable Command Block ─────────────────────────────────────────────────
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
            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-white bg-slate-700/40 hover:bg-slate-600/40 rounded transition-all"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
      <div className="p-4 font-mono text-sm leading-relaxed overflow-x-auto">
        {comment && <div className="text-slate-600 mb-2"># {comment}</div>}
        {commands.map((cmd, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-emerald-400 select-none">$</span>
            <span className="text-slate-200">{cmd}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Step Card ──────────────────────────────────────────────────────────────
interface StepCardProps {
  number: number;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  status?: 'done' | 'current' | 'pending';
}

const StepCard: React.FC<StepCardProps> = ({ number, title, icon, children, status = 'pending' }) => (
  <div className={`relative rounded-xl border p-6 transition-all ${
    status === 'current'
      ? 'border-violet-500/40 bg-violet-900/10 shadow-lg shadow-violet-500/5'
      : status === 'done'
      ? 'border-emerald-500/30 bg-emerald-900/5'
      : 'border-slate-700/50 bg-slate-800/20'
  }`}>
    <div className="flex items-start gap-4">
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${
        status === 'current'
          ? 'bg-violet-600/20 border border-violet-500/30'
          : status === 'done'
          ? 'bg-emerald-600/20 border border-emerald-500/30'
          : 'bg-slate-700/30 border border-slate-600/30'
      }`}>
        {status === 'done' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-mono ${
            status === 'current' ? 'text-violet-400' : status === 'done' ? 'text-emerald-400' : 'text-slate-500'
          }`}>
            Step {number}
          </span>
        </div>
        <h3 className={`text-lg font-semibold mb-3 ${
          status === 'current' ? 'text-violet-200' : status === 'done' ? 'text-emerald-200' : 'text-slate-200'
        }`}>
          {title}
        </h3>
        {children}
      </div>
    </div>
  </div>
);

// ─── Accordion ──────────────────────────────────────────────────────────────
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
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
};

// ─── Typing Animation ───────────────────────────────────────────────────────
const TypeWriter: React.FC<{ text: string; speed?: number; className?: string }> = ({ text, speed = 40, className = '' }) => {
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
    <span className={className}>
      {displayed}
      {!done && <span className="animate-pulse text-emerald-400">▊</span>}
    </span>
  );
};

// ─── Main App ───────────────────────────────────────────────────────────────
type InstallMethod = 'quick' | 'pip' | 'source' | 'docker';

const App: React.FC = () => {
  const [method, setMethod] = useState<InstallMethod>('quick');
  const [currentStep, setCurrentStep] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<'install' | 'config' | 'usage' | 'troubleshoot'>('install');
  const termRef = useRef<HTMLDivElement>(null);

  const methods: { id: InstallMethod; label: string; icon: React.ReactNode; time: string }[] = [
    { id: 'quick', label: 'Quick Install', icon: <Zap className="w-4 h-4" />, time: '~30 sec' },
    { id: 'pip', label: 'pip install', icon: <Package className="w-4 h-4" />, time: '~2 min' },
    { id: 'source', label: 'From Source', icon: <GitBranch className="w-4 h-4" />, time: '~5 min' },
    { id: 'docker', label: 'Docker', icon: <Download className="w-4 h-4" />, time: '~3 min' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
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
                NexusAI — Installation Guide
              </h1>
              <p className="text-sm text-slate-400">Terminal AI Agent • Setup in minutes</p>
            </div>
          </div>

          {/* Animated terminal preview */}
          <div className="mt-6 rounded-xl border border-slate-700/50 bg-[#0d1117] overflow-hidden shadow-2xl max-w-2xl">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 border-b border-slate-700/40">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs text-slate-500 font-mono ml-2">nexus — install</span>
            </div>
            <div ref={termRef} className="p-5 font-mono text-sm space-y-1.5 min-h-[140px]">
              <TermLine prompt>
                <TypeWriter text="curl -fsSL https://nexusai.dev/install.sh | bash" speed={35} />
              </TermLine>
              <div className="text-slate-500 text-xs mt-3 space-y-1">
                <div>✓ Checking system requirements...</div>
                <div>✓ Python 3.11+ detected</div>
                <div>✓ Installing nexus-core...</div>
                <div>✓ Setting up skills directory...</div>
                <div className="text-emerald-400">✓ NexusAI installed successfully! Run <span className="text-white font-semibold">nexus</span> to start.</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Nav Tabs ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-1 py-3">
            {[
              { id: 'install' as const, label: 'Install', icon: <Download className="w-4 h-4" /> },
              { id: 'config' as const, label: 'Configure', icon: <Settings className="w-4 h-4" /> },
              { id: 'usage' as const, label: 'Usage', icon: <Play className="w-4 h-4" /> },
              { id: 'troubleshoot' as const, label: 'Troubleshoot', icon: <AlertCircle className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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

      {/* ─── Content ───────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {activeTab === 'install' && (
          <div className="space-y-8">
            {/* System Requirements */}
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-amber-400" />
                System Requirements
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Python', value: '3.11+', ok: true },
                  { label: 'OS', value: 'Linux / macOS', ok: true },
                  { label: 'RAM', value: '4 GB min', ok: true },
                  { label: 'Disk', value: '~500 MB', ok: true },
                ].map(req => (
                  <div key={req.label} className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs text-slate-500">{req.label}</div>
                      <div className="text-sm font-medium text-slate-200">{req.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Install Method Selector */}
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-400" />
                Choose Install Method
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {methods.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      method === m.id
                        ? 'border-emerald-500/40 bg-emerald-900/15 shadow-lg shadow-emerald-500/5'
                        : 'border-slate-700/50 bg-slate-800/20 hover:border-slate-600/50'
                    }`}
                  >
                    <span className={method === m.id ? 'text-emerald-400' : 'text-slate-400'}>
                      {m.icon}
                    </span>
                    <span className={`text-sm font-medium ${method === m.id ? 'text-emerald-300' : 'text-slate-300'}`}>
                      {m.label}
                    </span>
                    <span className="text-xs text-slate-500">{m.time}</span>
                  </button>
                ))}
              </div>

              {/* Install Commands */}
              <div className="space-y-4">
                {method === 'quick' && (
                  <>
                    <CmdBlock
                      title="Terminal — Quick Install"
                      comment="One-liner: downloads, installs, and configures NexusAI"
                      commands={[
                        'curl -fsSL https://nexusai.dev/install.sh | bash',
                      ]}
                    />
                    <div className="rounded-lg border border-blue-500/20 bg-blue-900/10 p-4 flex gap-3">
                      <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      <div className="text-sm text-slate-300">
                        <p>Скрипт автоматически:</p>
                        <ul className="mt-1 space-y-1 text-slate-400">
                          <li>• Проверит Python 3.11+ и pip</li>
                          <li>• Установит <code className="text-blue-300 bg-slate-800 px-1 rounded">nexus-core</code> через pip</li>
                          <li>• Создаст <code className="text-blue-300 bg-slate-800 px-1 rounded">~/.nexus/</code> с дефолтным конфигом</li>
                          <li>• Добавит <code className="text-blue-300 bg-slate-800 px-1 rounded">nexus</code> в PATH</li>
                        </ul>
                      </div>
                    </div>
                  </>
                )}

                {method === 'pip' && (
                  <>
                    <CmdBlock
                      title="Terminal — pip install"
                      comment="Install from PyPI"
                      commands={[
                        '# Create virtual environment (recommended)',
                        'python3 -m venv ~/.nexus/venv',
                        'source ~/.nexus/venv/bin/activate',
                        '',
                        '# Install NexusAI',
                        'pip install nexus-core',
                        '',
                        '# Or with all extras (RAG, tree-sitter, all providers)',
                        'pip install "nexus-core[full]"',
                        '',
                        '# Initialize config',
                        'nexus init',
                      ]}
                    />
                    <div className="rounded-lg border border-amber-500/20 bg-amber-900/10 p-4 flex gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-sm text-slate-300">
                        <p className="text-amber-300 font-medium mb-1">Extras packages:</p>
                        <ul className="text-slate-400 space-y-0.5">
                          <li><code className="text-amber-200 bg-slate-800 px-1 rounded">nexus-core[rag]</code> — tree-sitter + ChromaDB</li>
                          <li><code className="text-amber-200 bg-slate-800 px-1 rounded">nexus-core[tui]</code> — Textual + Rich</li>
                          <li><code className="text-amber-200 bg-slate-800 px-1 rounded">nexus-core[all-providers]</code> — all LLM SDKs</li>
                          <li><code className="text-amber-200 bg-slate-800 px-1 rounded">nexus-core[full]</code> — everything</li>
                        </ul>
                      </div>
                    </div>
                  </>
                )}

                {method === 'source' && (
                  <>
                    <CmdBlock
                      title="Terminal — From Source"
                      comment="Clone repo and install in development mode"
                      commands={[
                        '# Clone repository',
                        'git clone https://github.com/nexusai/nexus-core.git',
                        'cd nexus-core',
                        '',
                        '# Create & activate venv',
                        'python3 -m venv .venv',
                        'source .venv/bin/activate',
                        '',
                        '# Install in editable mode with all extras',
                        'pip install -e ".[full]"',
                        '',
                        '# Run tests',
                        'pytest tests/ -v',
                        '',
                        '# Initialize',
                        'nexus init',
                      ]}
                    />
                  </>
                )}

                {method === 'docker' && (
                  <>
                    <CmdBlock
                      title="Terminal — Docker"
                      comment="Run in isolated container"
                      commands={[
                        '# Pull image',
                        'docker pull nexusai/nexus:latest',
                        '',
                        '# Run with your project mounted',
                        'docker run -it \\',
                        '  -v $(pwd):/workspace \\',
                        '  -v ~/.nexus:/root/.nexus \\',
                        '  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \\',
                        '  -e OPENAI_API_KEY=$OPENAI_API_KEY \\',
                        '  nexusai/nexus:latest',
                        '',
                        '# Or use docker-compose',
                        'curl -O https://nexusai.dev/docker-compose.yml',
                        'docker compose up -d',
                      ]}
                    />
                  </>
                )}
              </div>
            </section>

            {/* Verify Installation */}
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Verify Installation
              </h2>
              <CmdBlock
                title="Terminal"
                commands={[
                  'nexus --version',
                  '# → NexusAI Core v1.0.0',
                  '',
                  'nexus doctor',
                  '# → ✓ Python 3.12.1',
                  '# → ✓ LiteLLM 1.24.0',
                  '# → ✓ Tree-sitter OK',
                  '# → ✓ ChromaDB OK',
                  '# → ✓ Config: ~/.nexus/config.yaml',
                  '# → ✓ 8 skills loaded',
                  '# → All checks passed ✓',
                ]}
              />
            </section>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Settings className="w-5 h-5 text-violet-400" />
              Configuration
            </h2>

            {/* Step 1: API Keys */}
            <StepCard number={1} title="Set API Keys" icon={<Key className="w-5 h-5 text-amber-400" />} status="current">
              <p className="text-sm text-slate-400 mb-4">
                Добавьте ключи API в <code className="text-violet-300 bg-slate-800 px-1.5 rounded">~/.nexus/.env</code> или экспортируйте в shell:
              </p>
              <CmdBlock
                title="~/.nexus/.env"
                commands={[
                  '# Required — at least one provider',
                  'ANTHROPIC_API_KEY=sk-ant-...',
                  'OPENAI_API_KEY=sk-...',
                  '',
                  '# Optional',
                  'OPENROUTER_API_KEY=sk-or-...',
                  '',
                  '# Local models (no key needed)',
                  '# Just run Ollama: ollama serve',
                ]}
              />
              <div className="mt-3 text-xs text-slate-500">
                💡 Ключи из .env подхватываются автоматически. Также можно использовать переменные окружения.
              </div>
            </StepCard>

            {/* Step 2: Choose Model */}
            <StepCard number={2} title="Choose Default Model" icon={<Globe className="w-5 h-5 text-cyan-400" />} status="pending">
              <p className="text-sm text-slate-400 mb-4">
                Отредактируйте <code className="text-violet-300 bg-slate-800 px-1.5 rounded">~/.nexus/config.yaml</code>:
              </p>
              <CmdBlock
                title="~/.nexus/config.yaml"
                commands={[
                  'profiles:',
                  '  default:',
                  '    model: "claude-sonnet-4-20250514"',
                  '    provider: "anthropic"',
                  '    max_tokens: 8192',
                  '    temperature: 0.3',
                  '',
                  '  fast:',
                  '    model: "gpt-4o-mini"',
                  '    provider: "openai"',
                  '',
                  '  local:',
                  '    model: "codellama:34b"',
                  '    provider: "ollama"',
                  '    base_url: "http://localhost:11434"',
                ]}
              />
              <p className="mt-3 text-sm text-slate-400">
                Переключайте на лету: <code className="text-emerald-300 bg-slate-800 px-1.5 rounded">nexus --profile fast</code>
              </p>
            </StepCard>

            {/* Step 3: Skills */}
            <StepCard number={3} title="Install Skills (Optional)" icon={<Package className="w-5 h-5 text-emerald-400" />} status="pending">
              <p className="text-sm text-slate-400 mb-4">
                Установите дополнительные скиллы из репозитория или создайте свои:
              </p>
              <CmdBlock
                title="Terminal"
                commands={[
                  '# Install community skill pack',
                  'nexus skills install nexusai/skill-pack-devops',
                  'nexus skills install nexusai/skill-pack-testing',
                  '',
                  '# List installed skills',
                  'nexus skills list',
                  '',
                  '# Create custom skill',
                  'nexus skills new my-skill',
                  '# → Creates ~/.nexus/skills/my-skill.yaml',
                ]}
              />
            </StepCard>

            {/* Step 4: Security */}
            <StepCard number={4} title="Configure Security" icon={<Shield className="w-5 h-5 text-rose-400" />} status="pending">
              <p className="text-sm text-slate-400 mb-4">
                Настройте sandbox в конфиге — что агенту разрешено и запрещено:
              </p>
              <CmdBlock
                title="~/.nexus/config.yaml → security section"
                commands={[
                  'security:',
                  '  sandbox:',
                  '    enabled: true',
                  '    allowed_paths:',
                  '      - "."                    # current project',
                  '      - "/tmp/nexus-*"',
                  '    blocked_paths:',
                  '      - "/etc/**"',
                  '      - "~/.ssh/**"',
                  '      - "~/.aws/**"',
                  '  shell:',
                  '    allowed_commands:',
                  '      - "ls" - "cat" - "grep" - "git"',
                  '      - "npm" - "python" - "node"',
                  '    require_approval:',
                  '      - "rm" - "mv" - "sudo"',
                ]}
              />
            </StepCard>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="space-y-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-400" />
              Usage Examples
            </h2>

            {/* Interactive mode */}
            <section>
              <h3 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Interactive Mode
              </h3>
              <CmdBlock
                title="Terminal"
                commands={[
                  '# Start interactive session',
                  'nexus',
                  '',
                  '# With specific profile',
                  'nexus --profile fast',
                  '',
                  '# In specific directory',
                  'nexus --cwd /path/to/project',
                ]}
              />

              <div className="mt-4 rounded-xl border border-slate-700/50 bg-[#0d1117] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/60 border-b border-slate-700/40">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                  </div>
                  <span className="text-xs text-slate-500 font-mono ml-2">nexus session</span>
                </div>
                <div className="p-4 font-mono text-sm space-y-2">
                  <div className="text-slate-500">🚀 NexusAI v1.0.0 | Model: claude-sonnet-4-20250514 | 8 tools</div>
                  <div className="text-slate-500">────────────────────────────────────────────────────</div>
                  <div className="flex gap-2">
                    <span className="text-cyan-400">you ›</span>
                    <span className="text-white">Add error handling to all API endpoints in src/api/</span>
                  </div>
                  <div className="text-violet-400 mt-2">🧠 Analyzing... selected 5 tools</div>
                  <div className="text-slate-400">📂 read_file("src/api/routes.py")</div>
                  <div className="text-slate-400">📂 read_file("src/api/handlers.py")</div>
                  <div className="text-amber-400">🔧 search_code("async def.*handler")</div>
                  <div className="text-emerald-400 mt-1">✏️  Proposed changes to 3 files:</div>
                  <div className="text-slate-500 ml-2">  src/api/routes.py     +12 -3</div>
                  <div className="text-slate-500 ml-2">  src/api/handlers.py   +28 -5</div>
                  <div className="text-slate-500 ml-2">  src/api/middleware.py  +8  -0</div>
                  <div className="text-amber-400 mt-2">⚡ [a]ccept all | [r]eview diff | [e]dit | [s]kip</div>
                </div>
              </div>
            </section>

            {/* Single query */}
            <section>
              <h3 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Single Query Mode
              </h3>
              <CmdBlock
                title="Terminal"
                commands={[
                  '# One-shot query',
                  'nexus -q "Explain the architecture of this project"',
                  '',
                  '# Pipe input',
                  'cat error.log | nexus -q "Analyze this error and suggest fixes"',
                  '',
                  '# With specific model',
                  'nexus -q "Optimize this SQL query" --model gpt-4o',
                ]}
              />
            </section>

            {/* Keybindings */}
            <section>
              <h3 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                Key Bindings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { keys: 'Ctrl+K', action: 'Command Palette' },
                  { keys: 'Ctrl+L', action: 'Clear screen' },
                  { keys: 'Ctrl+C', action: 'Cancel current operation' },
                  { keys: 'Ctrl+D', action: 'Exit session' },
                  { keys: 'Ctrl+Z', action: 'Undo last file change' },
                  { keys: 'Esc', action: 'Cancel / go back' },
                  { keys: 'Tab', action: 'Auto-complete' },
                  { keys: 'Ctrl+M', action: 'Switch model' },
                  { keys: 'Ctrl+P', action: 'Switch profile' },
                  { keys: 'Ctrl+S', action: 'Save session' },
                ].map(kb => (
                  <div key={kb.keys} className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/20 px-4 py-2.5">
                    <span className="text-sm text-slate-300">{kb.action}</span>
                    <kbd className="px-2 py-0.5 text-xs font-mono bg-slate-700/50 border border-slate-600/50 rounded text-slate-300">
                      {kb.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </section>

            {/* Useful commands */}
            <section>
              <h3 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <Rocket className="w-4 h-4 text-violet-400" />
                Useful Commands
              </h3>
              <CmdBlock
                title="Terminal — CLI Reference"
                commands={[
                  'nexus                    # Interactive mode',
                  'nexus -q "query"         # Single query',
                  'nexus --profile fast     # Use profile',
                  'nexus --model gpt-4o     # Override model',
                  'nexus --cwd ./project    # Set working dir',
                  'nexus init               # Initialize config',
                  'nexus doctor             # Check installation',
                  'nexus skills list        # List loaded skills',
                  'nexus skills install X   # Install skill pack',
                  'nexus config edit        # Edit config in $EDITOR',
                  'nexus config show        # Show current config',
                  'nexus session export     # Export session as MD',
                  'nexus session resume     # Resume last session',
                  'nexus cost               # Show cost dashboard',
                  'nexus update             # Update to latest',
                ]}
              />
            </section>
          </div>
        )}

        {activeTab === 'troubleshoot' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              Troubleshooting
            </h2>

            <div className="space-y-3">
              <Accordion title="❌  'nexus: command not found'" defaultOpen>
                <div className="text-sm text-slate-300 space-y-2">
                  <p>Python bin directory не в PATH. Добавьте:</p>
                  <CmdBlock commands={[
                    '# For pip install',
                    'export PATH="$HOME/.local/bin:$PATH"',
                    '',
                    '# For venv install',
                    'source ~/.nexus/venv/bin/activate',
                    '',
                    '# Permanent fix (add to ~/.bashrc or ~/.zshrc)',
                    'echo \'export PATH="$HOME/.local/bin:$PATH"\' >> ~/.bashrc',
                    'source ~/.bashrc',
                  ]} />
                </div>
              </Accordion>

              <Accordion title="❌  'ModuleNotFoundError: No module named litellm'">
                <div className="text-sm text-slate-300 space-y-2">
                  <p>Зависимости не установлены. Переустановите:</p>
                  <CmdBlock commands={[
                    'pip install --upgrade nexus-core',
                    '',
                    '# Or if using venv, make sure it\'s activated:',
                    'source ~/.nexus/venv/bin/activate',
                    'pip install "nexus-core[full]"',
                  ]} />
                </div>
              </Accordion>

              <Accordion title="❌  API key errors / 401 Unauthorized">
                <div className="text-sm text-slate-300 space-y-2">
                  <p>Проверьте, что ключи правильно установлены:</p>
                  <CmdBlock commands={[
                    '# Check if keys are set',
                    'nexus doctor',
                    '',
                    '# Or verify manually',
                    'echo $ANTHROPIC_API_KEY',
                    'echo $OPENAI_API_KEY',
                    '',
                    '# Re-set if empty',
                    'export ANTHROPIC_API_KEY="sk-ant-..."',
                    '',
                    '# Or add to ~/.nexus/.env',
                    'echo "ANTHROPIC_API_KEY=sk-ant-..." >> ~/.nexus/.env',
                  ]} />
                </div>
              </Accordion>

              <Accordion title="❌  Ollama connection refused">
                <div className="text-sm text-slate-300 space-y-2">
                  <p>Убедитесь, что Ollama запущен:</p>
                  <CmdBlock commands={[
                    '# Start Ollama',
                    'ollama serve',
                    '',
                    '# Check if running',
                    'curl http://localhost:11434/api/tags',
                    '',
                    '# Pull a model',
                    'ollama pull codellama:34b',
                    '',
                    '# Test in NexusAI',
                    'nexus --profile local',
                  ]} />
                </div>
              </Accordion>

              <Accordion title="❌  Tree-sitter / RAG not working">
                <div className="text-sm text-slate-300 space-y-2">
                  <p>Установите опциональные зависимости:</p>
                  <CmdBlock commands={[
                    '# Install RAG extras',
                    'pip install "nexus-core[rag]"',
                    '',
                    '# Rebuild tree-sitter parsers',
                    'nexus rag rebuild',
                    '',
                    '# Check status',
                    'nexus rag status',
                  ]} />
                </div>
              </Accordion>

              <Accordion title="❌  Permission denied on file write">
                <div className="text-sm text-slate-300 space-y-2">
                  <p>Security sandbox блокирует путь. Добавьте в whitelist:</p>
                  <CmdBlock commands={[
                    '# Edit config',
                    'nexus config edit',
                    '',
                    '# Add to security.sandbox.allowed_paths:',
                    '#   - "/path/to/your/project"',
                    '',
                    '# Or disable sandbox (not recommended)',
                    '#   security.sandbox.enabled: false',
                  ]} />
                </div>
              </Accordion>

              <Accordion title="💡  Still stuck?">
                <div className="text-sm text-slate-300 space-y-2">
                  <p>Попробуйте:</p>
                  <CmdBlock commands={[
                    '# Full diagnostic',
                    'nexus doctor --verbose',
                    '',
                    '# Reset config to defaults',
                    'nexus init --force',
                    '',
                    '# Clean reinstall',
                    'pip uninstall nexus-core -y',
                    'pip cache purge',
                    'pip install "nexus-core[full]"',
                  ]} />
                  <p className="mt-3">
                    Или создайте issue:{' '}
                    <a href="#" className="text-blue-400 hover:underline inline-flex items-center gap-1">
                      github.com/nexusai/nexus-core/issues <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                </div>
              </Accordion>
            </div>
          </div>
        )}
      </main>

      {/* ─── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/50 py-8 mt-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-slate-500" />
              <span className="text-sm text-slate-500">NexusAI Core v1.0.0</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-slate-300 transition-colors inline-flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> Docs
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
