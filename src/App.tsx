import React, { useState } from 'react';
import CodeBlock from './components/CodeBlock';
import {
  modelRouter,
  skillManager,
  agentLoop,
  contextManager,
  yamlSkillExample,
  configFile,
  mainEntry,
  securitySandbox,
} from './data/codeFiles';
import {
  Cpu,
  Shield,
  Layers,
  Brain,
  Terminal,
  Zap,
  GitBranch,
  Eye,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Box,
  Workflow,
  Lock,
  FileCode,
  Database,
  Settings,
  Play,
  Code2,
  Globe,
  Wand2,
  MessageSquare,
  GitCompare,
  Command,
  Activity,
} from 'lucide-react';

type Tab = 'overview' | 'router' | 'skills' | 'agent' | 'context' | 'security' | 'config' | 'ux';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [activeCodeTab, setActiveCodeTab] = useState<string>('router');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Architecture', icon: <Layers className="w-4 h-4" /> },
    { id: 'router', label: 'Model Router', icon: <Globe className="w-4 h-4" /> },
    { id: 'skills', label: 'Skill Manager', icon: <Box className="w-4 h-4" /> },
    { id: 'agent', label: 'Agent Loop', icon: <Workflow className="w-4 h-4" /> },
    { id: 'context', label: 'Context & RAG', icon: <Database className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Lock className="w-4 h-4" /> },
    { id: 'config', label: 'Config', icon: <Settings className="w-4 h-4" /> },
    { id: 'ux', label: 'UX Innovations', icon: <Sparkles className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Hero Header */}
      <header className="relative overflow-hidden border-b border-slate-800/50">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-transparent to-cyan-600/10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/20">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                NexusAI Core
              </h1>
              <p className="text-sm text-slate-400">Terminal AI Agent — Production Architecture</p>
            </div>
          </div>
          
          <p className="text-lg text-slate-300 max-w-3xl leading-relaxed">
            Model-agnostic, modular, secure terminal AI agent with ReAct loop, 
            dynamic tool loading, local RAG, and advanced TUX features that surpass Claude Code.
          </p>
          
          <div className="flex flex-wrap gap-3 mt-6">
            {['Python 3.11+', 'LiteLLM', 'Tree-sitter', 'YAML Skills', 'ReAct Loop', 'Sandbox'].map(tag => (
              <span key={tag} className="px-3 py-1 text-xs font-medium rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/50">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {activeTab === 'overview' && <OverviewSection />}
        {activeTab === 'router' && <RouterSection />}
        {activeTab === 'skills' && <SkillsSection />}
        {activeTab === 'agent' && <AgentSection />}
        {activeTab === 'context' && <ContextSection />}
        {activeTab === 'security' && <SecuritySection />}
        {activeTab === 'config' && <ConfigSection />}
        {activeTab === 'ux' && <UXSection />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-500">
          <p>NexusAI Core — Architecture & Implementation Reference</p>
          <p className="mt-1">Model-Agnostic • Modular • Secure • Production-Ready</p>
        </div>
      </footer>
    </div>
  );
};

// === SECTION COMPONENTS ===

const OverviewSection: React.FC = () => (
  <div className="space-y-10">
    {/* Architecture Diagram */}
    <section>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Layers className="w-6 h-6 text-violet-400" />
        System Architecture
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Layer 1: Input */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-cyan-300">Input Layer (TUI)</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 mt-1 text-cyan-500 shrink-0" />
              Rich/Textual terminal UI
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 mt-1 text-cyan-500 shrink-0" />
              Markdown streaming renderer
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 mt-1 text-cyan-500 shrink-0" />
              Interactive diff preview
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 mt-1 text-cyan-500 shrink-0" />
              Approval dialogs
            </li>
          </ul>
        </div>

        {/* Layer 2: Core */}
        <div className="rounded-xl border border-violet-500/30 bg-violet-900/10 p-6 ring-1 ring-violet-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold text-violet-300">Core Engine</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 mt-1 text-violet-500 shrink-0" />
              <span><strong className="text-violet-200">Agent Loop</strong> — ReAct + Function Calling</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 mt-1 text-violet-500 shrink-0" />
              <span><strong className="text-violet-200">Model Router</strong> — LiteLLM abstraction</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 mt-1 text-violet-500 shrink-0" />
              <span><strong className="text-violet-200">Skill Manager</strong> — YAML + auto-select</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 mt-1 text-violet-500 shrink-0" />
              <span><strong className="text-violet-200">Context Manager</strong> — RAG + compression</span>
            </li>
          </ul>
        </div>

        {/* Layer 3: Infrastructure */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-emerald-300">Infrastructure</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 mt-1 text-emerald-500 shrink-0" />
              Security Sandbox
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 mt-1 text-emerald-500 shrink-0" />
              Vector DB (ChromaDB/FAISS)
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 mt-1 text-emerald-500 shrink-0" />
              Tree-sitter parser
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 mt-1 text-emerald-500 shrink-0" />
              Cost tracking & audit log
            </li>
          </ul>
        </div>
      </div>

      {/* Flow Diagram */}
      <div className="mt-8 rounded-xl border border-slate-700/50 bg-slate-800/20 p-8">
        <h3 className="text-lg font-semibold mb-6 text-center text-slate-200">Agent Execution Flow</h3>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          <div className="px-4 py-2 rounded-lg border bg-cyan-900/20 border-cyan-500/30 text-cyan-300">User Input</div>
          <ArrowRight className="w-4 h-4 text-slate-600" />
          <div className="px-4 py-2 rounded-lg border bg-violet-900/20 border-violet-500/30 text-violet-300">Context Build</div>
          <ArrowRight className="w-4 h-4 text-slate-600" />
          <div className="px-4 py-2 rounded-lg border bg-amber-900/20 border-amber-500/30 text-amber-300">Tool Selection</div>
          <ArrowRight className="w-4 h-4 text-slate-600" />
          <div className="px-4 py-2 rounded-lg border bg-violet-900/20 border-violet-500/30 text-violet-300">LLM Call</div>
          <ArrowRight className="w-4 h-4 text-slate-600" />
          <div className="px-4 py-2 rounded-lg border bg-emerald-900/20 border-emerald-500/30 text-emerald-300">Tool Execution</div>
          <ArrowRight className="w-4 h-4 text-slate-600" />
          <div className="px-4 py-2 rounded-lg border bg-blue-900/20 border-blue-500/30 text-blue-300">Observation</div>
          <ArrowRight className="w-4 h-4 text-slate-600" />
          <div className="px-4 py-2 rounded-lg border bg-rose-900/20 border-rose-500/30 text-rose-300">Loop / Done</div>
        </div>
      </div>
    </section>

    {/* Tech Stack */}
    <section>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Cpu className="w-6 h-6 text-cyan-400" />
        Technology Stack
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: 'Python 3.11+', desc: 'Core language, async/await', icon: <Code2 className="w-5 h-5" /> },
          { name: 'LiteLLM', desc: 'Unified LLM API (50+ providers)', icon: <Globe className="w-5 h-5" /> },
          { name: 'Tree-sitter', desc: 'Code parsing & AST indexing', icon: <FileCode className="w-5 h-5" /> },
          { name: 'ChromaDB', desc: 'Local vector store for RAG', icon: <Database className="w-5 h-5" /> },
          { name: 'Textual/Rich', desc: 'Terminal UI framework', icon: <Terminal className="w-5 h-5" /> },
          { name: 'PyYAML', desc: 'Skill manifest parsing', icon: <Settings className="w-5 h-5" /> },
          { name: 'asyncio', desc: 'Async execution engine', icon: <Zap className="w-5 h-5" /> },
          { name: 'seccomp', desc: 'Linux syscall sandboxing', icon: <Shield className="w-5 h-5" /> },
        ].map(tech => (
          <div key={tech.name} className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 hover:border-slate-600/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-violet-400">{tech.icon}</span>
              <span className="font-medium text-sm text-white">{tech.name}</span>
            </div>
            <p className="text-xs text-slate-400">{tech.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Key Design Decisions */}
    <section>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-amber-400" />
        Key Design Decisions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            title: 'LiteLLM over Direct APIs',
            desc: 'Single abstraction layer for 50+ LLM providers. Switch models with config change, not code change.',
          },
          {
            title: 'YAML Skills over Hardcoded Tools',
            desc: 'Dynamic loading means zero code changes to add new capabilities. Community-shareable skill packs.',
          },
          {
            title: 'ReAct over Pure Function Calling',
            desc: 'Explicit Think→Act→Observe cycle gives better reasoning transparency and debugging.',
          },
          {
            title: 'Tree-sitter for Code RAG',
            desc: 'Semantic code understanding (functions, classes, imports) vs naive text chunking.',
          },
        ].map(decision => (
          <div key={decision.title} className="rounded-lg border border-slate-700/50 bg-slate-800/20 p-5">
            <h3 className="font-semibold text-amber-300 mb-2">{decision.title}</h3>
            <p className="text-sm text-slate-400">{decision.desc}</p>
          </div>
        ))}
      </div>
    </section>
  </div>
);

