import React, { useState, useEffect } from 'react';
import { Command, Wifi, WifiOff, Menu, X, ShieldCheck, Lock } from 'lucide-react';
import { ViewTab } from '../types';

interface TopNavProps {
  activeTab: ViewTab;
  onOpenCommandPalette: () => void;
  uiLang: 'mn' | 'en' | 'ja';
  offlineMode: boolean;
  onNavigate?: (tab: ViewTab) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onOpenCommandPalette,
  uiLang,
  offlineMode,
  onNavigate,
}) => {
  const isMn = uiLang === 'mn';
  const isJa = uiLang === 'ja';
  const [timeStr, setTimeStr] = useState('11:04');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const metaMap: Record<
    ViewTab,
    { roman: string; section: string; title: string; subtitle: string }
  > = {
    home: {
      roman: 'I.',
      section: 'PERSONAL AI · MISSION CONTROL',
      title: isMn ? 'Өнөөдөр' : isJa ? 'ミッションコントロール' : 'Mission Control',
      subtitle: isMn
        ? 'Хувийн туслах, олон агентын бодит явц, санах ой ба баталгаажуулалтын хяналт.'
        : 'Personal AI Command Center: live agent tasks, memory vault, and human approval checkpoints.',
    },
    chat: {
      roman: 'II.',
      section: 'ASSISTANT · CONVERSATION & COMMAND',
      title: isMn ? 'Миний туслах' : isJa ? '対話＆実行' : 'Assistant Chat',
      subtitle: isMn
        ? 'Байгалийн хэл ба дуут команд, safe AST тооцоолуур, баримтад тулгуурласан хариулт.'
        : 'Natural interaction with safe AST calculator, voice command, and verifiable execution.',
    },
    projects: {
      roman: 'III.',
      section: 'WORKSPACE · PROJECTS & TASKS',
      title: isMn ? 'Төслүүд' : isJa ? 'プロジェクト管理' : 'Projects',
      subtitle: isMn
        ? 'Төслийн зорилго, даалгаврын хуваарилалт, шийдвэрийн түүх, аудитын тайлан.'
        : 'Project scopes, task boards, decision logs, file links, and audit histories.',
    },
    agents: {
      roman: 'IV.',
      section: 'AGENTS · SPECIALIZED TEAM',
      title: isMn ? 'Агентуудын баг' : isJa ? 'エージェント管理' : 'Agent Team',
      subtitle: isMn
        ? '7 төрлийн мэргэшсэн агент: Planner, Researcher, Coder, Reviewer, Tester, Memory, Coordinator.'
        : 'Specialized 7-agent roles with verifiable checks and independent peer-review.',
    },
    memory: {
      roman: 'V.',
      section: 'SELF · MEMORY VAULT & GALAXY',
      title: isMn ? 'Санах ой' : isJa ? '記憶＆ナレッジ' : 'Memory Vault',
      subtitle: isMn
        ? 'Хувийн тохиргоо, техникийн шийдвэр, мэдлэгийн сан ба 3D Galaxy дүрслэл.'
        : 'Search, edit, and organize persistent memories, preferences, and knowledge graphs.',
    },
    workspace: {
      roman: 'VI.',
      section: 'WORKSPACE · ISOLATED CODING WORKTREE',
      title: isMn ? 'Coding Workspace' : isJa ? 'セーフワークスペース' : 'Coding Workspace',
      subtitle: isMn
        ? 'Тусгаарласан Git worktree, нэгдсэн unified diff, авто-тестүүд ба хүний зөвшөөрөл [ACCEPT / REFINE].'
        : 'Isolated Git worktree, live unified diff viewer, sandboxed test runs, and explicit human approval.',
    },
    activity: {
      roman: 'VII.',
      section: 'SELF · ACTIVITY & AUDIT PIPELINE',
      title: isMn ? 'Түүх & Лог' : isJa ? 'アクティビティ履歴' : 'Activity Pipeline',
      subtitle: isMn
        ? 'AI-ийн хийсэн бүх үйлдэл, уншсан файл, тестүүд, болон аюулгүй байдлын аудит.'
        : 'Traceable execution audit trail, file accesses, git diffs, and security check logs.',
    },
    diagnostics: {
      roman: 'VIII.',
      section: 'SECURITY · ACCEPTANCE AUDIT',
      title: isMn ? 'Тест ба Аудит' : isJa ? '監査＆テスト' : 'Acceptance Audit',
      subtitle: isMn
        ? '19 бодит хүлээн авах шалгуур, AST тооцоолуур, path traversal хамгаалалтын шалгалт.'
        : 'Live verification of safety rules, AST parser math, and traversal guards.',
    },
    graph: {
      roman: 'IX.',
      section: 'MEMORY · KNOWLEDGE GRAPH',
      title: isMn ? 'Knowledge Graph' : isJa ? 'ナレッジグラフ' : 'Knowledge Graph',
      subtitle: isMn
        ? 'Санах ой ба мэдлэгийн кластеруудын интерактив график дүрслэл.'
        : 'Interactive graph visualization of memory nodes, clusters, and conceptual relationships.',
    },
    settings: {
      roman: 'X.',
      section: 'SYSTEM · CONFIGURATION & SECURITY',
      title: isMn ? 'Тохиргоо' : isJa ? 'システム設定' : 'Settings',
      subtitle: isMn
        ? 'AI загвар, зардал, төхөөрөмжийн эрх, хэрэглэгчийн өгөгдлийн тусгаарлалт.'
        : 'Model selection, budget limits, user isolation, and security controls.',
    },
  };

  const current = metaMap[activeTab];

  const mobileNavItems: { id: ViewTab; label: string }[] = [
    { id: 'home', label: isMn ? 'Өнөөдөр' : 'Home' },
    { id: 'chat', label: isMn ? 'Миний туслах' : 'Assistant' },
    { id: 'workspace', label: isMn ? 'Workspace' : 'Workspace' },
    { id: 'memory', label: isMn ? 'Санах ой' : 'Memory' },
    { id: 'projects', label: isMn ? 'Төслүүд' : 'Projects' },
    { id: 'agents', label: isMn ? 'Агентууд' : 'Agents' },
    { id: 'diagnostics', label: isMn ? 'Тест' : 'Audit' },
    { id: 'settings', label: isMn ? 'Тохиргоо' : 'Settings' },
  ];

  return (
    <header className="px-4 sm:px-8 pt-5 pb-4 bg-[#0B0D11] border-b border-white/[0.06]">
      <div className="flex items-start justify-between gap-4">
        {/* Left Title & Breadcrumb */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-slate-400">
            <span className="text-amber-400 font-semibold">{current.roman}</span>
            <span>—</span>
            <span className="text-slate-400 font-medium">{current.section}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-sans">
              {current.title}
            </h1>
            <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-white/[0.04]">
              {timeStr}
            </span>
          </div>

          <p className="text-xs text-slate-400 max-w-2xl font-sans hidden sm:block">
            {current.subtitle}
          </p>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2.5 shrink-0 pt-1">
          {/* Mobile Menu Toggle Button */}
          {onNavigate && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-[#14171F] border border-white/[0.08] text-slate-300 hover:text-white transition"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          )}

          {/* Command Palette Button (⌘K) */}
          <button
            onClick={onOpenCommandPalette}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#14171F] hover:bg-[#1A1F2B] border border-white/[0.08] hover:border-amber-500/40 text-slate-300 text-xs font-mono transition shadow-sm"
          >
            <Command className="h-3.5 w-3.5 text-amber-400" />
            <span>Command</span>
            <kbd className="px-1 py-0.2 text-[9px] bg-slate-900 border border-slate-700 rounded text-slate-400">
              ⌘K
            </kbd>
          </button>

          {/* ALL SYSTEMS Status indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#14171F] border border-white/[0.08] text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200 text-[11px] hidden sm:inline">ONLINE</span>
            {offlineMode ? (
              <span className="text-[9px] text-amber-400 flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
              </span>
            ) : (
              <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                <Wifi className="h-3 w-3" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && onNavigate && (
        <div className="md:hidden mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-1.5">
          {mobileNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setMobileMenuOpen(false);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition ${
                activeTab === item.id
                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                  : 'bg-[#14171F] text-slate-300 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
