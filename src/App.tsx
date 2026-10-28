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

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('home');
  const [uiLang, setUiLang] = useState<'mn' | 'en' | 'ja'>('mn');
  const [activeUser, setActiveUser] = useState<string>('owner');
  const [users, setUsers] = useState<UserProfile[]>([
    { id: 'owner', name: 'Би (Owner)', role: 'admin', email: 'owner@personalai.local', avatarColor: '#8B5CF6' },
    { id: 'friend', name: 'Найз (Friend)', role: 'user', email: 'friend@personalai.local', avatarColor: '#EC4899' },
  ]);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    fetch('/api/store')
      .then((r) => r.json())
      .then((data) => {
        if (data.users) setUsers(data.users);
        if (data.activeUserId) setActiveUser(data.activeUserId);
        if (data.settings?.offlineMode !== undefined) setOfflineMode(data.settings.offlineMode);
      })
      .catch(() => {});
  }, []);

  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await fetch('/api/store/switch-user', {
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#07050d] text-slate-100 font-sans">
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

      {/* Left Navigation Sidebar */}
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
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0711]">
        {/* Dynamic Top Navigation Header */}
        <TopNav
          activeTab={activeTab}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          uiLang={uiLang}
          offlineMode={offlineMode}
        />

        {/* View Content Body */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
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
      </div>
    </div>
  );
}