const RouterSection: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-2">
      <Globe className="w-6 h-6 text-cyan-400" />
      <h2 className="text-2xl font-bold">Model Router</h2>
    </div>
    <p className="text-slate-300 max-w-3xl">
      Единая точка входа для любого LLM. Использует LiteLLM как унифицирующий слой. 
      Поддерживает fallback-цепочки, cost tracking, стриминг и кэширование.
    </p>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {[
        { title: '50+ Providers', desc: 'OpenAI, Anthropic, Ollama, vLLM, Azure, OpenRouter...', icon: <Globe className="w-4 h-4" /> },
        { title: 'Auto-Fallback', desc: 'Exponential backoff + chain of alternative models', icon: <Zap className="w-4 h-4" /> },
        { title: 'Cost Tracking', desc: 'Real-time session cost in USD per model', icon: <Activity className="w-4 h-4" /> },
      ].map(f => (
        <div key={f.title} className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
          <div className="flex items-center gap-2 mb-1 text-cyan-400">
            {f.icon}
            <span className="font-medium text-sm">{f.title}</span>
          </div>
          <p className="text-xs text-slate-400">{f.desc}</p>
        </div>
      ))}
    </div>
    
    <CodeBlock code={modelRouter} language="python" filename="nexus_core/model_router.py" maxHeight="500px" />
  </div>
);

