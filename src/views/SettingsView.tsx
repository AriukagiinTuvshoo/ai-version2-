import React, { useState, useEffect } from 'react';
import {
  Settings,
  Cpu,
  Database,
  Shield,
  DollarSign,
  User,
  Volume2,
  Download,
  Trash2,
  Check,
  CheckCircle2,
  WifiOff,
  Wifi,
} from 'lucide-react';
import { SystemSettings, UserProfile } from '../types';

interface SettingsViewProps {
  uiLang: 'mn' | 'en' | 'ja';
  activeUser: string;
  onSwitchUser: (userId: string) => void;
  users: UserProfile[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  uiLang,
  activeUser,
  onSwitchUser,
  users,
}) => {
  const isMn = uiLang === 'mn';
  const [settings, setSettings] = useState<SystemSettings>({
    primaryModel: 'gemini-3.8-flash',
    fallbackModel: 'gemini-3.1-flash-lite',
    offlineMode: false,
    autoReview: true,
    maxFileBytes: 500000,
    monthlyBudgetUSD: 20,
    spentBudgetUSD: 1.45,
    voiceEnabled: true,
    voiceLanguage: 'mn-MN',
    strictVerification: true,
  });
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    fetch('/api/store')
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => {});
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 2500);
      }
    } catch (err) {
      console.error('Error saving settings', err);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await fetch('/api/store');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personal_ai_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 text-slate-200">
      {/* Top Banner */}
      <div className="bg-[#0e0a1a] border border-[#23173d] rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">
              {isMn ? 'Системийн Тохиргоо (Settings)' : 'System Settings & Infrastructure'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            {isMn
              ? 'AI загвар, төхөөрөмжийн эрх, хэрэглэгчийн өгөгдлийн тусгаарлалт, болон төсөв/зардлын удирдлага.'
              : 'Configure Gemini models, offline fallback switches, budget caps, and multi-user isolation.'}
          </p>
        </div>

        {savedMsg && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
            <CheckCircle2 className="h-4 w-4" />
            <span>Settings Saved</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-5">
        {/* Section 1: AI Model Settings & Offline switch */}
        <div className="p-5 rounded-2xl bg-[#0d0918] border border-[#201538] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#201538]">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                {isMn ? 'AI Загвар ба Холболт' : 'AI Models & Gateway'}
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">@google/genai</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400">Primary Model (Үндсэн загвар)</label>
              <select
                value={settings.primaryModel}
                onChange={(e) => setSettings({ ...settings, primaryModel: e.target.value })}
                className="w-full bg-[#0a0711] border border-[#261942] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast & light)</option>
                <option value="ollama-local">Ollama / Local LLM (Phase 7)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400">Fallback Model (Нөөц загвар)</label>
              <input
                type="text"
                value={settings.fallbackModel}
                onChange={(e) => setSettings({ ...settings, fallbackModel: e.target.value })}
                className="w-full bg-[#0a0711] border border-[#261942] rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
              />
            </div>
          </div>

          {/* Offline Mode Toggle (Section 8 Phase 7) */}
          <div className="p-3.5 rounded-xl bg-[#130d22] border border-[#24173e] flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                {settings.offlineMode ? (
                  <WifiOff className="h-4 w-4 text-amber-400" />
                ) : (
                  <Wifi className="h-4 w-4 text-emerald-400" />
                )}
                <span>{isMn ? 'Офлайн горим (Offline Mode)' : 'Offline Execution Mode'}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isMn
                  ? 'Интернетгүй үед локал тооцоолуур, баримтын хайлт, санах ойгоор ажиллана.'
                  : 'Operate strictly via local AST engine, file vault, and cached memory when offline.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSettings({ ...settings, offlineMode: !settings.offlineMode })}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                settings.offlineMode
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-700'
              }`}
            >
              {settings.offlineMode ? 'OFFLINE' : 'ONLINE'}
            </button>
          </div>
        </div>

        {/* Section 2: User Profile Isolation (Section 6 & 11) */}
        <div className="p-5 rounded-2xl bg-[#0d0918] border border-[#201538] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#201538]">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-pink-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                {isMn ? 'Хэрэглэгчийн Өгөгдлийн Тусгаарлалт' : 'User Privacy & Isolation'}
              </h3>
            </div>
            <span className="text-[10px] text-purple-300 font-mono">Role: Multi-User Safe</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#130d22] border border-[#24173e] flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-bold text-white">
                {isMn
                  ? `Одоогийн идэвхтэй хэрэглэгч: ${activeUser === 'owner' ? 'Би (Owner)' : 'Найз (Friend)'}`
                  : `Active Session: ${activeUser === 'owner' ? 'Owner (Би)' : 'Friend (Найз)'}`}
              </div>
              <p className="text-[11px] text-slate-400">
                {isMn
                  ? 'Найздаа нэвтрэх эрх өгөхөд хувийн санах ой болон төслүүдийг тусгаарлана.'
                  : 'Personal projects and private memories remain separated between users.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSwitchUser(activeUser === 'owner' ? 'friend' : 'owner')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-medium transition"
            >
              {activeUser === 'owner' ? 'Найз руу шилжих' : 'Би (Owner) руу шилжих'}
            </button>
          </div>
        </div>

        {/* Section 3: Cost and Budget Cap (Section 10) */}
        <div className="p-5 rounded-2xl bg-[#0d0918] border border-[#201538] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#201538]">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                {isMn ? 'Зардал ба Хэрэглээний Хязгаар' : 'API Budget & Cost Guardrails'}
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">
              ${settings.spentBudgetUSD} / ${settings.monthlyBudgetUSD} USD
            </span>
          </div>

          <div className="space-y-2">
            <div className="h-2 w-full bg-[#18102a] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${(settings.spentBudgetUSD / settings.monthlyBudgetUSD) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {isMn
                ? 'Зардал хэмнэх үүднээс энгийн тооцооллыг локал AST тооцоолуураар 0 төгрөгөөр гүйцэтгэнэ.'
                : 'Free tier conservation: arithmetic runs locally without incurring API tokens.'}
            </p>
          </div>
        </div>

        {/* Section 4: Data Backup & Export */}
        <div className="p-5 rounded-2xl bg-[#0d0918] border border-[#201538] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#201538]">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                {isMn ? 'Өгөгдөл Нөөцлөх ба Экспорт' : 'Backup & Data Export'}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              {isMn
                ? 'Төв санах ой, төслүүд, даалгаврууд болон аудитын түүхийг бүрэн JSON хэлбэрээр татах.'
                : 'Download snapshot of memories, project roadmap, and audit events.'}
            </p>

            <button
              type="button"
              onClick={handleExportData}
              className="flex items-center gap-2 px-4 py-2 bg-[#170f2b] hover:bg-[#231742] border border-[#2e1f4e] text-purple-200 rounded-xl text-xs font-medium transition"
            >
              <Download className="h-4 w-4" />
              <span>{isMn ? 'Бүрэн өгөгдөл экспортлох' : 'Export JSON Backup'}</span>
            </button>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition shadow-lg shadow-purple-600/25"
          >
            {isMn ? 'Тохиргоо хадгалах' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
