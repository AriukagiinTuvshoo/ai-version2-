import React, { useState } from 'react';
import { WorkspaceDiffFile } from '../types';
import { FileCode, Plus, Minus, Code2, Eye, Copy, Check } from 'lucide-react';

interface UnifiedDiffViewerProps {
  parsedDiff: WorkspaceDiffFile[];
  rawDiff: string;
  isLoading?: boolean;
}

export const UnifiedDiffViewer: React.FC<UnifiedDiffViewerProps> = ({
  parsedDiff,
  rawDiff,
  isLoading = false,
}) => {
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'unified' | 'raw'>('unified');
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    if (!rawDiff) return;
    navigator.clipboard.writeText(rawDiff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0d091a] text-slate-400 font-mono text-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Generating exact unified diff from isolated worktree...</span>
        </div>
      </div>
    );
  }

  if (!rawDiff || rawDiff.trim().length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0d091a] border border-[#201738] rounded-xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-300 mb-3">
          <Code2 className="w-6 h-6" />
        </div>
        <h4 className="text-white font-semibold text-sm">No Uncommitted or Pending Changes</h4>
        <p className="text-slate-400 text-xs mt-1 max-w-sm">
          The isolated worktree branch is identical to the base branch. Apply patches or write new code to view unified diffs.
        </p>
      </div>
    );
  }

  const activeFile = parsedDiff[activeFileIndex] || parsedDiff[0];

  return (
    <div className="flex flex-col h-full bg-[#0d091a] border border-[#201738] rounded-xl overflow-hidden shadow-xl">
      {/* Top File Selector & View Toggle Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#130d24] border-b border-[#201738]">
        {/* File tabs */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
          {parsedDiff.map((file, idx) => (
            <button
              key={file.file + idx}
              onClick={() => setActiveFileIndex(idx)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition shrink-0 ${
                activeFileIndex === idx
                  ? 'bg-purple-900/60 text-white border border-purple-500/50 shadow-sm'
                  : 'bg-[#18112e] text-slate-400 hover:text-slate-200 hover:bg-[#20173d] border border-transparent'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium truncate max-w-[200px]">{file.file}</span>
              <span className="flex items-center gap-1 text-[10px]">
                {file.additions > 0 && (
                  <span className="text-emerald-400 font-bold">+{file.additions}</span>
                )}
                {file.deletions > 0 && (
                  <span className="text-rose-400 font-bold">-{file.deletions}</span>
                )}
              </span>
            </button>
          ))}
        </div>

        {/* View mode toggle and copy */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-[#0a0714] p-0.5 rounded-lg border border-[#201738]">
            <button
              onClick={() => setViewMode('unified')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition ${
                viewMode === 'unified'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unified Diff
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition ${
                viewMode === 'raw'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw Patch
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#18112e] hover:bg-[#20173d] text-slate-300 text-xs border border-[#251b42] transition"
            title="Copy diff to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="font-mono text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-0 font-mono text-xs leading-relaxed bg-[#0a0714]">
        {viewMode === 'raw' ? (
          <pre className="p-4 text-slate-300 whitespace-pre overflow-x-auto text-[11px] leading-5 selection:bg-purple-900/50">
            {rawDiff}
          </pre>
        ) : activeFile && activeFile.hunks.length > 0 ? (
          <div className="divide-y divide-[#18112c]">
            {activeFile.hunks.map((hunk, hIdx) => (
              <div key={hIdx} className="mb-2 last:mb-0">
                {/* Hunk Header */}
                <div className="bg-[#150f28] text-indigo-300/80 px-4 py-1 text-[11px] font-mono border-y border-[#21183d] flex items-center justify-between">
                  <span>{hunk.header}</span>
                  <span className="text-[10px] text-slate-500 font-sans uppercase tracking-wider">Hunk #{hIdx + 1}</span>
                </div>

                {/* Hunk Lines */}
                <div className="table w-full border-collapse">
                  {hunk.lines.map((line, lIdx) => {
                    const isAddition = line.type === 'addition';
                    const isDeletion = line.type === 'deletion';

                    return (
                      <div
                        key={lIdx}
                        className={`table-row transition-colors ${
                          isAddition
                            ? 'bg-emerald-950/30 text-emerald-200 hover:bg-emerald-950/50 border-l-2 border-emerald-500'
                            : isDeletion
                            ? 'bg-rose-950/30 text-rose-200 hover:bg-rose-950/50 border-l-2 border-rose-500'
                            : 'text-slate-400 hover:bg-[#130d24]'
                        }`}
                      >
                        {/* Old line number */}
                        <span className="table-cell select-none text-right pr-3 pl-2 py-0.5 text-slate-600 w-12 border-r border-[#1a1330] text-[10px]">
                          {line.oldLineNo !== undefined ? line.oldLineNo : ''}
                        </span>
                        {/* New line number */}
                        <span className="table-cell select-none text-right pr-3 pl-2 py-0.5 text-slate-600 w-12 border-r border-[#1a1330] text-[10px]">
                          {line.newLineNo !== undefined ? line.newLineNo : ''}
                        </span>
                        {/* Prefix symbol */}
                        <span
                          className={`table-cell select-none px-2 py-0.5 font-bold w-6 text-center ${
                            isAddition ? 'text-emerald-400' : isDeletion ? 'text-rose-400' : 'text-slate-600'
                          }`}
                        >
                          {isAddition ? '+' : isDeletion ? '-' : ' '}
                        </span>
                        {/* Line content */}
                        <span className="table-cell px-3 py-0.5 whitespace-pre font-mono text-[11px] leading-5">
                          {line.content || ' '}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">
            No line changes recorded for this file.
          </div>
        )}
      </div>
    </div>
  );
};
