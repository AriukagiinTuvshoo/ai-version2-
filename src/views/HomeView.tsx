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
  Paperclip,
  Activity,
  Plus,
  Play,
  Zap,
  ShieldCheck,
  Cpu,
  Terminal,
  FileText,
  Layers,
  CheckCheck,
} from 'lucide-react';
import { Project, ProjectTask, MemoryItem, AgentDefinition, ViewTab } from '../types';
import { useSpeechAssistant } from '../hooks/useSpeechAssistant';

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [voiceVoiceOut, setVoiceVoiceOut] = useState(true);

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

  const fetchData = () => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((d) => setProjects(d || []))
      .catch(() => {});

    fetch('/api/agents')
      .then((r) => r.json())
      .then((d) => setAgents(d || []))
      .catch(() => {});

    fetch('/api/memory/vault')
      .then((r) => r.json())
      .then((d) => setMemories(d.memories || []))
      .catch(() => {});
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
      console.log('Executing task:', textToRun);
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_text: textToRun,
          language_override: uiLang,
        }),
      });

      const data = await res.json();
      console.log('Result received:', data);
      setLatestResult({
        query: textToRun,
        timestamp: new Date().toLocaleTimeString(),
        ...data,
      });

      // Spoken voice feedback
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

  // Collect unfinished tasks
  const unfinishedTasks: { project: string; task: ProjectTask }[] = [];
  projects.forEach((p) => {
    p.tasks?.forEach((t) => {
      if (t.status !== 'verified') {
        unfinishedTasks.push({ project: p.name, task: t });
      }
    });
  });

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 text-slate-200">
      {/* 1. PRIMARY FOCUS: The Personal AI Command Assistant */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#180f2d] via-[#120b22] to-[#0a0711] border border-[#311f52] rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-mono">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Personal Autonomous AI Assistant</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Spoken voice feedback toggle */}
              <button
                onClick={() => {
                  if (isSpeaking) stopSpeaking();
                  setVoiceVoiceOut(!voiceVoiceOut);
                }}
                className={`p-2 rounded-xl border text-xs transition ${
                  voiceVoiceOut
                    ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                    : 'bg-[#150f24] border-[#291b42] text-slate-500 hover:text-slate-300'
                }`}
                title={voiceVoiceOut ? 'Voice output: ON' : 'Voice output: MUTED'}
              >
                {voiceVoiceOut ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>

              {/* Wake Word indicator */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#140e24] border border-[#2a1a47] text-[11px] font-mono text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Wake: "{isMn ? 'Sain uu' : 'Hey assistant'}"</span>
              </div>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isMn ? 'Юу хийлгэх вэ?' : 'What can I do for you today?'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            {isMn
              ? 'Таны даалгаврыг бодитоор төлөвлөж, файл уншиж, код болон тооцоолол хийж, үр дүнг тестээр шалгана.'
              : 'I understand your requests, retrieve relevant memories, execute safe tools, and verify real outcomes.'}
          </p>

          {/* Wake Word Detected Alert Banner */}
          {wakeWordDetected && (
            <div className="p-3 bg-purple-950/90 border border-purple-400 rounded-xl text-xs text-purple-200 flex items-center gap-2 animate-bounce">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>
                {isMn ? 'Wake word танигдлаа! Сонсож байна...' : 'Wake word detected! Listening...'}
              </span>
            </div>
          )}

          {/* Command Input Box with Mic */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecuteCommand();
            }}
            className="flex flex-col sm:flex-row gap-2 pt-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder={
                  isListening
                    ? isMn
                      ? 'Ярьж байна уу, сонсож байна...'
                      : 'Listening for your command...'
                    : isMn
                    ? 'Зорилго бичих (жишээ: Calculate 1250 * 24 + 3600 эсвэл Төслөө шалга)...'
                    : 'Ask me anything or assign a task (e.g. Calculate 1250 * 24 + 3600)...'
                }
                className={`w-full bg-[#0a0711]/90 border rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-500 outline-none transition font-sans pr-12 shadow-inner ${
                  isListening
                    ? 'border-purple-500 ring-2 ring-purple-500/40 animate-pulse'
                    : 'border-[#332252] focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                }`}
              />

              {/* Mic button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-3.5 top-3.5 p-1.5 rounded-xl transition ${
                  isListening
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 animate-bounce'
                    : 'text-slate-400 hover:text-white hover:bg-[#1f1636]'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={!taskInput.trim() || isProcessing}
              className="px-7 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-purple-600/25 shrink-0"
            >
              <span>{isMn ? 'Ажиллуулах' : 'Execute'}</span>
              <Send className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Voice / Text Command Chips */}
          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            <button
              type="button"
              onClick={() => handleExecuteCommand('Sain uu')}
              className="px-3 py-1.5 rounded-lg bg-[#19112e] hover:bg-[#251944] border border-[#302154] text-slate-300 text-[11px] font-mono transition"
            >
              👋 "Sain uu"
            </button>

            <button
              type="button"
              onClick={() => handleExecuteCommand('Calculate 1250 * 24 + 3600')}
              className="px-3 py-1.5 rounded-lg bg-[#19112e] hover:bg-[#251944] border border-[#302154] text-slate-300 text-[11px] font-mono transition"
            >
              🧮 Calculate 1250 * 24 + 3600
            </button>

            <button
              type="button"
              onClick={() => handleExecuteCommand('Minii toслийг шалга')}
              className="px-3 py-1.5 rounded-lg bg-[#19112e] hover:bg-[#251944] border border-[#302154] text-slate-300 text-[11px] font-mono transition"
            >
              📁 "Minii toслийг шалга"
            </button>

            <button
              type="button"
              onClick={() => handleExecuteCommand('Алдааг нь засаад тест хий')}
              className="px-3 py-1.5 rounded-lg bg-[#19112e] hover:bg-[#251944] border border-[#302154] text-slate-300 text-[11px] font-mono transition"
            >
              ⚡ "Алдааг нь засаад тест хий"
            </button>

            <button
              type="button"
              onClick={() => handleExecuteCommand('ai_engineering_notes.txt файлыг уншаад гол санааг тайлбарла')}
              className="px-3 py-1.5 rounded-lg bg-[#19112e] hover:bg-[#251944] border border-[#302154] text-slate-300 text-[11px] font-mono transition"
            >
              📄 "ai_engineering_notes.txt тайлбарла"
            </button>
          </div>
        </div>
      </div>

      {/* 2. REAL EXECUTION RESULT & TOOL TRACE (Appears immediately after execution) */}
      {isProcessing && (
        <div className="p-6 rounded-2xl bg-[#0e0a1a] border border-[#2a1a47] text-center space-y-3 shadow-xl">
          <div className="flex items-center justify-center gap-2 text-purple-400">
            <span className="h-3 w-3 rounded-full bg-purple-500 animate-ping" />
            <span className="font-mono text-xs">Autonomous Agent reasoning & executing tools...</span>
          </div>
        </div>
      )}

      {latestResult && !isProcessing && (
        <div className="p-6 rounded-2xl bg-[#0e0a1a] border border-[#362259] space-y-4 shadow-2xl animate-in fade-in">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#23173d]">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                  latestResult.status === 'PASS'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                    : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                }`}
              >
                {latestResult.status}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Executor: <strong className="text-white">{latestResult.model}</strong>
              </span>
            </div>

            <span className="text-[10px] text-slate-500 font-mono">
              Executed at {latestResult.timestamp}
            </span>
          </div>

          {/* Real Tools Executed Badge List */}
          {latestResult.executedTools && latestResult.executedTools.length > 0 && (
            <div className="space-y-1.5 bg-[#140e24] p-3 rounded-xl border border-[#261942]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-purple-300 font-semibold">
                Real Tools Executed:
              </div>
              <div className="space-y-1">
                {latestResult.executedTools.map((t: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs font-mono text-slate-300"
                  >
                    <span className="flex items-center gap-1.5 text-cyan-300">
                      <Zap className="h-3.5 w-3.5 text-purple-400" />
                      {t.tool} ({t.target})
                    </span>
                    <span className="text-[11px] text-emerald-400">{t.output}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actual Result Text */}
          <div className="p-4 rounded-xl bg-[#07050d] border border-[#201538] text-xs sm:text-sm text-slate-100 whitespace-pre-wrap leading-relaxed font-sans">
            {latestResult.answer}
          </div>

          <div className="flex justify-end gap-2 text-xs font-mono">
            <button
              onClick={() => onNavigate('chat')}
              className="text-purple-400 hover:text-purple-200 flex items-center gap-1"
            >
              <span>Continue in Full Chat Console</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* 3. CURRENT UNFINISHED WORK & ROADMAP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Unfinished Tasks Card */}
        <div className="lg:col-span-2 bg-[#0d0918] border border-[#1f1633] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1f1633]">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                {isMn ? 'Хийгдэж буй даалгаврууд' : 'Unfinished Tasks & Work in Progress'}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono"
            >
              <span>{isMn ? 'Төслүүд үзэх' : 'View Projects'}</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {unfinishedTasks.slice(0, 4).map(({ project, task }) => (
              <div
                key={task.id}
                className="p-3.5 rounded-xl bg-[#130d22] border border-[#261942] flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                      {task.agent}
                    </span>
                    <span className="text-xs font-semibold text-white truncate">
                      {task.title}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Project: <span className="text-slate-300">{project}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-purple-300 font-semibold">
                    {task.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real Central Memory Snippets */}
        <div className="bg-[#0d0918] border border-[#1f1633] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1f1633]">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                {isMn ? 'Төв Санах Ой' : 'Central Memory'}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('memory')}
              className="text-xs text-purple-400 hover:text-purple-300 font-mono"
            >
              Galaxy ✦
            </button>
          </div>

          <div className="space-y-2">
            {memories.slice(0, 3).map((m) => (
              <div
                key={m.id}
                onClick={() => onNavigate('memory')}
                className="p-3 rounded-xl bg-[#130d22] border border-[#24173e] hover:border-purple-500/30 cursor-pointer transition space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-purple-950 text-purple-300">
                    {m.category}
                  </span>
                </div>
                <div className="text-xs font-semibold text-white truncate">{m.title}</div>
                <p className="text-[11px] text-slate-400 line-clamp-1">{m.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