const SkillsSection: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-2">
      <Box className="w-6 h-6 text-violet-400" />
      <h2 className="text-2xl font-bold">Skill Manager</h2>
    </div>
    <p className="text-slate-300 max-w-3xl">
      Модульная система динамической загрузки инструментов из YAML/JSON. 
      Включает auto-tool-selection — агент сам решает, какие скиллы подключить в контекст.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {[
        { title: 'YAML Manifests', desc: 'Define tools declaratively with parameters, risk levels, and handlers' },
        { title: 'Auto-Selection', desc: 'Semantic scoring selects relevant tools based on user query' },
        { title: 'Hot-Reload', desc: 'Skills update without restart — watch filesystem for changes' },
      ].map(f => (
        <div key={f.title} className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
          <span className="font-medium text-sm text-violet-300">{f.title}</span>
          <p className="text-xs text-slate-400 mt-1">{f.desc}</p>
        </div>
      ))}
    </div>

    <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
      <FileCode className="w-4 h-4 text-violet-400" />
      Core Implementation
    </h3>
    <CodeBlock code={skillManager} language="python" filename="nexus_core/skill_manager.py" maxHeight="500px" />
    
    <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2 mt-8">
      <Settings className="w-4 h-4 text-violet-400" />
      Example YAML Manifest
    </h3>
    <CodeBlock code={yamlSkillExample} language="yaml" filename="skills/deployment.yaml" maxHeight="400px" />
  </div>
);

