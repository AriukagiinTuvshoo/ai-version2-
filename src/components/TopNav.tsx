import React, { useState, useEffect } from 'react';
import { Command, Cpu, Sparkles, Shield, Wifi, WifiOff } from 'lucide-react';
import { ViewTab } from '../types';

interface TopNavProps {
  activeTab: ViewTab;
  onOpenCommandPalette: () => void;
  uiLang: 'mn' | 'en' | 'ja';
  offlineMode: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onOpenCommandPalette,
  uiLang,
  offlineMode,
}) => {
  const isMn = uiLang === 'mn';
  const isJa = uiLang === 'ja';
  const [timeStr, setTimeStr] = useState('11:04');

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
      section: 'WORKSPACE · MISSION CONTROL',
      title: isMn ? 'Mission Control' : isJa ? 'ミッションコントロール' : 'Mission Control',
      subtitle: isMn
        ? 'Хувийн AI ажлын төв, олон агентуудын шууд явц ба төслүүдийн төлөв.'
        : 'Personal AI Command Center: live agent tasks, recent projects, and quick executions.',
    },
    chat: {
      roman: 'II.',
      section: 'WORKSPACE · CONVERSATION & COMMAND',
      title: isMn ? 'Command Chat' : isJa ? '対話＆実行' : 'Command Chat',
      subtitle: isMn
        ? 'Байгалийн хэлээр харилцах, файл унших, бодит тооцоолол, код шинжилгээ.'
        : 'Natural interaction with safe AST calculator, knowledge file grounding, and verification.',
    },
    projects: {
      roman: 'III.',
      section: 'WORKSPACE · PAPERCLIP PROJECTS',
      title: isMn ? 'Paperclip' : isJa ? 'プロジェクト管理' : 'Paperclip',
      subtitle: isMn
        ? 'Төслүүдийн зорилго, даалгаврын хуваарилалт, шийдвэрийн түүх, аудитын тайлан.'
        : 'Project scopes, task boards, decision logs, file links, and audit histories.',
    },
    agents: {
      roman: 'IV.',
      section: 'AGENTS · MULTI-AGENT MASTERMIND',
      title: isMn ? 'AI Agent Mastermind' : isJa ? 'エージェント管理' : 'AI Agent Mastermind',
      subtitle: isMn
        ? '7 төрлийн мэргэшсэн агент: Planner, Researcher, Coder, Reviewer, Tester, Memory, Coordinator.'
        : 'Specialized 7-agent roles with verifiable checks and independent peer-review.',
    },
    memory: {
      roman: 'XV.',
      section: 'SELF · MEMORY',
      title: isMn ? 'Memory' : isJa ? '記憶＆ナレッジ' : 'Memory',
      subtitle: isMn
        ? 'Search 1261 Omi memories + your Obsidian vault.'
        : 'Search 1261 Omi memories + your Obsidian vault.',
    },
    workspace: {
      roman: 'XVI.',
      section: 'WORKSPACE · SAFE CODING WORKTREE',
      title: isMn ? 'Coding Workspace' : isJa ? 'セーフワークスペース' : 'Coding Workspace',
      subtitle: isMn
        ? 'Тусгаарласан Git worktree, нэгдсэн unified diff, авто-тестүүд ба хүний зөвшөөрөл [ACCEPT / REFINE].'
        : 'Isolated Git worktree, live unified diff viewer, sandboxed test runs, and explicit human approval.',
    },
    activity: {
      roman: 'VI.',
      section: 'SELF · PIPELINE',
      title: isMn ? 'Pipeline' : isJa ? 'アクティビティ履歴' : 'Pipeline',
      subtitle: isMn
        ? 'AI-ийн хийсэн бүх үйлдэл, уншсан файл, тестүүд, болон аюулгүй байдлын аудит.'
        : 'Traceable execution audit trail, file accesses, git diffs, and security check logs.',
    },
    diagnostics: {
      roman: 'VII.',
      section: 'SELF · ACCEPTANCE AUDIT',
      title: isMn ? 'Acceptance Audit' : isJa ? '監査＆テスト' : 'Acceptance Audit',
      subtitle: isMn
        ? 'README болон test_autonomous_agent_v4.py файлын 7 хүлээн авах шалгуурын бодит шалгалт.'
        : 'Live verification of the 7 safety rules, AST parser math, and traversal guards.',
    },
    graph: {
      roman: 'XVII.',
      section: 'MEMORY · KNOWLEDGE GRAPH',
      title: isMn ? 'Knowledge Graph' : isJa ? 'ナレッジグラフ' : 'Knowledge Graph',
      subtitle: isMn
        ? 'Санах ой ба мэдлэгийн кластеруудын интерактив график дүрслэл.'
        : 'Interactive graph visualization of memory nodes, clusters, and conceptual relationships.',
    },
    settings: {
      roman: 'VIII.',
      section: 'SYSTEM · CONFIGURATION',
      title: isMn ? 'Settings' : isJa ? 'システム設定' : 'Settings',
      subtitle: isMn
        ? 'AI загвар, зардал, төхөөрөмжийн эрх, хэрэглэгчийн өгөгдлийн тусгаарлалт.'
        : 'Model selection, budget limits, user isolation, and offline engine toggles.',
    },
  };

  const current = metaMap[activeTab];

  return (
    <header className="px-6 sm:px-8 pt-6 pb-4 bg-[#0a0711] border-b border-[#1a1426]/60">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left Title & Breadcrumb */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-slate-400">
            <span className="text-amber-200/90 font-semibold">{current.roman}</span>
            <span>—</span>
            <span className="text-slate-400 font-medium">{current.section}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
            {current.title}
          </h1>

          <p className="text-xs text-slate-400 max-w-2xl font-sans">
            {current.subtitle}
          </p>

          <div className="text-[11px] font-mono text-slate-500 pt-0.5">
            <span className="text-slate-400">{timeStr}</span> LOCAL · STUDIO
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-3 shrink-0 pt-1">
          {/* Command Palette Button (⌘K) */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#140e22] hover:bg-[#1e1730] border border-[#231a38] hover:border-purple-500/40 text-slate-300 text-xs font-mono transition shadow-sm"
          >
            <Command className="h-3.5 w-3.5 text-purple-400" />
            <span>Command palette</span>
            <kbd className="px-1 py-0.5 text-[9px] bg-slate-900 border border-slate-700 rounded text-slate-400">
              ⌘K
            </kbd>
          </button>

          {/* ALL SYSTEMS Status indicator (from screenshot) */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#120d1e] border border-[#221834] text-xs font-mono">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
              <span className="h-2 w-2 rounded-full bg-emerald-400/60" />
            </div>
            <span className="font-semibold text-slate-200 text-[11px]">ALL SYSTEMS</span>
            {offlineMode ? (
              <span className="text-[9px] text-amber-400 flex items-center gap-1">
                <WifiOff className="h-3 w-3" /> Offline
              </span>
            ) : (
              <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                <Wifi className="h-3 w-3" /> Online
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
