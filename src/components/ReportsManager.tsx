import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  RefreshCw,
  Copy,
  Download,
  Check,
  Calendar,
  FileCheck,
} from 'lucide-react';
import { ReportItem } from '../types';

interface ReportsManagerProps {
  uiLang: 'mn' | 'en';
}

export const ReportsManager: React.FC<ReportsManagerProps> = ({ uiLang }) => {
  const isMn = uiLang === 'mn';
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      const data: ReportItem[] = await res.json();
      setReports(data);
      if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      } else if (selectedReport) {
        const found = data.find((r) => r.filename === selectedReport.filename);
        if (found) setSelectedReport(found);
      }
    } catch {
      console.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleCopy = () => {
    if (!selectedReport) return;
    navigator.clipboard.writeText(selectedReport.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!selectedReport) return;
    const blob = new Blob([selectedReport.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedReport.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">
              {isMn ? 'Баталгаажсан Тайлангууд (reports/)' : 'Verified Reports Archive (reports/)'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isMn
              ? 'Хэрэглэгчийн тодорхой зөвшөөрөлтэйгөөр reports/ хавтсанд хадгалагдсан Markdown тайлангууд.'
              : 'Markdown reports written with explicit user consent and verification status tags.'}
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{isMn ? 'Шинэчлэх' : 'Refresh'}</span>
        </button>
      </div>

      {/* Grid: Reports list & Reader */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* List */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300 uppercase">
              {isMn ? 'Бүртгэгдсэн тайлан' : 'Generated Reports'} ({reports.length})
            </span>
          </div>

          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {reports.length === 0 ? (
              <p className="text-xs text-slate-500 p-4 text-center">
                {isMn
                  ? 'Одоогоор тайлан алга байна. Агент дээр "Save to reports/" товч дарж үүсгэнэ.'
                  : 'No reports saved yet. Click "Save to reports/" in the agent console.'}
              </p>
            ) : (
              reports.map((r) => {
                const isSelected = selectedReport?.filename === r.filename;
                return (
                  <button
                    key={r.filename}
                    onClick={() => setSelectedReport(r)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition border flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200'
                        : 'bg-slate-950/60 border-slate-850 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText
                        className={`h-4 w-4 shrink-0 ${
                          isSelected ? 'text-indigo-400' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate font-mono font-medium">{r.filename}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Markdown Reader */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            {selectedReport ? (
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-400" />
                <span className="font-mono text-xs sm:text-sm font-semibold text-white">
                  reports/{selectedReport.filename}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">
                {isMn ? 'Тайлан сонгоно уу' : 'Select a report'}
              </span>
            )}

            {selectedReport && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs transition"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copied ? (isMn ? 'Хууллаа' : 'Copied') : isMn ? 'Хуулах' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{isMn ? 'Татах' : 'Download'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-[340px] bg-slate-950 border border-slate-850 rounded-lg p-4 font-mono text-xs text-slate-200 leading-relaxed overflow-y-auto whitespace-pre-wrap">
            {selectedReport ? (
              selectedReport.content
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                {isMn ? 'Тайлан сонгогдоогүй байна' : 'No report selected'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
