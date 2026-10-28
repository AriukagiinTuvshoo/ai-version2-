import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  RefreshCw,
  Cpu,
  Database,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Server,
  Zap,
} from 'lucide-react';
import { DiagnosticData, AcceptanceTestSuiteResponse } from '../types';

interface DiagnosticsTestSuiteProps {
  uiLang: 'mn' | 'en';
}

export const DiagnosticsTestSuite: React.FC<DiagnosticsTestSuiteProps> = ({ uiLang }) => {
  const isMn = uiLang === 'mn';
  const [diagData, setDiagData] = useState<DiagnosticData | null>(null);
  const [testSuite, setTestSuite] = useState<AcceptanceTestSuiteResponse | null>(null);
  const [runningTests, setRunningTests] = useState(false);
  const [loadingDiag, setLoadingDiag] = useState(false);

  const fetchDiagnostics = async () => {
    setLoadingDiag(true);
    try {
      const res = await fetch('/api/diagnostics');
      const data = await res.json();
      setDiagData(data);
    } catch (err) {
      console.error('Failed to load diagnostics', err);
    } finally {
      setLoadingDiag(false);
    }
  };

  const runAcceptanceTests = async () => {
    setRunningTests(true);
    try {
      const res = await fetch('/api/run-acceptance-tests');
      const data = await res.json();
      setTestSuite(data);
    } catch (err) {
      console.error('Failed to run acceptance tests', err);
    } finally {
      setRunningTests(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
    runAcceptanceTests();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-5">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              {isMn ? 'Системийн Оношилгоо ба Хүлээн Авах Тестүүд' : 'System Diagnostics & Acceptance Tests'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isMn
              ? 'README_autonomous_agent_v4.md болон test_autonomous_agent_v4.py файлын 7 үндсэн шалгуурын шалгалт.'
              : 'Verifies the 7 core safety boundaries and acceptance criteria from README_autonomous_agent_v4.md.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDiagnostics}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingDiag ? 'animate-spin' : ''}`} />
            <span>{isMn ? 'Оношилгоог шинэчлэх' : 'Refresh Diagnostics'}</span>
          </button>

          <button
            onClick={runAcceptanceTests}
            disabled={runningTests}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition shadow-md shadow-indigo-600/20"
          >
            <Play className={`h-3.5 w-3.5 ${runningTests ? 'animate-spin' : ''}`} />
            <span>{isMn ? 'Тестүүдийг ажиллуулах' : 'Run All Tests'}</span>
          </button>
        </div>
      </div>

      {/* Diagnostics Cards */}
      {diagData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>{isMn ? 'Арифметик AST' : 'Safe AST Parser'}</span>
              <Zap className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
              {diagData.calculator_self_test ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> 33,600 OK
                </span>
              ) : (
                <span className="text-rose-400">FAIL</span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-mono">1250 * 24 + 3600</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>{isMn ? 'Мэдлэгийн файлууд' : 'Knowledge Files'}</span>
              <FileText className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-sm sm:text-base font-bold text-white font-mono">
              {diagData.knowledge_files_count} file(s)
            </div>
            <p className="text-[10px] text-slate-500 font-mono">knowledge/*.txt, .md</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>{isMn ? 'Санах ойн бичлэг' : 'Memory Records'}</span>
              <Database className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-sm sm:text-base font-bold text-white font-mono">
              V4: {diagData.v4_memory_count} | KV: {diagData.kv_memory_count}
            </div>
            <p className="text-[10px] text-slate-500 font-mono">Conversations + KV</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>{isMn ? 'Үндсэн загвар' : 'Primary Model'}</span>
              <Cpu className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-xs sm:text-sm font-bold text-white truncate font-mono">
              {diagData.primary_model}
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Key: {diagData.api_key_configured ? 'Configured' : 'Offline/Fallback'}
            </p>
          </div>
        </div>
      )}

      {/* Acceptance Tests Results Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white">
              {isMn ? 'Хүлээн авах шалгуурууд (7 acceptance checks)' : '7 Acceptance Checks'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isMn
                ? 'Дүрэм, математик тооцоолол, хэлний шалгалт, файлын хандалт, замын аюулгүй байдал.'
                : 'Safety rules, mathematical evaluation, bilingual detection, and path security.'}
            </p>
          </div>

          {testSuite && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200">
                {isMn ? 'Нийт:' : 'Passed:'}{' '}
                <strong className="text-emerald-400 font-bold">{testSuite.passed}</strong> /{' '}
                {testSuite.total}
              </span>
            </div>
          )}
        </div>

        {/* Tests list */}
        <div className="space-y-2.5">
          {testSuite?.results.map((res, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition ${
                res.status === 'PASS'
                  ? 'bg-slate-950/70 border-emerald-500/30'
                  : 'bg-rose-950/20 border-rose-500/40'
              }`}
            >
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-2">
                  {res.status === 'PASS' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-slate-200 font-mono">{res.test}</span>
                </div>
                <p className="text-[11px] text-slate-400 pl-6">{res.details}</p>
              </div>

              <div className="shrink-0 pl-6 sm:pl-0">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    res.status === 'PASS'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                      : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  {res.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
