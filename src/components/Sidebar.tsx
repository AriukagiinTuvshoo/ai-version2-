import React from 'react';
import {
  LayoutDashboard,
  Paperclip,
  Brain,
  MessageSquare,
  Activity,
  Milestone,
  Settings,
  ShieldCheck,
  User,
  CheckCircle2,
} from 'lucide-react';
import { ViewTab, UserProfile } from '../types';

interface SidebarProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  uiLang: 'mn' | 'en' | 'ja';
  setUiLang: (lang: 'mn' | 'en' | 'ja') => void;
  activeUser: string;
  onSwitchUser: (userId: string) => void;
  users: UserProfile[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  uiLang,
  setUiLang,
  activeUser,
  onSwitchUser,
  users,
}) => {
  const isMn = uiLang === 'mn';

  const agentsList = [
    { name: 'Coordinator', color: '#F43F5E', role: 'Зохицуулагч' },
    { name: 'Planner', color: '#A855F7', role: 'Төлөвлөгч' },
    { name: 'Researcher', color: '#38BDF8', role: 'Судлаач' },
    { name: 'Coder', color: '#10B981', role: 'Хөгжүүлэгч' },
    { name: 'Reviewer', color: '#F59E0B', role: 'Шүүмжлэгч' },
    { name: 'Tester', color: '#EC4899', role: 'Тестлэгч' },
    { name: 'Memory Agent', color: '#6366F1', role: 'Санах ой' },
  ];

  return (
    <aside className="w-64 bg-[#0a0711] border-r border-[#1a1426] flex flex-col justify-between shrink-0 select-none text-slate-300">
      {/* Top Header */}
      <div className="p-4 border-b border-[#1a1426]/80">
        <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-mono font-medium">
          LOCAL · STUDIO
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white tracking-tight">Agentic</span>
            <span className="text-xl font-serif italic text-amber-200/90 font-medium">OS</span>
          </div>
          <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-purple-950/80 text-purple-300 border border-purple-500/30">
            v4.2 PRO
          </span>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-none">
        {/* WORKSPACE */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] tracking-[0.18em] uppercase text-slate-500 font-mono font-semibold">
            WORKSPACE
          </div>

          <button
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'home'
                ? 'bg-[#1e1730] text-white shadow-sm shadow-purple-500/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-[#140e22]'
            }`}
          >
            <LayoutDashboard className={`h-4 w-4 ${activeTab === 'home' ? 'text-indigo-400' : 'text-slate-500'}`} />
            <span>{isMn ? 'Mission Control' : 'Mission Control'}</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'projects'
                ? 'bg-[#1e1730] text-white shadow-sm shadow-purple-500/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-[#140e22]'
            }`}
          >
            <Paperclip className={`h-4 w-4 ${activeTab === 'projects' ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span>{isMn ? 'Төслүүд (Paperclip)' : 'Paperclip'}</span>
          </button>

          <button
            onClick={() => setActiveTab('agents')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'agents'
                ? 'bg-[#1e1730] text-white shadow-sm shadow-purple-500/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-[#140e22]'
            }`}
          >
            <Brain className={`h-4 w-4 ${activeTab === 'agents' ? 'text-purple-400' : 'text-slate-500'}`} />
            <span>{isMn ? 'AI Agent Mastermind' : 'AI Agent Mastermind'}</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'chat'
                ? 'bg-[#1e1730] text-white shadow-sm shadow-purple-500/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-[#140e22]'
            }`}
          >
            <MessageSquare className={`h-4 w-4 ${activeTab === 'chat' ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>{isMn ? 'Чат & Гүйцэтгэл' : 'Command Chat'}</span>
          </button>
        </div>

        {/* AGENTS LIST (Matching Screenshot) */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] tracking-[0.18em] uppercase text-slate-500 font-mono font-semibold flex items-center justify-between">
            <span>AGENTS</span>
            <span className="text-[9px] text-emerald-400">7 ACTIVE</span>
          </div>

          <div className="space-y-0.5 pt-1">
            {agentsList.map((agent) => (
              <button
                key={agent.name}
                onClick={() => setActiveTab('agents')}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-[#140e22] transition group"
              >
                <div
                  className="h-2 w-2 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: agent.color }}
                />
                <span className="truncate group-hover:text-slate-200">{agent.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* SELF */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] tracking-[0.18em] uppercase text-slate-500 font-mono font-semibold">
            SELF
          </div>

          <button
            onClick={() => setActiveTab('activity')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'activity'
                ? 'bg-[#1e1730] text-white'
                : 'text-slate-400 hover:text-slate-100 hover:bg-[#140e22]'
            }`}
          >
            <Activity className={`h-4 w-4 ${activeTab === 'activity' ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>{isMn ? 'Ажлын түүх (Pipeline)' : 'Pipeline'}</span>
          </button>

          <button
            onClick={() => setActiveTab('memory')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'memory'
                ? 'bg-[#1e1730] text-white'
                : 'text-slate-400 hover:text-slate-100 hover:bg-[#140e22]'
            }`}
          >
            <Milestone className={`h-4 w-4 ${activeTab === 'memory' ? 'text-violet-400' : 'text-slate-500'}`} />
            <span>{isMn ? 'Ой санамж (Memory)' : 'Memory & Goals'}</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'diagnostics'
                ? 'bg-[#1e1730] text-white'
                : 'text-slate-400 hover:text-slate-100 hover:bg-[#140e22]'
            }`}
          >
            <ShieldCheck className={`h-4 w-4 ${activeTab === 'diagnostics' ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span>{isMn ? 'Тест ба Аудит' : 'Acceptance Audit'}</span>
          </button>
        </div>
      </div>

      {/* Footer Profile & Language Controls */}
      <div className="p-3 border-t border-[#1a1426] bg-[#0c0915] space-y-2">
        {/* User Isolation Switcher */}
        <div className="flex items-center justify-between bg-[#150f22] p-1.5 rounded-lg border border-[#231a38]">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-purple-600/40 border border-purple-500/50 flex items-center justify-center text-[11px] text-purple-200">
              <User className="h-3 w-3" />
            </div>
            <div className="text-left">
              <div className="text-[11px] font-semibold text-white">
                {activeUser === 'owner' ? 'Би (Owner)' : 'Найз (Friend)'}
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                {activeUser === 'owner' ? 'Admin Access' : 'Isolated Session'}
              </div>
            </div>
          </div>

          <button
            onClick={() => onSwitchUser(activeUser === 'owner' ? 'friend' : 'owner')}
            className="px-2 py-0.5 text-[10px] font-mono text-purple-300 hover:text-white bg-purple-950/60 hover:bg-purple-900/60 rounded border border-purple-500/30 transition"
            title="Switch User Profile"
          >
            {activeUser === 'owner' ? '→ Найз' : '→ Би'}
          </button>
        </div>

        {/* Language & Settings bar */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center bg-[#150f22] rounded-md p-0.5 border border-[#231a38] text-[10px] font-mono">
            <button
              onClick={() => setUiLang('mn')}
              className={`px-1.5 py-0.5 rounded transition ${
                uiLang === 'mn' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              MN
            </button>
            <button
              onClick={() => setUiLang('en')}
              className={`px-1.5 py-0.5 rounded transition ${
                uiLang === 'en' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setUiLang('ja')}
              className={`px-1.5 py-0.5 rounded transition ${
                uiLang === 'ja' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              JA
            </button>
          </div>

          <button
            onClick={() => setActiveTab('settings')}
            className={`p-1.5 rounded-lg transition ${
              activeTab === 'settings'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-[#150f22]'
            }`}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