const AgentSection: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-2">
      <Workflow className="w-6 h-6 text-emerald-400" />
      <h2 className="text-2xl font-bold">Agent Loop (ReAct)</h2>
    </div>
    <p className="text-slate-300 max-w-3xl">
      Основной цикл агента реализует паттерн ReAct (Reasoning + Acting).
      Каждый шаг: Think → Act → Observe. Стримит все события в TUI.
    </p>

    {/* ReAct Diagram */}
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-6 mb-6">
      <h3 className="font-semibold text-emerald-300 mb-4">ReAct Cycle</h3>
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="rounded-lg border border-violet-500/30 bg-violet-900/10 p-4 text-center min-w-[180px]">
          <div className="text-sm font-bold text-violet-300 mb-1">THINK</div>
          <div className="text-xs text-slate-400">Analyze current state and plan next action</div>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-600 rotate-90 md:rotate-0" />
        <div className="rounded-lg border border-cyan-500/30 bg-cyan-900/10 p-4 text-center min-w-[180px]">
          <div className="text-sm font-bold text-cyan-300 mb-1">ACT</div>
          <div className="text-xs text-slate-400">Execute selected tool with parameters</div>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-600 rotate-90 md:rotate-0" />
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-900/10 p-4 text-center min-w-[180px]">
          <div className="text-sm font-bold text-emerald-300 mb-1">OBSERVE</div>
          <div className="text-xs text-slate-400">Process tool output, update context</div>
        </div>
      </div>
      <div className="mt-4 text-center text-xs text-slate-500">
        ↻ Repeat until task is complete or max_steps reached
      </div>
    </div>

    <CodeBlock code={agentLoop} language="python" filename="nexus_core/agent.py" maxHeight="500px" />
    
    <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2 mt-8">
      <Play className="w-4 h-4 text-emerald-400" />
      Entry Point
    </h3>
    <CodeBlock code={mainEntry} language="python" filename="nexus_core/main.py" maxHeight="400px" />
  </div>
);

const ContextSection: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-2">
      <Database className="w-6 h-6 text-blue-400" />
      <h2 className="text-2xl font-bold">Context Manager & RAG</h2>
    </div>
    <p className="text-slate-300 max-w-3xl">
      Умное управление контекстом: автоматическое сжатие истории при переполнении, 
      локальный RAG по кодовой базе (tree-sitter + векторный поиск), персистентная память.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {[
        { title: 'Auto-Compression', desc: 'Summarizes old messages when context reaches 80% capacity' },
        { title: 'Tree-sitter Indexing', desc: 'Semantic code chunks (functions, classes) not naive text splits' },
        { title: 'Vector Search', desc: 'ChromaDB/FAISS for fast semantic retrieval from codebase' },
        { title: 'Persistent Memory', desc: 'JSON-based memory file survives across sessions' },
      ].map(f => (
        <div key={f.title} className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
          <span className="font-medium text-sm text-blue-300">{f.title}</span>
          <p className="text-xs text-slate-400 mt-1">{f.desc}</p>
        </div>
      ))}
    </div>

    <CodeBlock code={contextManager} language="python" filename="nexus_core/context_manager.py" maxHeight="500px" />
  </div>
);

const SecuritySection: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-2">
      <Lock className="w-6 h-6 text-rose-400" />
      <h2 className="text-2xl font-bold">Security Sandbox</h2>
    </div>
    <p className="text-slate-300 max-w-3xl">
      Строгая песочница для shell-команд и файловых операций. 
      Whitelist/blacklist для путей и команд, approval flow для опасных операций, 
      автоматическая санитизация вывода.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {[
        { title: 'Path Whitelist', desc: 'Only allowed directories accessible', level: 'Critical' },
        { title: 'Command Filtering', desc: 'Blocked dangerous commands, approval for risky ones', level: 'High' },
        { title: 'Output Sanitization', desc: 'Auto-redact secrets, emails, tokens from output', level: 'Medium' },
      ].map(f => (
        <div key={f.title} className="rounded-lg border border-rose-500/20 bg-rose-900/10 p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm text-rose-300">{f.title}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">{f.level}</span>
          </div>
          <p className="text-xs text-slate-400">{f.desc}</p>
        </div>
      ))}
    </div>

    <CodeBlock code={securitySandbox} language="python" filename="nexus_core/security.py" maxHeight="500px" />
  </div>
);

const ConfigSection: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-2">
      <Settings className="w-6 h-6 text-amber-400" />
      <h2 className="text-2xl font-bold">Configuration</h2>
    </div>
    <p className="text-slate-300 max-w-3xl">
      Глобальный YAML-конфиг с поддержкой профилей, переменных окружения, 
      security policies, RAG settings и UX preferences.
    </p>

    <div className="rounded-lg border border-amber-500/20 bg-amber-900/10 p-4 mb-6">
      <p className="text-sm text-amber-300">
        💡 <strong>Profiles:</strong> Переключайтесь между профилями через <code className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-200">nexus --profile fast</code>
      </p>
    </div>

    <CodeBlock code={configFile} language="yaml" filename=".nexus/config.yaml" maxHeight="600px" />
  </div>
);

