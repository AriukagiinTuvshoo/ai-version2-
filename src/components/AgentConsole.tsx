import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Terminal,
  Calculator,
  FileSearch,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  BookmarkPlus,
  RefreshCw,
  HelpCircle,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AgentResponse, ConversationTurn, LanguageMode } from '../types';

interface AgentConsoleProps {
  uiLang: 'mn' | 'en';
  langMode: LanguageMode;
  setLangMode: (mode: LanguageMode) => void;
  multiAgent: boolean;
  onRefreshData?: () => void;
}

export const AgentConsole: React.FC<AgentConsoleProps> = ({
  uiLang,
  langMode,
  setLangMode,
  multiAgent,
  onRefreshData,
}) => {
  const isMn = uiLang === 'mn';
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [savingReportId, setSavingReportId] = useState<string | null>(null);
  const [savingMemoryId, setSavingMemoryId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, isLoading]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCommand = async (rawCmd: string): Promise<boolean> => {
    const cmd = rawCmd.trim();

    if (cmd === '/lang mn') {
      setLangMode('mn');
      showNotification(isMn ? 'Хариултын хэл: Монгол' : 'Language set to Mongolian');
      return true;
    }
    if (cmd === '/lang en') {
      setLangMode('en');
      showNotification(isMn ? 'Хариултын хэл: Англи' : 'Language set to English');
      return true;
    }
    if (cmd === '/lang auto') {
      setLangMode('auto');
      showNotification(isMn ? 'Хэл: Автомат горим' : 'Language set to Auto detect');
      return true;
    }
    if (cmd === 'шинэ яриа' || cmd.toLowerCase() === '/clear') {
      setTurns([]);
      showNotification(isMn ? 'Одоогийн ярианы түүх цэвэрлэгдлээ.' : 'Conversation history cleared.');
      return true;
    }
    if (cmd === '/files') {
      try {
        const res = await fetch('/api/knowledge');
        const files: { name: string }[] = await res.json();
        const fileNames = files.map((f) => f.name).join(', ') || '(none)';
        const fakeResp: AgentResponse = {
          answer: isMn
            ? `knowledge/ хавтас дахь файлууд:\n${files.map((f) => `• \`${f.name}\``).join('\n')}`
            : `Files under knowledge/ folder:\n${files.map((f) => `• \`${f.name}\``).join('\n')}`,
          model: 'LOCAL_FILE_SYSTEM',
          status: 'PASS',
          language: isMn ? 'mn' : 'en',
        };
        setTurns((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString(),
            userText: cmd,
            response: fakeResp,
          },
        ]);
        return true;
      } catch (err) {
        showNotification('Failed to list files');
      }
    }
    if (cmd === '/ой') {
      try {
        const res = await fetch('/api/memories');
        const data = await res.json();
        const kvList = data.kv_memories || [];
        const content =
          kvList.length > 0
            ? kvList.map((m: any) => `• **${m.key}**: ${m.value}`).join('\n')
            : isMn
            ? 'Санах ой одоогоор хоосон байна.'
            : 'Key-value memory is currently empty.';
        setTurns((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString(),
            userText: cmd,
            response: {
              answer: content,
              model: 'LOCAL_SQLITE_KV_STORE',
              status: 'PASS',
              language: isMn ? 'mn' : 'en',
            },
          },
        ]);
        return true;
      } catch {
        showNotification('Failed to read memory');
      }
    }
    if (cmd.startsWith('/санах ')) {
      const parts = cmd.split(/\s+/);
      if (parts.length >= 3) {
        const key = parts[1];
        const val = parts.slice(2).join(' ');
        try {
          await fetch('/api/memories/kv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value: val }),
          });
          onRefreshData?.();
          setTurns((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              timestamp: new Date().toLocaleTimeString(),
              userText: cmd,
              response: {
                answer: isMn
                  ? `Санах ойд хадгаллаа: \`${key}\` = "${val}"`
                  : `Saved to memory: \`${key}\` = "${val}"`,
                model: 'LOCAL_SQLITE_KV_STORE',
                status: 'PASS',
                language: isMn ? 'mn' : 'en',
              },
            },
          ]);
          return true;
        } catch {
          showNotification('Failed to save memory');
        }
      }
    }
    if (cmd.startsWith('/мартах ')) {
      const key = cmd.replace('/мартах ', '').trim();
      if (key) {
        try {
          const res = await fetch(`/api/memories/kv/${encodeURIComponent(key)}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          onRefreshData?.();
          setTurns((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              timestamp: new Date().toLocaleTimeString(),
              userText: cmd,
              response: {
                answer: data.success
                  ? isMn
                    ? `Санах ойгоос устгалаа: \`${key}\``
                    : `Deleted from memory: \`${key}\``
                  : isMn
                  ? `"${key}" түлхүүр санах ойд олдсонгүй.`
                  : `Key "${key}" was not found in memory.`,
                model: 'LOCAL_SQLITE_KV_STORE',
                status: 'PASS',
                language: isMn ? 'mn' : 'en',
              },
            },
          ]);
          return true;
        } catch {
          showNotification('Failed to delete memory');
        }
      }
    }
    return false;
  };

  const executeGoal = async (queryText?: string) => {
    const textToRun = (queryText ?? input).trim();
    if (!textToRun || isLoading) return;

    setInput('');

    // Check if it's an explicit slash command
    if (textToRun.startsWith('/') || textToRun === 'шинэ яриа') {
      const handled = await handleCommand(textToRun);
      if (handled) return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_text: textToRun,
          language_override: langMode === 'auto' ? null : langMode,
          multi_agent: multiAgent,
        }),
      });

      const data: AgentResponse = await res.json();

      const newTurn: ConversationTurn = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        userText: textToRun,
        response: data,
      };

      setTurns((prev) => [...prev, newTurn]);
      onRefreshData?.();
    } catch (err: any) {
      const errorTurn: ConversationTurn = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        userText: textToRun,
        response: {
          answer: `Error executing request: ${err.message}`,
          model: 'AGENT_ERROR',
          status: 'FAIL',
          language: isMn ? 'mn' : 'en',
        },
      };
      setTurns((prev) => [...prev, errorTurn]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveReport = async (turn: ConversationTurn) => {
    setSavingReportId(turn.id);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_text: turn.userText,
          answer: turn.response.answer,
          model: turn.response.model,
          status: turn.response.status,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(
          isMn
            ? `Тайлан reports/${data.filename} файлд амжилттай хадгалагдлаа!`
            : `Report saved to reports/${data.filename} successfully!`
        );
        setTurns((prev) =>
          prev.map((t) => (t.id === turn.id ? { ...t, savedToReport: true } : t))
        );
        onRefreshData?.();
      }
    } catch {
      showNotification('Failed to save report');
    } finally {
      setSavingReportId(null);
    }
  };

  const saveToV4Memory = async (turn: ConversationTurn) => {
    setSavingMemoryId(turn.id);
    try {
      const res = await fetch('/api/memories/v4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_text: turn.userText,
          assistant_text: turn.response.answer,
          language: turn.response.language,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(
          isMn
            ? 'Яриа тусдаа V4 санах ойд (agent_v4_memory) хадгалагдлаа!'
            : 'Conversation saved to separate V4 memory!'
        );
        setTurns((prev) =>
          prev.map((t) => (t.id === turn.id ? { ...t, savedToMemory: true } : t))
        );
        onRefreshData?.();
      }
    } catch {
      showNotification('Failed to save to V4 memory');
    } finally {
      setSavingMemoryId(null);
    }
  };

  const samplePrompts = [
    {
      title: isMn ? 'Локал тооцоолол' : 'Local arithmetic',
      text: 'Calculate 1250 * 24 + 3600',
      icon: <Calculator className="h-3.5 w-3.5 text-emerald-400" />,
      tag: 'PASS (Safe AST)',
    },
    {
      title: isMn ? 'Мэдлэгийн файл унших (MN)' : 'Knowledge Grounding (MN)',
      text: 'ai_engineering_notes.txt файлыг уншаад гол санааг тайлбарла',
      icon: <FileSearch className="h-3.5 w-3.5 text-cyan-400" />,
      tag: 'Grounded .txt',
    },
    {
      title: isMn ? 'Баримтын хураангуй (EN)' : 'Summarize Notes (EN)',
      text: 'Read and summarize ai_engineering_notes.txt in English',
      icon: <FileSearch className="h-3.5 w-3.5 text-indigo-400" />,
      tag: 'English Summary',
    },
    {
      title: isMn ? 'Инженерийн төлөвлөгөө' : 'Study Plan (Non-arithmetic)',
      text: 'Make a 7 day plan with 60 minutes each day',
      icon: <Sparkles className="h-3.5 w-3.5 text-purple-400" />,
      tag: 'AI Reasoning',
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto p-2 sm:p-4 gap-3">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-indigo-900/90 border border-indigo-400/50 text-indigo-100 px-4 py-2.5 rounded-lg shadow-xl text-sm flex items-center gap-2 animate-bounce">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Banner / Safety Notice */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <Shield className="h-4 w-4 text-cyan-400" />
          <span>
            {isMn ? (
              <>
                <strong className="text-white">Аюулгүй байдлын зарчим:</strong> Локал арифметик нь{' '}
                <code className="text-emerald-400 font-mono">PASS</code>, AI хариултууд{' '}
                <code className="text-amber-400 font-mono">NEEDS_REVIEW</code> төлөвтэй байна.
              </>
            ) : (
              <>
                <strong className="text-white">Safety boundary:</strong> Local arithmetic receives{' '}
                <code className="text-emerald-400 font-mono">PASS</code>, AI generation receives{' '}
                <code className="text-amber-400 font-mono">NEEDS_REVIEW</code>.
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
          <span>/lang mn | /lang en | /files | /ой | /шалгах</span>
        </div>
      </div>

      {/* Messages Stream View */}
      <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl overflow-y-auto p-4 space-y-4">
        {turns.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5">
            <div className="h-16 w-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
              <Terminal className="h-8 w-8" />
            </div>

            <div className="max-w-md space-y-2">
              <h2 className="text-lg font-bold text-white">
                {isMn ? 'Autonomous AI Agent V4 Консол' : 'Autonomous AI Agent V4 Console'}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isMn
                  ? 'Зорилгоо бичиж оруулна уу. Локал тооцоолол, knowledge хавтасны бодит файлууд, 3-рөлт multi-agent горим, болон баталгаажсан тайлан бичилт дэмжигдэнэ.'
                  : 'Enter your goal or inquiry. Safe AST arithmetic, grounded knowledge files, optional 3-role multi-agent review, and explicit report generation are supported.'}
              </p>
            </div>

            {/* Quick Test Prompts */}
            <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => executeGoal(p.text)}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 text-left transition-all group"
                >
                  <div className="p-1.5 rounded bg-slate-800 group-hover:bg-indigo-950/50">
                    {p.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                        {p.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{p.tag}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">{p.text}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          turns.map((turn) => {
            const isPass = turn.response.status === 'PASS';
            const isNeedsReview = turn.response.status === 'NEEDS_REVIEW';

            return (
              <div key={turn.id} className="space-y-3 pt-2">
                {/* User Input Bubble */}
                <div className="flex justify-end">
                  <div className="max-w-3xl bg-indigo-600/20 border border-indigo-500/30 rounded-2xl rounded-tr-none px-4 py-2.5 text-slate-100 text-sm shadow-sm">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className="text-[11px] font-mono text-indigo-300 font-medium">
                        Goal / Зорилго:
                      </span>
                      <span className="text-[10px] text-slate-400">{turn.timestamp}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{turn.userText}</p>
                  </div>
                </div>

                {/* Agent Response Card */}
                <div className="flex justify-start">
                  <div className="max-w-3xl w-full bg-slate-900/95 border border-slate-800 rounded-2xl rounded-tl-none p-4 space-y-3 shadow-lg">
                    {/* Header bar with status and model */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        {isPass ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                            <CheckCircle className="h-3 w-3" />
                            PASS
                          </span>
                        ) : isNeedsReview ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
                            <AlertTriangle className="h-3 w-3" />
                            NEEDS_REVIEW
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950/80 text-rose-400 border border-rose-500/40">
                            <XCircle className="h-3 w-3" />
                            FAIL
                          </span>
                        )}

                        <span className="text-xs text-slate-400 font-mono">
                          Executor: <strong className="text-slate-200">{turn.response.model}</strong>
                        </span>

                        {turn.response.grounded_file && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                            File: {turn.response.grounded_file}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        Lang: {turn.response.language}
                      </span>
                    </div>

                    {/* Result Content */}
                    <div className="text-slate-100 text-sm whitespace-pre-wrap leading-relaxed font-sans bg-slate-950/50 p-3 rounded-lg border border-slate-850">
                      {turn.response.answer}
                    </div>

                    {/* Verification info note */}
                    <div className="text-[11px] text-slate-400 font-mono bg-slate-950/30 px-3 py-1.5 rounded border border-slate-850 flex items-center justify-between">
                      <span>
                        [VERIFY] {turn.response.status} —{' '}
                        {isPass
                          ? isMn
                            ? 'Локал тооцоолол амжилттай шалгагдлаа.'
                            : 'Local arithmetic was computed and verified.'
                          : isNeedsReview
                          ? isMn
                            ? 'AI загварын хариулт; бие даасан код гүйцэтгэл биш тул хяналт шаардлагатай.'
                            : 'This is not an independent execution of code; review recommended.'
                          : isMn
                          ? 'Хүсэлт бүрэн гүйцэтгэгдсэнгүй.'
                          : 'Request did not complete successfully.'}
                      </span>
                    </div>

                    {/* Action consent buttons (as per V4 specification) */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => saveReport(turn)}
                        disabled={turn.savedToReport || savingReportId === turn.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          turn.savedToReport
                            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 cursor-default'
                            : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200'
                        }`}
                      >
                        <Download className="h-3.5 w-3.5" />
                        {turn.savedToReport
                          ? isMn
                            ? 'Тайланд хадгалагдсан'
                            : 'Saved to reports/'
                          : isMn
                          ? 'Тайланд хадгалах (reports/)'
                          : 'Save to reports/'}
                      </button>

                      <button
                        onClick={() => saveToV4Memory(turn)}
                        disabled={turn.savedToMemory || savingMemoryId === turn.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          turn.savedToMemory
                            ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300 cursor-default'
                            : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200'
                        }`}
                      >
                        <BookmarkPlus className="h-3.5 w-3.5" />
                        {turn.savedToMemory
                          ? isMn
                            ? 'V4 санах ойд хадгалагдсан'
                            : 'Saved to V4 memory'
                          : isMn
                          ? 'V4 санах ойд хадгалах'
                          : 'Save to V4 memory'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 flex items-center gap-3 text-sm text-slate-300 shadow">
              <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
              <span>
                {multiAgent
                  ? isMn
                    ? 'Multi-agent горим: Төлөвлөгч -> Гүйцэтгэгч -> Баталгаажуулагч боловсруулж байна...'
                    : 'Multi-agent workflow: Planner -> Executor -> Verifier in progress...'
                  : isMn
                  ? 'Хүсэлтийг боловсруулж байна...'
                  : 'Processing request with agent safety checks...'}
              </span>
            </div>
          </div>
        )}

        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          executeGoal();
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isMn
                ? 'Goal / Зорилго (жишээ: Calculate 1250 * 24 + 3600 эсвэл /lang mn)...'
                : 'Goal / Request (e.g. Calculate 1250 * 24 + 3600 or /files)...'
            }
            className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition font-sans pr-10"
          />
          <span className="absolute right-3 top-3 text-xs text-slate-500 font-mono">
            {langMode.toUpperCase()}
          </span>
        </div>

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:pointer-events-none text-white px-5 py-3 rounded-xl font-medium text-sm flex items-center gap-2 transition shadow-lg shadow-indigo-600/20"
        >
          <span>{isMn ? 'Ажиллуулах' : 'Run'}</span>
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
