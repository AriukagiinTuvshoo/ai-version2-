import React, { useState, useEffect } from 'react';
import {
  Search,
  Command,
  LayoutDashboard,
  Paperclip,
  Brain,
  MessageSquare,
  Milestone,
  Activity,
  ShieldCheck,
  Settings,
  Calculator,
  User,
  X,
  FileText,
  Play,
} from 'lucide-react';
import { ViewTab } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: ViewTab) => void;
  onSwitchUser: (userId: string) => void;
  activeUser: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onSwitchUser,
  activeUser,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    {
      group: 'Navigation',
      items: [
        { id: 'nav-home', label: 'Mission Control (Home)', icon: <LayoutDashboard className="h-4 w-4 text-indigo-400" />, action: () => onSelectTab('home') },
        { id: 'nav-projects', label: 'Paperclip Projects', icon: <Paperclip className="h-4 w-4 text-cyan-400" />, action: () => onSelectTab('projects') },
        { id: 'nav-agents', label: 'AI Agent Mastermind', icon: <Brain className="h-4 w-4 text-purple-400" />, action: () => onSelectTab('agents') },
        { id: 'nav-chat', label: 'Command Chat & Execution', icon: <MessageSquare className="h-4 w-4 text-emerald-400" />, action: () => onSelectTab('chat') },
        { id: 'nav-memory', label: 'Memory & Galaxy Constellation', icon: <Milestone className="h-4 w-4 text-violet-400" />, action: () => onSelectTab('memory') },
        { id: 'nav-activity', label: 'Pipeline Audit Log', icon: <Activity className="h-4 w-4 text-amber-400" />, action: () => onSelectTab('activity') },
        { id: 'nav-diagnostics', label: '7 Acceptance Checks Audit', icon: <ShieldCheck className="h-4 w-4 text-pink-400" />, action: () => onSelectTab('diagnostics') },
        { id: 'nav-settings', label: 'System Settings', icon: <Settings className="h-4 w-4 text-slate-400" />, action: () => onSelectTab('settings') },
      ],
    },
    {
      group: 'Quick Actions',
      items: [
        { id: 'act-test', label: 'Run Automated Acceptance Test Suite', icon: <Play className="h-4 w-4 text-emerald-400" />, action: () => onSelectTab('diagnostics') },
        { id: 'act-calc', label: 'Calculate: 1250 * 24 + 3600 (Safe AST)', icon: <Calculator className="h-4 w-4 text-emerald-400" />, action: () => onSelectTab('chat') },
        { id: 'act-user', label: `Switch User to ${activeUser === 'owner' ? 'Найз (Friend)' : 'Би (Owner)'}`, icon: <User className="h-4 w-4 text-purple-400" />, action: () => onSwitchUser(activeUser === 'owner' ? 'friend' : 'owner') },
        { id: 'act-notes', label: 'Open ai_engineering_notes.txt', icon: <FileText className="h-4 w-4 text-cyan-400" />, action: () => onSelectTab('memory') },
      ],
    },
  ];

  const filtered = commands
    .map((g) => ({
      ...g,
      items: g.items.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      ),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="w-full max-w-xl bg-[#0f0b1a] border border-[#261d3b] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search header */}
        <div className="p-3.5 border-b border-[#261d3b] flex items-center gap-3">
          <Search className="h-4 w-4 text-purple-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none font-sans"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-[#1a1228]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* List of results */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 font-mono">
              No matching commands found
            </div>
          ) : (
            filtered.map((g) => (
              <div key={g.group} className="space-y-1">
                <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  {g.group}
                </div>
                {g.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-[#1f1636] transition text-left"
                  >
                    <div className="p-1 rounded bg-[#160f26] border border-[#2b2046]">
                      {item.icon}
                    </div>
                    <span className="flex-1 font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-[#261d3b] bg-[#0c0816] flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Navigate with arrows or mouse</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
