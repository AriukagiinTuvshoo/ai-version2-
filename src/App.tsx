import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { CommandPalette } from './components/CommandPalette';
import { HomeView } from './views/HomeView';
import { ChatView } from './views/ChatView';
import { ProjectsView } from './views/ProjectsView';
import { AgentsView } from './views/AgentsView';
import { MemoryView } from './views/MemoryView';
import { ActivityView } from './views/ActivityView';
import { SettingsView } from './views/SettingsView';
import { CodingWorkspaceView } from './views/CodingWorkspaceView';
import { DiagnosticsTestSuite } from './components/DiagnosticsTestSuite';
import { ViewTab, UserProfile } from './types';
import { ensureAuth, apiFetch } from './lib/auth';
import {
  LayoutDashboard,
  MessageSquare,
  Code2,
  Milestone,
  FolderKanban,
  ShieldCheck,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('home');
  const [uiLang, setUiLang] = useState<'mn' | 'en' | 'ja'>('mn');
  const [activeUser, setActiveUser] = useState<string>('owner');
  const [users, setUsers] = useState<UserProfile[]>([
    { id: 'owner', name: 'Би (Owner)', role: 'admin', email: 'owner@personalai.local', avatarColor: '#F59E0B' },
    { id: 'friend', name: 'Найз (Friend)', role: 'user', email: 'friend@personalai.local', avatarColor: '#38BDF8' },
  ]);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);

  // Initial authentication & store load
  useEffect(() => {
    async function init() {
      await ensureAuth();
      try {
        const res = await apiFetch('/api/store');
        if (res.ok) {
          const data = await res.json();
          if (data.users) setUsers(data.users);
          if (data.activeUserId) setActiveUser(data.activeUserId);
          if (data.settings?.offlineMode !== undefined) setOfflineMode(data.settings.offlineMode);
        }
      } catch (err) {
        console.warn('Store load failed', err);
      }
    }
    init();
  }, []);

  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await apiFetch('/api/store/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveUser(userId);
      }
    } catch (err) {
      console.error('Failed to switch user', err);
    }
  };

  const handleRunQueryWithFile = (filename: string, summarize: boolean) => {
    setActiveTab('chat');
    const prompt = summarize
      ? uiLang === 'mn'
        ? `${filename} файлыг уншаад гол санааг тайлбарла`
        : `Read and summarize ${filename} in English`
      : uiLang === 'mn'
      ? `${filename} файлын талаар мэдээлэл өгнө үү`
      : `Provide information regarding ${filename}`;
    setInitialPrompt(prompt);
  };

  const handleExecutePromptFromHome = (prompt: string) => {
    setActiveTab('chat');
    setInitialPrompt(prompt);
  };

  const mobileTabs: { id: ViewTab; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: uiLang === 'mn' ? 'Өнөөдөр' : 'Home', icon: LayoutDashboard },
    { id: 'chat', label: uiLang === 'mn' ? 'Туслах' : 'Chat', icon: MessageSquare },
    { id: 'workspace', label: 'Workspace', icon: Code2 },
    { id: 'memory', label: uiLang === 'mn' ? 'Санах ой' : 'Memory', icon: Milestone },
    { id: 'projects', label: uiLang === 'mn' ? 'Төслүүд' : 'Projects', icon: FolderKanban },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#07080A] text-slate-100 font-sans">
      {/* ⌘K Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsCommandPaletteOpen(false);
        }}
        onSwitchUser={handleSwitchUser}
        activeUser={activeUser}
      />

      {/* Left Navigation Sidebar (Desktop) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        uiLang={uiLang}
        setUiLang={setUiLang}
        activeUser={activeUser}
        onSwitchUser={handleSwitchUser}
        users={users}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0B0D11]">
        {/* Dynamic Top Navigation Header */}
        <TopNav
          activeTab={activeTab}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          uiLang={uiLang}
          offlineMode={offlineMode}
          onNavigate={setActiveTab}
        />

        {/* View Content Body */}
        <main className="flex-1 overflow-y-auto scrollbar-thin pb-16 md:pb-4">
          {activeTab === 'home' && (
            <HomeView
              uiLang={uiLang}
              onNavigate={setActiveTab}
              onExecutePrompt={handleExecutePromptFromHome}
            />
          )}

          {activeTab === 'chat' && (
            <ChatView
              uiLang={uiLang}
              initialPrompt={initialPrompt}
              onClearInitialPrompt={() => setInitialPrompt(null)}
            />
          )}

          {activeTab === 'projects' && <ProjectsView uiLang={uiLang} />}

          {activeTab === 'agents' && <AgentsView uiLang={uiLang} />}

          {activeTab === 'memory' && (
            <MemoryView
              uiLang={uiLang}
              onRunQueryWithFile={handleRunQueryWithFile}
            />
          )}

          {activeTab === 'workspace' && <CodingWorkspaceView uiLang={uiLang} />}

          {activeTab === 'activity' && <ActivityView uiLang={uiLang} />}

          {activeTab === 'diagnostics' && <DiagnosticsTestSuite uiLang={uiLang === 'ja' ? 'en' : uiLang} />}

          {activeTab === 'settings' && (
            <SettingsView
              uiLang={uiLang}
              activeUser={activeUser}
              onSwitchUser={handleSwitchUser}
              users={users}
            />
          )}
        </main>

        {/* Mobile Bottom Thumb-Zone Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0D11]/95 backdrop-blur-md border-t border-white/[0.08] px-2 py-1.5 flex justify-around items-center">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-mono transition ${
                  isActive
                    ? 'text-amber-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
