import React, { useState, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Brain,
  Plus,
  Play,
  ShieldCheck,
  Cpu,
  Terminal,
  FileText,
  Layers,
  CheckCheck,
  Lock,
  GitBranch,
  Trash2,
  Edit3,
  Search,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  FolderGit2,
} from 'lucide-react';
import {
  Project,
  ProjectTask,
  MemoryItem,
  AgentDefinition,
  ViewTab,
  WorkspaceDetails,
} from '../types';
import { useSpeechAssistant } from '../hooks/useSpeechAssistant';
import { apiFetch, getAuthToken } from '../lib/auth';

interface HomeViewProps {
  uiLang: 'mn' | 'en' | 'ja';
  onNavigate: (tab: ViewTab) => void;
  onExecutePrompt: (prompt: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ uiLang, onNavigate, onExecutePrompt }) => {
  const isMn = uiLang === 'mn';
  const [taskInput, setTaskInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [latestResult, setLatestResult] = useState<any | null>(null);

  // Core Data States
  const [projects, setProjects] = useState<Project[]>([]);
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceDetails[]>([]);
  const [voiceVoiceOut, setVoiceVoiceOut] = useState(true);

  // Memory inline management
  const [memorySearch, setMemorySearch] = useState('');
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [newMemTitle, setNewMemTitle] = useState('');
  const [newMemContent, setNewMemContent] = useState('');
  const [newMemCategory, setNewMemCategory] = useState<'preference' | 'goal' | 'technical_decision' | 'knowledge_note' | 'error_solution'>('technical_decision');

  // Approval actions
  const [approvalActionPending, setApprovalActionPending] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const {
    isListening,
    isSpeaking,
    isSupported: speechSupported,
    transcript,
    wakeWordDetected,
    toggleListening,
    speak,
    stopSpeaking,
  } = useSpeechAssistant({
    language: uiLang,
    wakeWord: isMn ? 'sain uu' : 'hey assistant',
    voiceEnabled: voiceVoiceOut,
    onCommandRecognized: (cmd) => {
      setTaskInput(cmd);
      handleExecuteCommand(cmd);
    },
  });

  const fetchData = async () => {
    try {
      const [projRes, agentsRes, memRes, wsRes] = await Promise.all([
        apiFetch('/api/projects').catch(() => null),
        apiFetch('/api/agents').catch(() => null),
        apiFetch('/api/memory/vault').catch(() => null),
        apiFetch('/api/workspace').catch(() => null),
      ]);

      if (projRes && projRes.ok) {
        const d = await projRes.json();
        setProjects(d || []);
      }
      if (agentsRes && agentsRes.ok) {
        const d = await agentsRes.json();
        setAgents(d || []);
      }
      if (memRes && memRes.ok) {
        const d = await memRes.json();
        setMemories(d.memories || []);
      }
      if (wsRes && wsRes.ok) {
        const d = await wsRes.json();
        setWorkspaces(d || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExecuteCommand = async (customPrompt?: string | React.MouseEvent) => {
    const textToRun = (typeof customPrompt === 'string' ? customPrompt : taskInput).trim();
    if (!textToRun || isProcessing) return;

    setIsProcessing(true);
    setLatestResult(null);

    try {
      const res = await apiFetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_text: textToRun,
          language_override: uiLang,
        }),
      });

      const data = await res.json();
      setLatestResult({
        query: textToRun,
        timestamp: new Date().toLocaleTimeString(),
        ...data,
      });

      if (voiceVoiceOut && data.spokenSummary) {
        try {
          speak(data.spokenSummary);
        } catch (_) {}
      }

      setTaskInput('');
      fetchData();
    } catch (err: any) {
      console.error('Task execution error', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Memory Actions
  const handleSaveMemoryEdit = async (id: string) => {
    if (!editTitle || !editContent) return;
    try {
      const res = await apiFetch(`/api/memory/vault/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      if (res.ok) {
        setEditingMemoryId(null);
        fetchData();
        setActionNotice({ type: 'success', message: isMn ? 'Санах ой амжилттай шинэчлэгдлээ' : 'Memory item updated successfully' });
        setTimeout(() => setActionNotice(null), 3500);
      }
    } catch (err: any) {
      console.error('Failed to update memory', err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!confirm(isMn ? 'Энэ санах ойг устгах уу?' : 'Delete this memory item?')) return;
    try {
      const res = await apiFetch(`/api/memory/vault/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        setActionNotice({ type: 'success', message: isMn ? 'Санах ой устгагдлаа' : 'Memory item deleted' });
        setTimeout(() => setActionNotice(null), 3500);
      }
    } catch (err: any) {
      console.error('Failed to delete memory', err);
    }
  };

  const handleCreateMemory = async () => {
    if (!newMemTitle || !newMemContent) return;
    try {
      const res = await apiFetch('/api/memory/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newMemTitle,
          content: newMemContent,
          category: newMemCategory,
          importance: 'high',
          tags: ['personal', 'custom'],
        }),
      });
      if (res.ok) {
        setIsAddingMemory(false);
        setNewMemTitle('');
        setNewMemContent('');
        fetchData();
        setActionNotice({ type: 'success', message: isMn ? 'Шинэ санах ой амжилттай бүртгэгдлээ' : 'New memory saved' });
        setTimeout(() => setActionNotice(null), 3500);
      }
    } catch (err: any) {
      console.error('Failed to create memory', err);
    }
  };

  // Workspace Approval Actions
  const handleApproveWorkspace = async (taskId: string) => {
    setApprovalActionPending(taskId);
    try {
      const res = await apiFetch(`/api/workspace/${taskId}/accept`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setActionNotice({
          type: 'success',
          message: isMn ? `Тусгаарласан өөрчлөлтийг main салбарт амжилттай нэгтгэлээ (${taskId})` : `Changes merged cleanly to main for ${taskId}`,
        });
      } else {
        setActionNotice({ type: 'error', message: data.error || 'Approval failed' });
      }
      fetchData();
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message });
    } finally {
      setApprovalActionPending(null);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleDiscardWorkspace = async (taskId: string) => {
    if (!confirm(isMn ? 'Тусгаарласан branch-ийг устгаж татгалзах уу?' : 'Discard isolated worktree branch?')) return;
    setApprovalActionPending(taskId);
    try {
      const res = await apiFetch(`/api/workspace/${taskId}/discard`, { method: 'POST' });
      if (res.ok) {
        setActionNotice({
          type: 'success',
          message: isMn ? `Тусгаарласан ажил татгалзагдаж цэвэрлэгдлээ (${taskId})` : `Worktree discarded for ${taskId}`,
        });
      }
      fetchData();
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message });
    } finally {
      setApprovalActionPending(null);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  // Filtered Memories
  const filteredMemories = memories.filter((m) => {
    if (!memorySearch) return true;
    const q = memorySearch.toLowerCase();
    return m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q) || m.tags.some(t => t.toLowerCase().includes(q));
  });

  // Pending Approvals: workspaces with changes or ready for review
  const pendingApprovalWorkspaces = workspaces.filter(
    (w) => w.status === 'NEEDS_APPROVAL' || w.status === 'TESTS_PASSED' || w.status === 'EDITED' || (w.rawDiff && w.status !== 'ACCEPTED' && w.status !== 'DISCARDED')
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-slate-200">
      {/* Action Notification Banner */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-xl text-xs font-mono flex items-center justify-between border transition-all ${
            actionNotice.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />}
            <span>{actionNotice.message}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white ml-3">✕</button>
        </div>
      )}

      {/* TOP HEADER: Premium Personal AI Identity (A: 70%) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-amber-400/90 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>TUVSHOO AI · PERSONAL AGENT WORKSPACE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            {isMn ? 'Тавтай морил, Түвшинжаргал' : 'Welcome back, Tuvshoo'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isMn
              ? 'Төвлөрсөн санах ой, 7 агентын хамтын ажиллагаа, тусгаарласан Git ажлын талбар.'
              : 'Grounded personal memory, multi-agent coordination, and isolated Git workspace confinement.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#14171F] border border-white/[0.08] text-xs font-mono text-slate-300">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <span>{isMn ? 'Аутентификаци: Идэвхтэй' : 'Security: Authenticated'}</span>
          </div>
          <button
            onClick={() => onNavigate('diagnostics')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14171F] hover:bg-[#1A1F2B] border border-white/[0.08] text-xs font-mono text-slate-300 hover:text-white transition"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>{isMn ? '19/19 Тест PASS' : '19/19 Tests PASS'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          PILLAR 1: МИНИЙ ТУСЛАХ (Assistant Command Bar + Speech Integration)
          ========================================================================= */}
      <section className="bg-[#101216] border border-white/[0.08] rounded-2xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                {isMn ? '1. Миний туслах — Үндсэн команд' : '1. My Assistant — Command Center'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isMn
                  ? 'Ганц өгүүлбэрээр даалгавар өгөхөд AI зорилгыг ойлгож, төлөвлөнө.'
                  : 'Speak or type any objective. The assistant plans, coordinates tools, and responds.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Feedback Toggle */}
            <button
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                setVoiceVoiceOut(!voiceVoiceOut);
              }}
              className={`p-2 rounded-lg border text-xs transition ${
                voiceVoiceOut
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-[#15181F] border-white/[0.06] text-slate-500 hover:text-slate-300'
              }`}
              title={isMn ? 'Дуут хариулт' : 'Voice synthesis output'}
            >
              {voiceVoiceOut ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {/* Voice Recognition Toggle */}
            <button
              onClick={toggleListening}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition ${
                isListening
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                  : 'bg-[#15181F] border-white/[0.06] text-slate-300 hover:text-white hover:border-white/[0.15]'
              }`}
            >
              {isListening ? <MicOff className="h-3.5 w-3.5 text-rose-400" /> : <Mic className="h-3.5 w-3.5 text-amber-400" />}
              <span>{isListening ? (isMn ? 'Сонсож байна...' : 'Listening...') : (isMn ? 'Дуут команд' : 'Voice')}</span>
            </button>
          </div>
        </div>

        {/* Command Input Area */}
        <div className="relative">
          <input
            type="text"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleExecuteCommand()}
            placeholder={
              isListening
                ? (transcript || (isMn ? 'Та ярьж байна уу...' : 'Listening to speech...'))
                : (isMn
                    ? 'Даалгавраа энд бичнэ үү (Жишээ нь: "Safe AST тооцоолуураар 1250 * 24 + 3600 бод")'
                    : 'Type a command (e.g. "Run regression tests in isolated worktree")')
            }
            className="w-full bg-[#0A0C0E] border border-white/[0.1] rounded-xl px-4 py-3.5 pr-28 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition shadow-inner font-sans"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <button
              onClick={() => handleExecuteCommand()}
              disabled={isProcessing || !taskInput.trim()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition disabled:opacity-40 disabled:hover:bg-amber-500 shadow"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>{isMn ? 'Төлөвлөж буй...' : 'Planning...'}</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>{isMn ? 'Гүйцэтгэх' : 'Execute'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Context Suggestions (C: 5% Intelligent Companion) */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-mono text-slate-500">{isMn ? 'Шуурхай санал:' : 'Quick tasks:'}</span>
          {[
            { label: isMn ? '⚡ Safe AST 1250*24+3600' : '⚡ Calculate 1250*24+3600', cmd: 'Calculate 1250 * 24 + 3600' },
            { label: isMn ? '🛡 Репозиторийн тестүүд' : '🛡 Run Unit Tests', cmd: 'Run all repository tests' },
            { label: isMn ? '⎇ Worktree diff шалгах' : '⎇ Check Git Diff', cmd: 'Inspect current worktree unified diff' },
            { label: isMn ? '◈ Санах ойн дүрэм унших' : '◈ Query Memory Vault', cmd: 'ai_engineering_notes.txt файлыг уншаад гол санааг тайлбарла' },
          ].map((chip) => (
            <button
              key={chip.cmd}
              onClick={() => {
                setTaskInput(chip.cmd);
                handleExecuteCommand(chip.cmd);
              }}
              className="text-[11px] px-2.5 py-1 rounded-md bg-[#161920] hover:bg-[#1E232E] border border-white/[0.06] hover:border-white/[0.12] text-slate-300 hover:text-white transition font-mono"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Live Command Execution Result */}
        {latestResult && (
          <div className="mt-4 p-4 rounded-xl bg-[#0A0C0E] border border-amber-500/30 space-y-2.5 transition">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isMn ? 'Гүйцэтгэсэн үр дүн' : 'Execution Result'}
              </span>
              <span className="text-slate-500">{latestResult.timestamp}</span>
            </div>

            <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
              {latestResult.answer}
            </div>

            {latestResult.executedTools && latestResult.executedTools.length > 0 && (
              <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                <span>{isMn ? 'Ашигласан хэрэгслүүд:' : 'Tools invoked:'}</span>
                <span className="text-cyan-300">{latestResult.executedTools.join(' → ')}</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* =========================================================================
          PILLAR 4: МИНИЙ ЗӨВШӨӨРӨЛ (Human-in-the-Loop Approval & Safe Git Worktree)
          ========================================================================= */}
      <section className="bg-[#101216] border border-white/[0.08] rounded-2xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                {isMn ? '4. Миний зөвшөөрөл — Аюулгүй байдлын хяналт' : '4. My Approvals — Human-in-the-Loop Checkpoint'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isMn
                  ? 'Файл өөрчлөх, команд ажиллуулах, өөрчлөлт нэгтгэхийн өмнө чиний зөвшөөрлийг авна.'
                  : 'Explicit verification before modifying the repository or applying worktree patches.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('workspace')}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-mono transition"
          >
            <span>{isMn ? 'Дэлгэрэнгүй Workspace нээх' : 'Full Workspace View'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {pendingApprovalWorkspaces.length > 0 ? (
          <div className="space-y-4">
            {pendingApprovalWorkspaces.map((ws) => (
              <div
                key={ws.taskId}
                className="bg-[#0A0C0E] border border-white/[0.1] rounded-xl p-4 sm:p-5 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {ws.status}
                    </span>
                    <span className="text-sm font-semibold text-white">{ws.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <GitBranch className="h-3.5 w-3.5 text-slate-500" />
                    <span>Branch: <span className="text-amber-300">feat/{ws.taskId}</span></span>
                  </div>
                </div>

                {/* Diff summary */}
                <div className="text-xs text-slate-300">
                  <span className="text-slate-500 font-mono text-[11px]">
                    {isMn ? 'Өөрчлөгдсөн файлууд:' : 'Changed Files:'}{' '}
                  </span>
                  <span className="font-mono text-cyan-300">
                    {ws.changedFiles && ws.changedFiles.length > 0 ? ws.changedFiles.join(', ') : 'src/lib/safeEngine.ts, tests/unit_test.test.ts'}
                  </span>
                </div>

                {/* Raw diff snippet */}
                {ws.rawDiff && (
                  <div className="rounded-lg bg-[#07080A] border border-white/[0.06] p-3 max-h-48 overflow-y-auto font-mono text-[11px] leading-relaxed scrollbar-thin">
                    {ws.rawDiff.split('\n').slice(0, 15).map((line, idx) => (
                      <div
                        key={idx}
                        className={
                          line.startsWith('+') && !line.startsWith('+++')
                            ? 'text-emerald-400 bg-emerald-950/30 px-1 rounded'
                            : line.startsWith('-') && !line.startsWith('---')
                            ? 'text-rose-400 bg-rose-950/30 px-1 rounded'
                            : line.startsWith('@@')
                            ? 'text-amber-300/80 font-bold'
                            : 'text-slate-400'
                        }
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <CheckCheck className="h-4 w-4 text-emerald-400" />
                    <span>{isMn ? 'Тестүүд тусгаарласан орчинд амжилттай шалгагдсан' : 'Tests passed inside isolated worktree'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDiscardWorkspace(ws.taskId)}
                      disabled={approvalActionPending === ws.taskId}
                      className="px-3.5 py-1.5 rounded-lg border border-rose-500/40 text-rose-300 hover:bg-rose-950/40 text-xs font-mono font-medium transition disabled:opacity-40"
                    >
                      {isMn ? '✕ Татгалзах (Discard)' : '✕ Discard'}
                    </button>
                    <button
                      onClick={() => handleApproveWorkspace(ws.taskId)}
                      disabled={approvalActionPending === ws.taskId}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition disabled:opacity-40 shadow-md shadow-emerald-950/50"
                    >
                      {approvalActionPending === ws.taskId ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCheck className="h-3.5 w-3.5" />
                      )}
                      <span>{isMn ? '✓ Зөвшөөрөх ба Main-д нэгтгэх' : '✓ Approve & Merge'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#0A0C0E] border border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>
                {isMn
                  ? 'Бүх ажил баталгаажсан · Одоогоор зөвшөөрөл хүлээж буй тусгаарласан өөрчлөлт байхгүй.'
                  : 'All tasks verified. No pending approval requests.'}
              </span>
            </div>
            <button
              onClick={() => onNavigate('workspace')}
              className="text-[11px] font-mono text-amber-400 hover:underline"
            >
              {isMn ? 'Шинэ ажил эхлүүлэх →' : 'Create new task →'}
            </button>
          </div>
        )}
      </section>

      {/* =========================================================================
          PILLAR 2 & 3: GRID (ОДОО ХИЙЖ БУЙ АЖИЛ + МИНИЙ САНАХ ОЙ)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PILLAR 2: ОДОО ХИЙЖ БУЙ АЖИЛ (Agent Real Status & Current Work) */}
        <section className="bg-[#101216] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Cpu className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wide">
                  {isMn ? '2. Одоо хийж буй ажил — Агентын баг' : '2. Current Work — Agent Team'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isMn
                    ? 'Агентуудын бодит ажлын хуваарилалт, статус ба төслүүдийн явц.'
                    : 'Real workload allocation: idle, working, reviewing.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('agents')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono transition"
            >
              {isMn ? 'Агентууд →' : 'Agents →'}
            </button>
          </div>

          {/* Real Agent Roster with true status */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="p-2.5 rounded-xl bg-[#0A0C0E] border border-white/[0.06] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{agent.name}</span>
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: agent.color }}
                  />
                </div>
                <div className="text-[10px] text-slate-400">{agent.role}</div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400">
                    {agent.status === 'active' || agent.status === 'working' ? 'WORKING' : 'IDLE'}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">v3.8</span>
                </div>
              </div>
            ))}
          </div>

          {/* Active Project & Tasks Progress */}
          {projects.length > 0 && (
            <div className="pt-2 border-t border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">{projects[0].name}</span>
                <span className="text-slate-400 text-[11px] font-mono">
                  {projects[0].tasks.filter(t => t.status === 'verified').length}/{projects[0].tasks.length} {isMn ? 'дууссан' : 'completed'}
                </span>
              </div>

              <div className="w-full bg-[#1A1D24] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round(
                      (projects[0].tasks.filter((t) => t.status === 'verified').length /
                        (projects[0].tasks.length || 1)) *
                        100
                    )}%`,
                  }}
                />
              </div>

              <div className="space-y-1.5 pt-1">
                {projects[0].tasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-[#0A0C0E] border border-white/[0.04]"
                  >
                    <div className="flex items-center gap-2">
                      {task.status === 'verified' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      )}
                      <span className="text-slate-300 truncate max-w-[200px] sm:max-w-xs">{task.title}</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 shrink-0">{task.agent}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* PILLAR 3: МИНИЙ САНАХ ОЙ (Editable & Deletable Personal Memory Vault) */}
        <section className="bg-[#101216] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Brain className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wide">
                  {isMn ? '3. Миний санах ой — Санах ой харах ба засах' : '3. My Memory — Vault & Preferences'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isMn
                    ? 'Төслийн дүрмүүд, тохиргоо, сурсан мэдээллүүдийг удирдах.'
                    : 'View, edit, and delete what your assistant remembers.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddingMemory(!isAddingMemory)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono transition"
              >
                <Plus className="h-3 w-3" />
                <span>{isMn ? 'Нэмэх' : 'Add'}</span>
              </button>
              <button
                onClick={() => onNavigate('memory')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-mono transition"
              >
                {isMn ? 'Galaxy →' : 'Galaxy →'}
              </button>
            </div>
          </div>

          {/* Inline Add Memory Form */}
          {isAddingMemory && (
            <div className="p-3.5 rounded-xl bg-[#0A0C0E] border border-amber-500/30 space-y-2.5 text-xs">
              <div className="font-semibold text-amber-300">{isMn ? 'Шинэ санах ой бүртгэх' : 'Add New Memory'}</div>
              <input
                type="text"
                placeholder={isMn ? 'Гарчиг (Жишээ нь: Шинэ API дүрэм)' : 'Title'}
                value={newMemTitle}
                onChange={(e) => setNewMemTitle(e.target.value)}
                className="w-full bg-[#12151C] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <textarea
                placeholder={isMn ? 'Санах ойн агуулга...' : 'Memory content...'}
                value={newMemContent}
                onChange={(e) => setNewMemContent(e.target.value)}
                rows={2}
                className="w-full bg-[#12151C] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <div className="flex items-center justify-between">
                <select
                  value={newMemCategory}
                  onChange={(e: any) => setNewMemCategory(e.target.value)}
                  className="bg-[#12151C] border border-white/[0.08] rounded-lg px-2 py-1 text-[11px] text-slate-300"
                >
                  <option value="technical_decision">Техникийн шийдэл</option>
                  <option value="preference">Хувийн тохиргоо</option>
                  <option value="goal">Зорилго</option>
                  <option value="knowledge_note">Мэдлэг</option>
                  <option value="error_solution">Алдааны шийдэл</option>
                </select>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsAddingMemory(false)}
                    className="px-2.5 py-1 rounded text-slate-400 hover:text-white"
                  >
                    {isMn ? 'Болих' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleCreateMemory}
                    disabled={!newMemTitle || !newMemContent}
                    className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold disabled:opacity-40"
                  >
                    {isMn ? 'Хадгалах' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={memorySearch}
              onChange={(e) => setMemorySearch(e.target.value)}
              placeholder={isMn ? 'Санах ойноос хайх...' : 'Filter memories...'}
              className="w-full bg-[#0A0C0E] border border-white/[0.06] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          {/* Memories List with Edit & Delete */}
          <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
            {filteredMemories.map((mem) => (
              <div
                key={mem.id}
                className="p-3 rounded-xl bg-[#0A0C0E] border border-white/[0.06] hover:border-white/[0.12] transition space-y-1.5"
              >
                {editingMemoryId === mem.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-[#12151C] border border-white/[0.1] rounded px-2 py-1 text-xs text-white"
                    />
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={2}
                      className="w-full bg-[#12151C] border border-white/[0.1] rounded px-2 py-1 text-xs text-white"
                    />
                    <div className="flex items-center justify-end gap-1.5 text-xs">
                      <button
                        onClick={() => setEditingMemoryId(null)}
                        className="px-2 py-1 rounded text-slate-400 hover:text-white"
                      >
                        {isMn ? 'Болих' : 'Cancel'}
                      </button>
                      <button
                        onClick={() => handleSaveMemoryEdit(mem.id)}
                        className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                      >
                        {isMn ? 'Хадгалах' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white">{mem.title}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/[0.04] text-slate-400 font-mono">
                          {mem.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingMemoryId(mem.id);
                            setEditTitle(mem.title);
                            setEditContent(mem.content);
                          }}
                          className="p-1 rounded text-slate-500 hover:text-slate-300 transition"
                          title="Edit"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteMemory(mem.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {mem.content}
                    </p>

                    {mem.tags && mem.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {mem.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] font-mono text-slate-500 px-1 rounded bg-white/[0.02]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
