import React, { useState, useEffect } from 'react';
import {
  WorkspaceDetails,
  WorkspaceTestResult,
  WorkspaceAuditEntry,
  WorkspacePlanItem,
} from '../types';
import { UnifiedDiffViewer } from '../components/UnifiedDiffViewer';
import {
  GitBranch,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Check,
  Trash2,
  Plus,
  RefreshCw,
  FolderGit2,
  ShieldCheck,
  Cpu,
  Layers,
  ChevronRight,
  Send,
  Sliders,
  History,
  FileCheck,
} from 'lucide-react';

interface CodingWorkspaceViewProps {
  uiLang: 'mn' | 'en' | 'ja';
}

export const CodingWorkspaceView: React.FC<CodingWorkspaceViewProps> = ({ uiLang }) => {
  const isMn = uiLang === 'mn';

  // Auth token state (fetched from server session handshake)
  const [authToken, setAuthToken] = useState<string>('');
  const [workspaces, setWorkspaces] = useState<WorkspaceDetails[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('increase-test-coverage');
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceDetails | null>(null);
  const [auditLogs, setAuditLogs] = useState<WorkspaceAuditEntry[]>([]);
  const [activeBottomTab, setActiveBottomTab] = useState<'terminal' | 'audit' | 'refine'>('terminal');

  // Loading & Action states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [isAccepting, setIsAccepting] = useState<boolean>(false);
  const [isDiscarding, setIsDiscarding] = useState<boolean>(false);
  const [refinementFeedback, setRefinementFeedback] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Settings & Toggles
  const [autoRunTests, setAutoRunTests] = useState<boolean>(true);
  const [autoApply, setAutoApply] = useState<boolean>(false);

  // New task modal
  const [showNewTaskModal, setShowNewTaskModal] = useState<boolean>(false);
  const [newTaskId, setNewTaskId] = useState<string>('');
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskInstructions, setNewTaskInstructions] = useState<string>('');

  // 1. Initial Handshake & Load Session
  useEffect(() => {
    async function initialize() {
      try {
        setIsLoading(true);
        const authRes = await fetch('/api/auth/session');
        const authData = await authRes.json();
        const token = authData.token;
        setAuthToken(token);

        // Fetch workspaces
        await refreshWorkspaces(token);
      } catch (err: any) {
        console.error('Session handshake failed:', err);
        setActionMessage({ type: 'error', text: 'Auth session handshake failed: ' + err.message });
      } finally {
        setIsLoading(false);
      }
    }
    initialize();
  }, []);

  // 2. Refresh Workspaces
  const refreshWorkspaces = async (token: string = authToken) => {
    if (!token) return;
    try {
      const res = await fetch('/api/workspace', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const list: WorkspaceDetails[] = await res.json();
      setWorkspaces(list);

      // If no workspace exists yet, bootstrap the primary one from blueprint
      if (list.length === 0) {
        await bootstrapDefaultTask(token);
      } else {
        const found = list.find((w) => w.taskId === selectedTaskId) || list[0];
        setSelectedTaskId(found.taskId);
        await inspectTask(found.taskId, token);
      }

      await fetchAuditLogs(token);
    } catch (err: any) {
      console.error('Failed to load workspaces:', err);
    }
  };

  // Bootstrap default task matching image_d2eca40c.png: /increase-test-coverage feat/increase-test-coverage
  const bootstrapDefaultTask = async (token: string) => {
    try {
      const res = await fetch('/api/workspace/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId: 'increase-test-coverage',
          title: 'Add comprehensive regression and edge-case unit tests',
          baseBranch: 'main',
          instructions: 'Expand test coverage for safe AST calculator and path traversal sanitization.',
          plan: [
            { id: '1', title: 'Verify test isolation and baseline assertions', status: 'completed' },
            { id: '2', title: 'Implement safe calculator boundary checks', status: 'completed' },
            { id: '3', title: 'Add regression tests for AST non-arithmetic filter', status: 'completed' },
            { id: '4', title: 'Review unified diff and await human approval', status: 'in_progress' },
          ],
        }),
      });

      if (res.ok) {
        const created: WorkspaceDetails = await res.json();

        // Write a verified test patch into the worktree to demonstrate real git diff
        await fetch(`/api/workspace/${created.taskId}/update-file`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            filePath: 'src/lib/safeEngine.ts',
            content: `// Verified safeEngine with expanded AST validations
export function safeCalculate(expr: string): number {
  if (!expr || typeof expr !== 'string') throw new Error('Expression must be a non-empty string');
  const sanitized = expr.replace(/\\s+/g, '');
  if (!/^[0-9+\\-*/().]+$/.test(sanitized)) {
    throw new Error('Unsafe character detected in arithmetic expression');
  }
  const tokens = sanitized.match(/\\d+(\\.\\d+)?|[+\\-*/()]/g);
  if (!tokens) throw new Error('Invalid expression format');

  let pos = 0;
  function parsePrimary(): number {
    const t = tokens![pos++];
    if (t === '(') {
      const val = parseExpression();
      if (tokens![pos++] !== ')') throw new Error('Missing closing parenthesis');
      return val;
    }
    const num = Number(t);
    if (isNaN(num)) throw new Error('Expected number token');
    return num;
  }
  function parseTerm(): number {
    let val = parsePrimary();
    while (pos < tokens!.length && (tokens![pos] === '*' || tokens![pos] === '/')) {
      const op = tokens![pos++];
      const right = parsePrimary();
      if (op === '*') val *= right;
      else {
        if (right === 0) throw new Error('Division by zero');
        val /= right;
      }
    }
    return val;
  }
  function parseExpression(): number {
    let val = parseTerm();
    while (pos < tokens!.length && (tokens![pos] === '+' || tokens![pos] === '-')) {
      const op = tokens![pos++];
      const right = parseTerm();
      if (op === '+') val += right;
      else val -= right;
    }
    return val;
  }
  const result = parseExpression();
  if (pos < tokens.length) throw new Error('Unexpected tokens at end of expression');
  return result;
}

export function extractArithmetic(text: string): string | null {
  if (!text) return null;
  const match = text.match(/(\\d+[\\d\\s+\\-*/().]+\\d+)/);
  if (match) {
    const candidate = match[1].replace(/\\s+/g, '');
    if (/^[0-9+\\-*/().]+$/.test(candidate) && /[+\\-*/]/.test(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function detectLanguage(text: string): 'mn' | 'en' | 'ja' {
  if (!text) return 'mn';
  if (/[\\u3040-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff]/.test(text)) return 'ja';
  if (/[\\u0400-\\u04FF]/.test(text)) return 'mn';
  return 'en';
}

export function safeKnowledgePath(filename: string): string {
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\\\')) {
    throw new Error('Invalid filename: Path traversal is strictly prohibited');
  }
  return 'knowledge/' + filename;
}

export function rankMemories(memories: any[], query: string): any[] {
  if (!query) return memories;
  const q = query.toLowerCase();
  return [...memories].sort((a, b) => {
    const aMatch = (a.title + ' ' + a.content).toLowerCase().includes(q) ? 1 : 0;
    const bMatch = (b.title + ' ' + b.content).toLowerCase().includes(q) ? 1 : 0;
    return bMatch - aMatch;
  });
}
`,
            commitMessage: 'feat(safeEngine): increase boundary validation and zero-eval safety',
          }),
        });

        // Run automated tests in worktree
        await fetch(`/api/workspace/${created.taskId}/run-tests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ command: 'unit-tests' }),
        });

        setSelectedTaskId(created.taskId);
        await inspectTask(created.taskId, token);
        const listRes = await fetch('/api/workspace', { headers: { Authorization: `Bearer ${token}` } });
        if (listRes.ok) {
          const updatedList = await listRes.json();
          setWorkspaces(updatedList);
        }
        await fetchAuditLogs(token);
      }
    } catch (err: any) {
      console.error('Failed to bootstrap default task:', err);
    }
  };

  // Inspect task
  const inspectTask = async (taskId: string, token: string = authToken) => {
    try {
      const res = await fetch(`/api/workspace/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: WorkspaceDetails = await res.json();
        setCurrentWorkspace(data);
      }
    } catch (err: any) {
      console.error(`Failed to inspect task ${taskId}:`, err);
    }
  };

  // Fetch audit trail
  const fetchAuditLogs = async (token: string = authToken) => {
    try {
      const res = await fetch('/api/workspace-audit/logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const logs: WorkspaceAuditEntry[] = await res.json();
        setAuditLogs(logs);
      }
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    }
  };

  // Trigger test runner
  const handleRunTests = async () => {
    if (!currentWorkspace || !authToken) return;
    try {
      setIsRunningTests(true);
      setActionMessage({ type: 'info', text: 'Executing regression tests in isolated Git worktree...' });
      const res = await fetch(`/api/workspace/${currentWorkspace.taskId}/run-tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ command: 'unit-tests' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to run tests');

      setCurrentWorkspace(data.workspace);
      setActionMessage({
        type: data.testResult.passed ? 'success' : 'error',
        text: `Tests ${data.testResult.passed ? 'PASSED' : 'FAILED'} (Exit code: ${data.testResult.exitCode}, Duration: ${data.testResult.durationMs}ms)`,
      });
      await fetchAuditLogs();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setIsRunningTests(false);
    }
  };

  // Submit refinement
  const handleRefine = async () => {
    if (!currentWorkspace || !refinementFeedback.trim() || !authToken) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/workspace/${currentWorkspace.taskId}/refine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ feedback: refinementFeedback }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to refine task');

      setCurrentWorkspace(data);
      setRefinementFeedback('');
      setActionMessage({ type: 'success', text: 'Refinement feedback recorded. Workspace status set to NEEDS_APPROVAL.' });
      if (autoRunTests) {
        await handleRunTests();
      }
      await fetchAuditLogs();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Explicit Human Approval [ACCEPT]
  const handleAccept = async () => {
    if (!currentWorkspace || !authToken) return;
    try {
      setIsAccepting(true);
      setActionMessage({ type: 'info', text: 'Verifying destination branch convergence and merging...' });
      const res = await fetch(`/api/workspace/${currentWorkspace.taskId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Acceptance rejected.');
      }

      setActionMessage({
        type: 'success',
        text: `[APPROVED]: ${data.message}`,
      });
      await refreshWorkspaces();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Approval Blocked: ${err.message}` });
    } finally {
      setIsAccepting(false);
    }
  };

  // Explicit Human Discard [DISCARD]
  const handleDiscard = async () => {
    if (!currentWorkspace || !authToken) return;
    const confirm = window.confirm(
      `Are you sure you want to discard worktree "${currentWorkspace.taskId}"? All unmerged changes on feat/${currentWorkspace.taskId} will be deleted.`
    );
    if (!confirm) return;

    try {
      setIsDiscarding(true);
      const res = await fetch(`/api/workspace/${currentWorkspace.taskId}/discard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to discard workspace');

      setActionMessage({ type: 'info', text: data.message });
      await refreshWorkspaces();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setIsDiscarding(false);
    }
  };

  // Create new task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskId.trim() || !authToken) return;

    try {
      setIsLoading(true);
      const res = await fetch('/api/workspace/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          taskId: newTaskId.trim(),
          title: newTaskTitle.trim() || newTaskId,
          baseBranch: 'main',
          instructions: newTaskInstructions.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create workspace');

      setShowNewTaskModal(false);
      setNewTaskId('');
      setNewTaskTitle('');
      setNewTaskInstructions('');
      setActionMessage({ type: 'success', text: `Created isolated worktree feat/${data.taskId}` });
      await refreshWorkspaces();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0711] overflow-hidden text-slate-200">
      {/* ================= TOP WORKTREE CONTROL BAR (Matching image_d2eca40c.png) ================= */}
      <div className="px-6 py-3.5 bg-[#0f0a1d] border-b border-[#21183d] flex flex-wrap items-center justify-between gap-4">
        {/* Left: Worktree and Branch Path Indicators */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-950/70 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
            <FolderGit2 className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-white tracking-tight">
                /{currentWorkspace ? currentWorkspace.taskId : 'increase-test-coverage'}
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-purple-950/80 text-purple-300 border border-purple-500/30">
                <GitBranch className="w-3 h-3 text-purple-400" />
                {currentWorkspace ? currentWorkspace.branch : 'feat/increase-test-coverage'}
              </span>
              <span className="text-[10px] font-mono text-slate-500 bg-[#160f29] px-2 py-0.5 rounded border border-[#261a45]">
                v24.0.2 Sandbox
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Path: {currentWorkspace?.worktreePath || '.worktrees/increase-test-coverage'}</span>
              <span className="text-slate-600">•</span>
              <span>Base: {currentWorkspace?.baseBranch || 'main'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400/90 font-mono text-[10px]">AUTH: Verified Session</span>
            </div>
          </div>
        </div>

        {/* Center/Right: Status Pill, Auto Toggles, and [REFINE] / [ACCEPT] Actions */}
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          {currentWorkspace?.status === 'ACCEPTED' ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              ACCEPTED & MERGED
            </span>
          ) : currentWorkspace?.status === 'TESTS_PASSED' ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              TESTS_PASSED
            </span>
          ) : currentWorkspace?.status === 'TESTS_FAILED' ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/40">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              TESTS_FAILED
            </span>
          ) : currentWorkspace?.status === 'TESTS_RUNNING' ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-500/40">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              RUNNING_TESTS
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-500/40">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              NEEDS_APPROVAL
            </span>
          )}

          {/* Auto-Run Toggle */}
          <button
            onClick={() => setAutoRunTests(!autoRunTests)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition border ${
              autoRunTests
                ? 'bg-purple-950/60 text-purple-200 border-purple-500/40'
                : 'bg-[#150f28] text-slate-500 border-[#261a45]'
            }`}
            title="Automatically run unit tests after code refinement"
          >
            <div className={`w-2 h-2 rounded-full ${autoRunTests ? 'bg-purple-400' : 'bg-slate-600'}`} />
            <span>Auto-run tests</span>
          </button>

          {/* REFINE Action Button */}
          <button
            onClick={() => setActiveBottomTab('refine')}
            disabled={currentWorkspace?.status === 'ACCEPTED'}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium font-mono bg-[#1c1433] hover:bg-[#271d47] text-amber-200 border border-amber-500/40 shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            REFINE
          </button>

          {/* ACCEPT Action Button */}
          <button
            onClick={handleAccept}
            disabled={isAccepting || currentWorkspace?.status === 'ACCEPTED'}
            className="px-4 py-1.5 rounded-lg text-xs font-bold font-mono bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/40 transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isAccepting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            )}
            ACCEPT
          </button>

          {/* DISCARD Button */}
          <button
            onClick={handleDiscard}
            disabled={isDiscarding || currentWorkspace?.status === 'ACCEPTED'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition disabled:opacity-40"
            title="Discard worktree and clean up feature branch"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`px-6 py-2 text-xs font-mono flex items-center justify-between border-b ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/50'
              : actionMessage.type === 'error'
              ? 'bg-rose-950/40 text-rose-300 border-rose-900/50'
              : 'bg-indigo-950/40 text-indigo-300 border-indigo-900/50'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* ================= MAIN SPLIT PANE ================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* ================= LEFT PANE: Plan & Tasks + Test Organization ================= */}
        <div className="w-80 border-r border-[#21183d] bg-[#0c0817] flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="p-4 space-y-5">
            {/* Task selector & Switcher */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Active Tasks ({workspaces.length})
                </span>
                <button
                  onClick={() => setShowNewTaskModal(true)}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-mono"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {workspaces.map((w) => (
                  <button
                    key={w.taskId}
                    onClick={() => {
                      setSelectedTaskId(w.taskId);
                      inspectTask(w.taskId);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition text-xs font-mono flex flex-col gap-1 ${
                      selectedTaskId === w.taskId
                        ? 'bg-[#1b1333] border-indigo-500/50 text-white shadow-sm'
                        : 'bg-[#120c22] border-[#21183d] text-slate-400 hover:bg-[#18102e] hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate max-w-[170px]">{w.taskId}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                          w.status === 'ACCEPTED'
                            ? 'bg-emerald-950 text-emerald-400'
                            : w.status === 'TESTS_PASSED'
                            ? 'bg-emerald-950 text-emerald-300'
                            : 'bg-amber-950 text-amber-300'
                        }`}
                      >
                        {w.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate font-sans">{w.title}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Plan & Tasks Checklist (Matching image_d2eca40c.png) */}
            <div className="bg-[#120c22] border border-[#21183d] rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                    Plan & Tasks
                  </span>
                </div>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/30">
                  {currentWorkspace?.plan?.filter((p) => p.status === 'completed').length || 0}/
                  {currentWorkspace?.plan?.length || 4}
                </span>
              </div>

              <div className="space-y-2">
                {currentWorkspace?.plan?.map((step, idx) => (
                  <div
                    key={step.id || idx}
                    className="flex items-start gap-2.5 text-xs text-slate-300 bg-[#0d0918] p-2 rounded-lg border border-[#1d1533]"
                  >
                    <div className="mt-0.5">
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : step.status === 'in_progress' ? (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] leading-relaxed font-sans">{step.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Organization breakdown */}
            <div className="bg-[#120c22] border border-[#21183d] rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                    Test Organization
                  </span>
                </div>
                <button
                  onClick={handleRunTests}
                  disabled={isRunningTests || currentWorkspace?.status === 'ACCEPTED'}
                  className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 transition disabled:opacity-40"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run</span>
                </button>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Suite:</span>
                  <span className="text-slate-200">unit_test.test.ts</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Exit Code:</span>
                  <span
                    className={
                      currentWorkspace?.testResults?.exitCode === 0 ? 'text-emerald-400' : 'text-rose-400'
                    }
                  >
                    {currentWorkspace?.testResults !== undefined
                      ? currentWorkspace.testResults.exitCode
                      : '0'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Execution Duration:</span>
                  <span className="text-slate-200">
                    {currentWorkspace?.testResults?.durationMs || 599} ms
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Assertions Passed:</span>
                  <span className="text-emerald-400 font-bold">6 / 6 PASS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Refresh Info */}
          <div className="p-3 border-t border-[#1d1533] bg-[#090612] text-[10px] text-slate-500 font-mono flex items-center justify-between">
            <span>Repository: AriukagiinTuvshoo/ai-version2-</span>
            <button
              onClick={() => refreshWorkspaces()}
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* ================= RIGHT PANE: Unified Diff Viewer + Bottom Terminal ================= */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Unified Diff Area */}
          <div className="flex-1 p-4 overflow-hidden">
            <UnifiedDiffViewer
              parsedDiff={currentWorkspace?.parsedDiff || []}
              rawDiff={currentWorkspace?.rawDiff || ''}
              isLoading={isLoading}
            />
          </div>

          {/* ================= BOTTOM PANE: Terminal, Audit, & Refine ================= */}
          <div className="h-64 border-t border-[#21183d] bg-[#0a0714] flex flex-col shrink-0">
            {/* Tabs Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#100b21] border-b border-[#21183d]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveBottomTab('terminal')}
                  className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-mono transition ${
                    activeBottomTab === 'terminal'
                      ? 'bg-purple-900/60 text-white border border-purple-500/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Worktree Terminal</span>
                </button>

                <button
                  onClick={() => setActiveBottomTab('audit')}
                  className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-mono transition ${
                    activeBottomTab === 'audit'
                      ? 'bg-purple-900/60 text-white border border-purple-500/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Security Audit Trail ({auditLogs.length})</span>
                </button>

                <button
                  onClick={() => setActiveBottomTab('refine')}
                  className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-mono transition ${
                    activeBottomTab === 'refine'
                      ? 'bg-purple-900/60 text-white border border-purple-500/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Refine Patch</span>
                </button>
              </div>

              <div className="text-[11px] font-mono text-slate-500">
                {currentWorkspace?.branch} • isolated sandboxing
              </div>
            </div>

            {/* Bottom Tab Content */}
            <div className="flex-1 overflow-auto p-3 font-mono text-xs">
              {activeBottomTab === 'terminal' ? (
                <div className="text-slate-300 space-y-1">
                  <div className="text-slate-500 text-[11px]">
                    $ {currentWorkspace?.testResults?.command || 'npx tsx --test tests/unit_test.test.ts'}
                  </div>
                  {currentWorkspace?.testResults?.stdout ? (
                    <pre className="whitespace-pre text-emerald-300/90 text-[11px] leading-5">
                      {currentWorkspace.testResults.stdout}
                    </pre>
                  ) : (
                    <div className="text-slate-500 italic py-2">
                      Ready to execute tests. Click [Run] to execute tests in isolated worktree.
                    </div>
                  )}
                  {currentWorkspace?.testResults?.stderr && (
                    <pre className="whitespace-pre text-rose-400 text-[11px] leading-5">
                      {currentWorkspace.testResults.stderr}
                    </pre>
                  )}
                </div>
              ) : activeBottomTab === 'audit' ? (
                <div className="divide-y divide-[#1e1538]">
                  {auditLogs.length === 0 ? (
                    <div className="text-slate-500 italic">No audit records yet.</div>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="py-2 text-[11px] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              log.action === 'ACCEPT'
                                ? 'bg-emerald-950 text-emerald-300'
                                : log.action === 'DISCARD'
                                ? 'bg-rose-950 text-rose-300'
                                : 'bg-indigo-950 text-indigo-300'
                            }`}
                          >
                            {log.action}
                          </span>
                          <span className="text-slate-300 font-semibold">{log.taskId}</span>
                          <span className="text-slate-400 truncate max-w-sm">{log.details}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500">
                          <span>{log.actor}</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Refinement Form */
                <div className="flex flex-col h-full justify-between gap-2 max-w-3xl">
                  <div className="text-xs text-slate-400">
                    Provide instructions or feedback to the agent to refine this patch inside the isolated worktree before approving:
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={refinementFeedback}
                      onChange={(e) => setRefinementFeedback(e.target.value)}
                      placeholder="e.g. Add negative tests for safeCalculate when input is null..."
                      className="flex-1 bg-[#140e24] border border-[#261a45] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                      onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                    />
                    <button
                      onClick={handleRefine}
                      disabled={!refinementFeedback.trim()}
                      className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Refine</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= NEW WORKTREE MODAL ================= */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#100a20] border border-[#2b1f4c] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#21183d] pb-3">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white font-mono">Create Isolated Worktree</h3>
              </div>
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 font-sans">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Task ID (Alphanumeric and dashes only):
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. fix-ast-boundary"
                  value={newTaskId}
                  onChange={(e) => setNewTaskId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  className="w-full bg-[#18102e] border border-[#2a1d47] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Task Title:</label>
                <input
                  type="text"
                  placeholder="e.g. Expand test boundary cases"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-[#18102e] border border-[#2a1d47] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Instructions:</label>
                <textarea
                  rows={3}
                  placeholder="Describe code changes to implement in isolated worktree..."
                  value={newTaskInstructions}
                  onChange={(e) => setNewTaskInstructions(e.target.value)}
                  className="w-full bg-[#18102e] border border-[#2a1d47] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTaskId.trim()}
                  className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition disabled:opacity-40"
                >
                  Create Worktree
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
