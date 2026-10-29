import React from 'react';
import {
  LayoutDashboard,
  Brain,
  MessageSquare,
  Activity,
  Milestone,
  Settings,
  ShieldCheck,
  User,
  Code2,
  FolderKanban,
  Users2,
  Lock,
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
}) => {
  const isMn = uiLang === 'mn';

  const agentsList = [
    { name: 'Coordinator', color: '#F43F5E', role: isMn ? 'Зохицуулагч' : 'Coordinator' },
    { name: 'Planner', color: '#A855F7', role: isMn ? 'Төлөвлөгч' : 'Planner' },
    { name: 'Researcher', color: '#38BDF8', role: isMn ? 'Судлаач' : 'Researcher' },
    { name: 'Coder', color: '#10B981', role: isMn ? 'Хөгжүүлэгч' : 'Coder' },
    { name: 'Reviewer', color: '#F59E0B', role: isMn ? 'Шүүмжлэгч' : 'Reviewer' },
    { name: 'Tester', color: '#EC4899', role: isMn ? 'Тестлэгч' : 'Tester' },
    { name: 'Memory Agent', color: '#6366F1', role: isMn ? 'Санах ой' : 'Memory' },
  ];

  const navItems = [
    { id: 'home' as ViewTab, label: isMn ? 'Өнөөдөр' : 'Home', icon: LayoutDashboard, tag: '' },
    { id: 'chat' as ViewTab, label: isMn ? 'Миний туслах' : 'Assistant Chat', icon: MessageSquare, tag: 'VOICE' },
    { id: 'workspace' as ViewTab, label: isMn ? 'Workspace' : 'Workspace', icon: Code2, tag: 'GIT' },
    { id: 'memory' as ViewTab, label: isMn ? 'Санах ой' : 'Memory Vault', icon: Milestone, tag: '' },
    { id: 'projects' as ViewTab, label: isMn ? 'Төслүүд' : 'Projects', icon: FolderKanban, tag: '' },
    { id: 'agents' as ViewTab, label: isMn ? 'Агентуудын баг' : 'Agent Team', icon: Users2, tag: '7 ACTIVE' },
    { id: 'activity' as ViewTab, label: isMn ? 'Түүх & Лог' : 'Activity Logs', icon: Activity, tag: '' },
    { id: 'diagnostics' as ViewTab, label: isMn ? 'Тест ба Аудит' : 'Safety Audit', icon: ShieldCheck, tag: 'PASS' },
  ];

  return (
    <aside className="hidden md:flex w-64 bg-[#0B0D11] border-r border-white/[0.07] flex-col justify-between shrink-0 select-none text-slate-300">
      {/* Brand & Workspace Status */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"></div>
          <span className="text-[11px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
            TUVSHOO AI
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-base font-extrabold text-white tracking-tight">Personal Agent</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
            PRO v4.2
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
        <div className="space-y-1">
          <div className="px-3 text-[10px] tracking-[0.18em] uppercase text-slate-500 font-mono font-semibold">
            {isMn ? 'ҮНДСЭН УДИРДЛАГА' : 'CORE NAVIGATION'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? 'bg-[#181C24] text-white border border-white/[0.1] shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#12151C]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.tag && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                    item.tag === 'GIT' ? 'bg-amber-500/20 text-amber-300' :
                    item.tag === 'PASS' ? 'bg-emerald-500/20 text-emerald-300' :
                    'bg-white/[0.04] text-slate-400'
                  }`}>
                    {item.tag}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Live Multi-Agent Pool */}
        <div className="space-y-1 pt-2 border-t border-white/[0.06]">
          <div className="px-3 text-[10px] tracking-[0.18em] uppercase text-slate-500 font-mono font-semibold flex items-center justify-between">
            <span>{isMn ? 'АГЕНТУУД' : 'AGENT ROSTER'}</span>
            <span className="text-[9px] text-emerald-400 font-mono">ONLINE</span>
          </div>

          <div className="space-y-0.5 pt-1">
            {agentsList.map((agent) => (
              <button
                key={agent.name}
                onClick={() => setActiveTab('agents')}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-[#12151C] transition group"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: agent.color }}
                  />
                  <span className="truncate group-hover:text-slate-200">{agent.name}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{agent.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Profile & Security Context */}
      <div className="p-3 border-t border-white/[0.06] bg-[#0A0C0E] space-y-2">
        {/* User Isolation Switcher */}
        <div className="flex items-center justify-between bg-[#12151C] p-2 rounded-xl border border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[11px] text-amber-300">
              <User className="h-3 w-3" />
            </div>
            <div className="text-left">
              <div className="text-[11px] font-semibold text-white">
                {activeUser === 'owner' ? 'Түвшинжаргал (Owner)' : 'Найз (Friend)'}
              </div>
              <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
                <Lock className="h-2.5 w-2.5 text-emerald-400" />
                <span>{activeUser === 'owner' ? 'Admin Access' : 'Isolated Session'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSwitchUser(activeUser === 'owner' ? 'friend' : 'owner')}
            className="px-2 py-0.5 text-[10px] font-mono text-slate-300 hover:text-white bg-[#1A1E29] hover:bg-[#222838] rounded-md border border-white/[0.08] transition"
            title="Switch User Profile"
          >
            {activeUser === 'owner' ? '→ Найз' : '→ Би'}
          </button>
        </div>

        {/* Language & Settings */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center bg-[#12151C] rounded-lg p-0.5 border border-white/[0.06] text-[10px] font-mono">
            <button
              onClick={() => setUiLang('mn')}
              className={`px-2 py-0.5 rounded transition ${
                uiLang === 'mn' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              MN
            </button>
            <button
              onClick={() => setUiLang('en')}
              className={`px-2 py-0.5 rounded transition ${
                uiLang === 'en' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setUiLang('ja')}
              className={`px-2 py-0.5 rounded transition ${
                uiLang === 'ja' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              JA
            </button>
          </div>

          <button
            onClick={() => setActiveTab('settings')}
            className={`p-1.5 rounded-lg transition ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-[#12151C]'
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