const UXSection: React.FC = () => (
  <div className="space-y-8">
    <div className="flex items-center gap-3 mb-2">
      <Sparkles className="w-6 h-6 text-amber-400" />
      <h2 className="text-2xl font-bold">Innovative UX Features</h2>
    </div>
    <p className="text-slate-300 max-w-3xl">
      5 инновационных UX-фич для терминала, которых нет в Claude Code, 
      но которые делают этот агент объективно лучше и удобнее.
    </p>

    <div className="space-y-6">
      {/* Feature 1 */}
      <div className="rounded-xl border border-slate-700/50 bg-gradient-to-r from-violet-900/10 to-transparent p-6">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-600/20 border border-violet-500/30 shrink-0">
            <GitCompare className="w-5 h-5 text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-violet-300 mb-2">
              1. Ghost Diff Preview
            </h3>
            <p className="text-sm text-slate-300 mb-3">
              Перед записью файла агент показывает интерактивный unified-diff прямо в терминале. 
              Пользователь видит <span className="text-emerald-400">+добавленные</span> и <span className="text-rose-400">-удалённые</span> строки 
              с подсветкой синтаксиса. Можно принять/отклонить/отредактировать изменения построчно.
            </p>
            <div className="rounded-lg bg-slate-900 border border-slate-700/50 p-4 font-mono text-xs overflow-x-auto">
              <div className="text-slate-500 mb-2">─── src/utils.py ───</div>
              <div className="text-slate-400"> 12 | def process(data):</div>
              <div className="text-rose-400 bg-rose-900/20">-13 |     return data.map(lambda x: x * 2)</div>
              <div className="text-emerald-400 bg-emerald-900/20">+13 |     return [transform(item) for item in data]</div>
              <div className="text-slate-400"> 14 |</div>
              <div className="mt-3 text-amber-400">⚡ [a]ccept all | [r]eject | [e]dit line | [s]kip file</div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 2 */}
      <div className="rounded-xl border border-slate-700/50 bg-gradient-to-r from-cyan-900/10 to-transparent p-6">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-600/20 border border-cyan-500/30 shrink-0">
            <Eye className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-cyan-300 mb-2">
              2. Live Execution Timeline
            </h3>
            <p className="text-sm text-slate-300 mb-3">
              Визуальный timeline выполнения в боковой панели TUI. Показывает каждый шаг агента 
              с временными метками, использованными инструментами, и cost per step. 
              Можно "перемотать" к любому шагу и увидеть контекст на тот момент.
            </p>
            <div className="rounded-lg bg-slate-900 border border-slate-700/50 p-4 font-mono text-xs">
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>0.2s</span>
                <span className="text-slate-500">│</span>
                <span>read_file("src/app.py")</span>
                <span className="text-slate-600 ml-auto">$0.001</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-400 mt-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>1.8s</span>
                <span className="text-slate-500">│</span>
                <span>search_code("class.*Handler")</span>
                <span className="text-slate-600 ml-auto">$0.003</span>
              </div>
              <div className="flex items-center gap-2 text-amber-400 mt-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>3.4s</span>
                <span className="text-slate-500">│</span>
                <span>write_file("src/app.py")</span>
                <span className="text-amber-500 ml-auto">⚠ approval</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 3 */}
      <div className="rounded-xl border border-slate-700/50 bg-gradient-to-r from-emerald-900/10 to-transparent p-6">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/30 shrink-0">
            <Command className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-emerald-300 mb-2">
              3. Command Palette (Ctrl+K)
            </h3>
            <p className="text-sm text-slate-300 mb-3">
              Fuzzy-search палитра команд прямо в терминале. Быстрый доступ к: переключению моделей, 
              профилям, очистке контекста, экспорту сессии, toggling инструментов, 
              просмотру cost dashboard, и кастомным скиллам.
            </p>
            <div className="rounded-lg bg-slate-900 border border-slate-700/50 p-4 font-mono text-xs">
              <div className="text-slate-500 mb-2">╭─ Command Palette ─────────────────╮</div>
              <div className="text-white">│ <span className="text-cyan-400">›</span> switch model to gpt-4o         │</div>
              <div className="text-slate-400">│   switch profile to production     │</div>
              <div className="text-slate-400">│   compress context now             │</div>
              <div className="text-slate-400">│   export session to markdown       │</div>
              <div className="text-slate-400">│   toggle tool: web_search          │</div>
              <div className="text-slate-400">│   show cost dashboard              │</div>
              <div className="text-slate-500">╰────────────────────────────────────╯</div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 4 */}
      <div className="rounded-xl border border-slate-700/50 bg-gradient-to-r from-amber-900/10 to-transparent p-6">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-600/20 border border-amber-500/30 shrink-0">
            <GitBranch className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-amber-300 mb-2">
              4. Branch-Aware Context
            </h3>
            <p className="text-sm text-slate-300 mb-3">
              Агент автоматически определяет git-ветку и подстраивает поведение. 
              На feature-ветке — фокус на diff и PR-готовность. На main — максимальная осторожность. 
              Показывает "что изменится в PR" в реальном времени. Интеграция с GitHub Issues/PRs.
            </p>
            <div className="rounded-lg bg-slate-900 border border-slate-700/50 p-4 font-mono text-xs">
              <div className="text-amber-400 mb-2">📍 Branch: feature/auth-refactor</div>
              <div className="text-slate-400">├─ Modified: 3 files</div>
              <div className="text-slate-400">├─ Added: 1 file</div>
              <div className="text-slate-400">├─ Related Issue: #142</div>
              <div className="text-emerald-400 mt-2">✓ Changes are PR-ready</div>
              <div className="text-slate-500 mt-1">  Mode: cautious (main branch protection)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 5 */}
      <div className="rounded-xl border border-slate-700/50 bg-gradient-to-r from-rose-900/10 to-transparent p-6">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-rose-600/20 border border-rose-500/30 shrink-0">
            <Wand2 className="w-5 h-5 text-rose-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-rose-300 mb-2">
              5. Multi-Agent Collaboration Mode
            </h3>
            <p className="text-sm text-slate-300 mb-3">
              Запустите несколько агентов параллельно с разными ролями: 
              "Architect" планирует, "Coder" реализует, "Reviewer" проверяет. 
              Каждый агент — отдельная модель/конфиг. Orchestrator координирует работу 
              и разрешает конфликты. Идеально для сложных рефакторингов.
            </p>
            <div className="rounded-lg bg-slate-900 border border-slate-700/50 p-4 font-mono text-xs">
              <div className="text-violet-400">🏗  Architect (claude-sonnet) — planning...</div>
              <div className="text-cyan-400">⌨  Coder (gpt-4o) — implementing auth module...</div>
              <div className="text-emerald-400">🔍 Reviewer (claude-opus) — reviewing changes...</div>
              <div className="text-slate-500 mt-2">──────────────────────────────────────</div>
              <div className="text-amber-400">⚡ Orchestrator: Reviewer found 2 issues</div>
              <div className="text-cyan-400">⌨  Coder: fixing issues...</div>
              <div className="text-emerald-400">✓ All agents: task complete (12.3s, $0.08)</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Comparison Table */}
    <div className="mt-10">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-slate-400" />
        vs Claude Code
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-slate-700/50 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-slate-800/50">
              <th className="px-4 py-3 text-left text-slate-300 font-medium">Feature</th>
              <th className="px-4 py-3 text-center text-violet-300 font-medium">NexusAI</th>
              <th className="px-4 py-3 text-center text-slate-400 font-medium">Claude Code</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {[
              ['Model Support', '50+ (any LLM)', 'Claude only'],
              ['Tool System', 'YAML + auto-select', 'Hardcoded'],
              ['Local RAG', 'Tree-sitter + vectors', 'Basic file read'],
              ['Context Compression', 'Auto summarization', 'Manual'],
              ['Diff Preview', 'Interactive per-line', 'Basic'],
              ['Multi-Agent', 'Parallel roles', 'Single agent'],
              ['Cost Tracking', 'Real-time per model', 'Not exposed'],
              ['Command Palette', 'Ctrl+K fuzzy search', 'None'],
              ['Branch Awareness', 'Git-integrated', 'Basic'],
              ['Security Sandbox', 'Whitelist + seccomp', 'Basic approval'],
            ].map(([feature, nexus, claude]) => (
              <tr key={feature} className="hover:bg-slate-800/30">
                <td className="px-4 py-2.5 text-slate-300">{feature}</td>
                <td className="px-4 py-2.5 text-center text-emerald-400">{nexus}</td>
                <td className="px-4 py-2.5 text-center text-slate-500">{claude}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default App;
